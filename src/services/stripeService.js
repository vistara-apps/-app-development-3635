import { loadStripe } from '@stripe/stripe-js'

class StripeService {
  constructor() {
    this.stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
    this.baseUrl = import.meta.env.VITE_APP_URL || 'http://localhost:5173'
  }

  // Initialize Stripe
  async getStripe() {
    return await this.stripePromise
  }

  // Create checkout session for subscription
  async createCheckoutSession(priceId, userId, successUrl, cancelUrl) {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId,
          successUrl: successUrl || `${this.baseUrl}/billing/success`,
          cancelUrl: cancelUrl || `${this.baseUrl}/billing/cancel`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()
      
      const stripe = await this.getStripe()
      const { error } = await stripe.redirectToCheckout({ sessionId })
      
      if (error) {
        throw error
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { success: false, error: error.message }
    }
  }

  // Create customer portal session
  async createPortalSession(customerId, returnUrl) {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          returnUrl: returnUrl || `${this.baseUrl}/billing`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const { url } = await response.json()
      window.location.href = url

      return { success: true, error: null }
    } catch (error) {
      console.error('Error creating portal session:', error)
      return { success: false, error: error.message }
    }
  }

  // Get subscription details
  async getSubscription(customerId) {
    try {
      const response = await fetch(`/api/stripe/subscription/${customerId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const subscription = await response.json()
      return { data: subscription, error: null }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      return { data: null, error: error.message }
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId) {
    try {
      const response = await fetch(`/api/stripe/subscription/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      const result = await response.json()
      return { data: result, error: null }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return { data: null, error: error.message }
    }
  }

  // Update subscription
  async updateSubscription(subscriptionId, newPriceId) {
    try {
      const response = await fetch(`/api/stripe/subscription/${subscriptionId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPriceId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      const result = await response.json()
      return { data: result, error: null }
    } catch (error) {
      console.error('Error updating subscription:', error)
      return { data: null, error: error.message }
    }
  }

  // Get pricing information
  getPricingPlans() {
    return {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
          'Up to 10 workouts per month',
          'Basic progress tracking',
          '2 AI recommendations per week',
          'Standard exercise library'
        ],
        limits: {
          maxWorkoutsPerMonth: 10,
          maxRecommendationsPerWeek: 2,
          advancedAnalytics: false,
          aiCoaching: false
        }
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        price: 9,
        interval: 'month',
        priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
        features: [
          'Up to 100 workouts per month',
          'Advanced progress analytics',
          '10 AI recommendations per week',
          'Full exercise library',
          'Workout templates',
          'Progress photos'
        ],
        limits: {
          maxWorkoutsPerMonth: 100,
          maxRecommendationsPerWeek: 10,
          advancedAnalytics: true,
          aiCoaching: false
        }
      },
      elite: {
        id: 'elite',
        name: 'Elite',
        price: 19,
        interval: 'month',
        priceId: import.meta.env.VITE_STRIPE_ELITE_PRICE_ID,
        features: [
          'Unlimited workouts',
          'Advanced progress analytics',
          'Unlimited AI recommendations',
          'Full exercise library',
          'Workout templates',
          'Progress photos',
          'AI coaching & form analysis',
          'Custom workout plans',
          'Priority support'
        ],
        limits: {
          maxWorkoutsPerMonth: -1, // unlimited
          maxRecommendationsPerWeek: -1, // unlimited
          advancedAnalytics: true,
          aiCoaching: true
        }
      }
    }
  }

  // Check if user has reached subscription limits
  checkSubscriptionLimits(userTier, usage) {
    const plans = this.getPricingPlans()
    const plan = plans[userTier] || plans.free
    const limits = plan.limits

    const results = {
      canCreateWorkout: true,
      canGetRecommendations: true,
      canAccessAdvancedAnalytics: limits.advancedAnalytics,
      canAccessAiCoaching: limits.aiCoaching,
      workoutLimitReached: false,
      recommendationLimitReached: false
    }

    // Check workout limits
    if (limits.maxWorkoutsPerMonth > 0 && usage.workoutsThisMonth >= limits.maxWorkoutsPerMonth) {
      results.canCreateWorkout = false
      results.workoutLimitReached = true
    }

    // Check recommendation limits
    if (limits.maxRecommendationsPerWeek > 0 && usage.recommendationsThisWeek >= limits.maxRecommendationsPerWeek) {
      results.canGetRecommendations = false
      results.recommendationLimitReached = true
    }

    return results
  }

  // Format price for display
  formatPrice(price, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  // Get upgrade suggestions based on current usage
  getUpgradeSuggestions(currentTier, usage) {
    const plans = this.getPricingPlans()
    const currentPlan = plans[currentTier] || plans.free
    const suggestions = []

    if (currentTier === 'free') {
      if (usage.workoutsThisMonth >= 8) {
        suggestions.push({
          reason: 'workout_limit',
          message: 'You\'re approaching your monthly workout limit',
          suggestedPlan: 'pro',
          benefit: 'Get 10x more workouts per month'
        })
      }
      
      if (usage.recommendationsThisWeek >= 1) {
        suggestions.push({
          reason: 'recommendation_limit',
          message: 'Unlock more AI-powered insights',
          suggestedPlan: 'pro',
          benefit: 'Get 5x more recommendations per week'
        })
      }
    }

    if (currentTier === 'pro') {
      if (usage.workoutsThisMonth >= 80) {
        suggestions.push({
          reason: 'workout_limit',
          message: 'You\'re a power user! Consider unlimited access',
          suggestedPlan: 'elite',
          benefit: 'Unlimited workouts + AI coaching'
        })
      }
    }

    return suggestions
  }
}

export const stripeService = new StripeService()
