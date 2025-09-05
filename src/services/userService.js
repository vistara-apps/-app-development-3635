import { supabase, TABLES } from '../lib/supabase'

export class UserService {
  // Get user profile with subscription details
  static async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return { data: null, error }
    }
  }

  // Update user profile
  static async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating user profile:', error)
      return { data: null, error }
    }
  }

  // Update subscription tier
  static async updateSubscriptionTier(userId, tier, stripeCustomerId = null) {
    try {
      const updates = {
        subscription_tier: tier,
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      }

      if (stripeCustomerId) {
        updates.stripe_customer_id = stripeCustomerId
      }

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      // Log subscription event
      await this.logSubscriptionEvent(userId, 'subscription_updated', {
        new_tier: tier,
        stripe_customer_id: stripeCustomerId
      })

      return { data, error: null }
    } catch (error) {
      console.error('Error updating subscription tier:', error)
      return { data: null, error }
    }
  }

  // Get user usage statistics
  static async getUserUsage(userId) {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())

      // Get workout count for this month
      const { data: workouts, error: workoutError } = await supabase
        .from(TABLES.WORKOUTS)
        .select('id')
        .eq('user_id', userId)
        .gte('start_time', startOfMonth.toISOString())

      if (workoutError) throw workoutError

      // Get recommendation count for this week
      const { data: recommendations, error: recError } = await supabase
        .from(TABLES.RECOMMENDATIONS)
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', startOfWeek.toISOString())

      if (recError) throw recError

      const usage = {
        workoutsThisMonth: workouts?.length || 0,
        recommendationsThisWeek: recommendations?.length || 0,
        period: {
          month: startOfMonth.toISOString(),
          week: startOfWeek.toISOString()
        }
      }

      return { data: usage, error: null }
    } catch (error) {
      console.error('Error fetching user usage:', error)
      return { data: null, error }
    }
  }

  // Log subscription events
  static async logSubscriptionEvent(userId, eventType, metadata = {}) {
    try {
      const { error } = await supabase
        .from(TABLES.SUBSCRIPTION_EVENTS)
        .insert({
          user_id: userId,
          event_type: eventType,
          metadata,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error logging subscription event:', error)
      return { error }
    }
  }

  // Get user's subscription history
  static async getSubscriptionHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SUBSCRIPTION_EVENTS)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching subscription history:', error)
      return { data: null, error }
    }
  }

  // Check if user can perform action based on subscription limits
  static async checkUserLimits(userId, action) {
    try {
      const { data: profile } = await this.getUserProfile(userId)
      const { data: usage } = await this.getUserUsage(userId)

      if (!profile || !usage) {
        return { canPerform: false, reason: 'Unable to verify subscription status' }
      }

      const tier = profile.subscription_tier || 'free'
      
      // Define limits for each tier
      const limits = {
        free: {
          maxWorkoutsPerMonth: 10,
          maxRecommendationsPerWeek: 2,
          advancedAnalytics: false,
          aiCoaching: false
        },
        pro: {
          maxWorkoutsPerMonth: 100,
          maxRecommendationsPerWeek: 10,
          advancedAnalytics: true,
          aiCoaching: false
        },
        elite: {
          maxWorkoutsPerMonth: -1, // unlimited
          maxRecommendationsPerWeek: -1, // unlimited
          advancedAnalytics: true,
          aiCoaching: true
        }
      }

      const userLimits = limits[tier] || limits.free

      switch (action) {
        case 'create_workout':
          if (userLimits.maxWorkoutsPerMonth === -1) {
            return { canPerform: true }
          }
          if (usage.workoutsThisMonth >= userLimits.maxWorkoutsPerMonth) {
            return { 
              canPerform: false, 
              reason: `Monthly workout limit reached (${userLimits.maxWorkoutsPerMonth})`,
              suggestedUpgrade: tier === 'free' ? 'pro' : 'elite'
            }
          }
          return { canPerform: true }

        case 'get_recommendations':
          if (userLimits.maxRecommendationsPerWeek === -1) {
            return { canPerform: true }
          }
          if (usage.recommendationsThisWeek >= userLimits.maxRecommendationsPerWeek) {
            return { 
              canPerform: false, 
              reason: `Weekly recommendation limit reached (${userLimits.maxRecommendationsPerWeek})`,
              suggestedUpgrade: tier === 'free' ? 'pro' : 'elite'
            }
          }
          return { canPerform: true }

        case 'advanced_analytics':
          if (!userLimits.advancedAnalytics) {
            return { 
              canPerform: false, 
              reason: 'Advanced analytics requires Pro or Elite subscription',
              suggestedUpgrade: 'pro'
            }
          }
          return { canPerform: true }

        case 'ai_coaching':
          if (!userLimits.aiCoaching) {
            return { 
              canPerform: false, 
              reason: 'AI coaching requires Elite subscription',
              suggestedUpgrade: 'elite'
            }
          }
          return { canPerform: true }

        default:
          return { canPerform: true }
      }
    } catch (error) {
      console.error('Error checking user limits:', error)
      return { canPerform: false, reason: 'Error checking subscription limits' }
    }
  }

  // Get user's fitness goals and preferences
  static async getUserPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('fitness_goals, preferred_units')
        .eq('id', userId)
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return { data: null, error }
    }
  }

  // Update user's fitness goals
  static async updateFitnessGoals(userId, goals) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          fitness_goals: goals,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      console.error('Error updating fitness goals:', error)
      return { data: null, error }
    }
  }

  // Delete user account and all associated data
  static async deleteUserAccount(userId) {
    try {
      // This will cascade delete all related data due to foreign key constraints
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', userId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      console.error('Error deleting user account:', error)
      return { error }
    }
  }

  // Get user dashboard summary
  static async getDashboardSummary(userId) {
    try {
      const [profileResult, usageResult] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserUsage(userId)
      ])

      if (profileResult.error || usageResult.error) {
        throw new Error('Failed to fetch dashboard data')
      }

      // Get recent workouts count
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentWorkouts, error: workoutError } = await supabase
        .from(TABLES.WORKOUTS)
        .select('id, duration, start_time')
        .eq('user_id', userId)
        .gte('start_time', thirtyDaysAgo.toISOString())
        .order('start_time', { ascending: false })

      if (workoutError) throw workoutError

      // Get unread recommendations
      const { data: unreadRecommendations, error: recError } = await supabase
        .from(TABLES.RECOMMENDATIONS)
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false)

      if (recError) throw recError

      const summary = {
        profile: profileResult.data,
        usage: usageResult.data,
        recentWorkouts: recentWorkouts?.length || 0,
        totalWorkoutMinutes: recentWorkouts?.reduce((sum, w) => sum + (w.duration || 0), 0) || 0,
        unreadRecommendations: unreadRecommendations?.length || 0,
        lastWorkoutDate: recentWorkouts?.[0]?.start_time || null
      }

      return { data: summary, error: null }
    } catch (error) {
      console.error('Error fetching dashboard summary:', error)
      return { data: null, error }
    }
  }
}
