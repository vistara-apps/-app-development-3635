import { supabase, TABLES } from '../lib/supabase'

export class WorkoutService {
  // Get all workouts for the current user
  static async getUserWorkouts(userId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from(TABLES.WORKOUTS)
        .select(`
          *,
          workout_exercises (
            *,
            exercises (
              id,
              name,
              category,
              muscle_groups
            )
          )
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Transform the data to match the expected format
      const transformedWorkouts = data.map(workout => ({
        workoutId: workout.id,
        userId: workout.user_id,
        name: workout.name,
        startTime: new Date(workout.start_time),
        endTime: workout.end_time ? new Date(workout.end_time) : null,
        duration: workout.duration,
        notes: workout.notes,
        exercises: workout.workout_exercises.map(we => ({
          exerciseId: we.id,
          exerciseName: we.exercises.name,
          category: we.exercises.category,
          muscleGroups: we.exercises.muscle_groups,
          sets: we.sets,
          reps: we.reps,
          weight: we.weight,
          restTime: we.rest_time,
          notes: we.notes,
          orderInWorkout: we.order_in_workout
        })),
        createdAt: new Date(workout.created_at),
        updatedAt: new Date(workout.updated_at)
      }))

      return { data: transformedWorkouts, error: null }
    } catch (error) {
      console.error('Error fetching user workouts:', error)
      return { data: null, error }
    }
  }

  // Create a new workout
  static async createWorkout(userId, workoutData) {
    try {
      const { data: workout, error: workoutError } = await supabase
        .from(TABLES.WORKOUTS)
        .insert({
          user_id: userId,
          name: workoutData.name,
          start_time: workoutData.startTime,
          end_time: workoutData.endTime,
          duration: workoutData.duration,
          notes: workoutData.notes
        })
        .select()
        .single()

      if (workoutError) throw workoutError

      // Add exercises to the workout
      if (workoutData.exercises && workoutData.exercises.length > 0) {
        const workoutExercises = workoutData.exercises.map((exercise, index) => ({
          workout_id: workout.id,
          exercise_id: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          rest_time: exercise.restTime,
          notes: exercise.notes,
          order_in_workout: index + 1
        }))

        const { error: exercisesError } = await supabase
          .from(TABLES.WORKOUT_EXERCISES)
          .insert(workoutExercises)

        if (exercisesError) throw exercisesError
      }

      return { data: workout, error: null }
    } catch (error) {
      console.error('Error creating workout:', error)
      return { data: null, error }
    }
  }

  // Update an existing workout
  static async updateWorkout(workoutId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.WORKOUTS)
        .update(updates)
        .eq('id', workoutId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating workout:', error)
      return { data: null, error }
    }
  }

  // Delete a workout
  static async deleteWorkout(workoutId) {
    try {
      const { error } = await supabase
        .from(TABLES.WORKOUTS)
        .delete()
        .eq('id', workoutId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting workout:', error)
      return { error }
    }
  }

  // Get all available exercises
  static async getExercises(category = null) {
    try {
      let query = supabase
        .from(TABLES.EXERCISES)
        .select('*')
        .order('name')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching exercises:', error)
      return { data: null, error }
    }
  }

  // Get workout statistics for a user
  static async getWorkoutStats(userId, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from(TABLES.WORKOUTS)
        .select(`
          id,
          start_time,
          duration,
          workout_exercises (
            sets,
            reps,
            weight
          )
        `)
        .eq('user_id', userId)
        .gte('start_time', startDate.toISOString())
        .order('start_time', { ascending: true })

      if (error) throw error

      // Calculate statistics
      const stats = {
        totalWorkouts: data.length,
        totalMinutes: data.reduce((sum, workout) => sum + (workout.duration || 0), 0),
        averageDuration: 0,
        totalVolume: 0,
        workoutsByDay: {}
      }

      if (stats.totalWorkouts > 0) {
        stats.averageDuration = Math.round(stats.totalMinutes / stats.totalWorkouts)
      }

      data.forEach(workout => {
        const date = new Date(workout.start_time).toDateString()
        stats.workoutsByDay[date] = (stats.workoutsByDay[date] || 0) + 1

        // Calculate total volume (sets * reps * weight)
        workout.workout_exercises.forEach(exercise => {
          if (exercise.weight && exercise.reps && exercise.sets) {
            const exerciseVolume = exercise.sets * 
              (Array.isArray(exercise.reps) ? exercise.reps.reduce((a, b) => a + b, 0) : exercise.reps) *
              (Array.isArray(exercise.weight) ? exercise.weight.reduce((a, b) => a + b, 0) / exercise.weight.length : exercise.weight)
            stats.totalVolume += exerciseVolume
          }
        })
      })

      return { data: stats, error: null }
    } catch (error) {
      console.error('Error fetching workout stats:', error)
      return { data: null, error }
    }
  }

  // Get personal records for a user
  static async getPersonalRecords(userId, exerciseId = null) {
    try {
      let query = supabase
        .from(TABLES.USER_PROGRESS)
        .select(`
          *,
          exercises (
            name,
            category
          )
        `)
        .eq('user_id', userId)
        .eq('personal_record', true)
        .order('date', { ascending: false })

      if (exerciseId) {
        query = query.eq('exercise_id', exerciseId)
      }

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching personal records:', error)
      return { data: null, error }
    }
  }

  // Update user progress and check for personal records
  static async updateUserProgress(userId, exerciseId, progressData) {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Check if there's existing progress for today
      const { data: existingProgress } = await supabase
        .from(TABLES.USER_PROGRESS)
        .select('*')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .eq('date', today)
        .single()

      // Check if this is a personal record
      const { data: previousBest } = await supabase
        .from(TABLES.USER_PROGRESS)
        .select('max_weight, max_reps, total_volume')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .order('max_weight', { ascending: false })
        .limit(1)
        .single()

      const isPersonalRecord = !previousBest || 
        progressData.maxWeight > (previousBest.max_weight || 0) ||
        (progressData.maxWeight === previousBest.max_weight && progressData.maxReps > (previousBest.max_reps || 0))

      const progressRecord = {
        user_id: userId,
        exercise_id: exerciseId,
        date: today,
        max_weight: progressData.maxWeight,
        max_reps: progressData.maxReps,
        total_volume: progressData.totalVolume,
        personal_record: isPersonalRecord
      }

      let result
      if (existingProgress) {
        // Update existing record
        const { data, error } = await supabase
          .from(TABLES.USER_PROGRESS)
          .update(progressRecord)
          .eq('id', existingProgress.id)
          .select()
          .single()

        result = { data, error }
      } else {
        // Create new record
        const { data, error } = await supabase
          .from(TABLES.USER_PROGRESS)
          .insert(progressRecord)
          .select()
          .single()

        result = { data, error }
      }

      if (result.error) throw result.error

      return { data: result.data, error: null, isPersonalRecord }
    } catch (error) {
      console.error('Error updating user progress:', error)
      return { data: null, error, isPersonalRecord: false }
    }
  }
}
