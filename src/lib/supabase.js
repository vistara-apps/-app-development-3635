import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database table names
export const TABLES = {
  USERS: 'users',
  WORKOUTS: 'workouts',
  EXERCISES: 'exercises',
  WORKOUT_EXERCISES: 'workout_exercises',
  RECOMMENDATIONS: 'recommendations',
  SUBSCRIPTIONS: 'subscriptions'
}

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  ELITE: 'elite'
}

// Subscription limits
export const SUBSCRIPTION_LIMITS = {
  [SUBSCRIPTION_TIERS.FREE]: {
    maxWorkoutsPerMonth: 10,
    maxRecommendationsPerWeek: 2,
    advancedAnalytics: false,
    aiCoaching: false
  },
  [SUBSCRIPTION_TIERS.PRO]: {
    maxWorkoutsPerMonth: 100,
    maxRecommendationsPerWeek: 10,
    advancedAnalytics: true,
    aiCoaching: false
  },
  [SUBSCRIPTION_TIERS.ELITE]: {
    maxWorkoutsPerMonth: -1, // unlimited
    maxRecommendationsPerWeek: -1, // unlimited
    advancedAnalytics: true,
    aiCoaching: true
  }
}
