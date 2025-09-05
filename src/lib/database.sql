-- FitFlow AI Database Schema
-- This file contains the complete database schema for the FitFlow AI application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  fitness_goals TEXT[],
  preferred_units TEXT DEFAULT 'imperial' CHECK (preferred_units IN ('imperial', 'metric')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workouts table
CREATE TABLE public.workouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises table (master list of exercises)
CREATE TABLE public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- e.g., 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT[], -- e.g., 'barbell', 'dumbbell', 'bodyweight', 'machine'
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout exercises (junction table for workout-exercise relationship)
CREATE TABLE public.workout_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_id UUID REFERENCES public.workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  sets INTEGER NOT NULL DEFAULT 1,
  reps INTEGER[],
  weight DECIMAL[],
  rest_time INTEGER, -- in seconds
  notes TEXT,
  order_in_workout INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Recommendations table
CREATE TABLE public.recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- e.g., 'progressive_overload', 'exercise_variety', 'recovery'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_items TEXT[],
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  is_read BOOLEAN DEFAULT FALSE,
  is_applied BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  date DATE NOT NULL,
  max_weight DECIMAL,
  max_reps INTEGER,
  total_volume DECIMAL, -- sets * reps * weight
  personal_record BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, exercise_id, date)
);

-- Subscription events (for tracking subscription changes)
CREATE TABLE public.subscription_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL, -- e.g., 'subscription_created', 'subscription_updated', 'subscription_canceled'
  old_tier TEXT,
  new_tier TEXT,
  stripe_event_id TEXT UNIQUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX idx_workouts_start_time ON public.workouts(start_time);
CREATE INDEX idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);
CREATE INDEX idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX idx_recommendations_created_at ON public.recommendations(created_at);
CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_date ON public.user_progress(date);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own workouts" ON public.workouts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
  FOR ALL USING (auth.uid() = (SELECT user_id FROM public.workouts WHERE id = workout_id));

CREATE POLICY "Users can view own recommendations" ON public.recommendations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription events" ON public.subscription_events
  FOR SELECT USING (auth.uid() = user_id);

-- Everyone can read exercises (master list)
CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT USING (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample exercises
INSERT INTO public.exercises (name, category, muscle_groups, equipment, instructions) VALUES
('Bench Press', 'chest', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell', 'bench'], 'Lie on bench, lower bar to chest, press up'),
('Squats', 'legs', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['barbell', 'squat rack'], 'Stand with feet shoulder-width apart, squat down, stand up'),
('Deadlifts', 'back', ARRAY['hamstrings', 'glutes', 'back', 'traps'], ARRAY['barbell'], 'Lift bar from ground to hip level with straight back'),
('Pull-ups', 'back', ARRAY['lats', 'biceps', 'rhomboids'], ARRAY['pull-up bar'], 'Hang from bar, pull body up until chin over bar'),
('Overhead Press', 'shoulders', ARRAY['shoulders', 'triceps', 'core'], ARRAY['barbell', 'dumbbell'], 'Press weight overhead from shoulder level'),
('Rows', 'back', ARRAY['lats', 'rhomboids', 'biceps'], ARRAY['barbell', 'dumbbell', 'cable'], 'Pull weight to torso, squeeze shoulder blades'),
('Incline Press', 'chest', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell', 'dumbbell', 'incline bench'], 'Press weight on inclined bench'),
('Dips', 'chest', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['dip bars', 'bodyweight'], 'Lower body between bars, push back up'),
('Lunges', 'legs', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['bodyweight', 'dumbbell'], 'Step forward, lower back knee, return to start'),
('Plank', 'core', ARRAY['core', 'shoulders'], ARRAY['bodyweight'], 'Hold body straight in push-up position');
