import OpenAI from 'openai'

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true // Note: In production, this should be handled server-side
    })
    this.cache = new Map()
    this.cacheExpiry = 30 * 60 * 1000 // 30 minutes
  }

  // Generate personalized workout recommendations
  async generateRecommendations(userProfile, workoutHistory, options = {}) {
    try {
      const cacheKey = this.generateCacheKey('recommendations', userProfile.id, workoutHistory)
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const prompt = this.buildRecommendationPrompt(userProfile, workoutHistory, options)
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are FitFlow AI, an expert fitness coach and personal trainer with deep knowledge of exercise science, progressive overload, and personalized training. You analyze workout data to provide actionable, science-based recommendations that help users achieve their fitness goals safely and effectively.

Your recommendations should be:
- Specific and actionable
- Based on the user's actual performance data
- Progressive and realistic
- Focused on addressing weaknesses or plateaus
- Considerate of recovery and injury prevention

Always provide confidence scores (0-100) for your recommendations based on the strength of the data supporting them.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })

      const recommendations = this.parseRecommendations(response.choices[0].message.content)
      
      // Cache the result
      this.setCache(cacheKey, recommendations)
      
      return { data: recommendations, error: null }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      return { data: null, error: error.message }
    }
  }

  // Generate workout analysis and insights
  async analyzeWorkout(workoutData, userHistory = []) {
    try {
      const prompt = this.buildWorkoutAnalysisPrompt(workoutData, userHistory)
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a fitness analysis expert. Analyze the provided workout data and provide insights about performance, form suggestions, and areas for improvement. Be encouraging but honest about areas that need work.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 800
      })

      const analysis = this.parseWorkoutAnalysis(response.choices[0].message.content)
      
      return { data: analysis, error: null }
    } catch (error) {
      console.error('Error analyzing workout:', error)
      return { data: null, error: error.message }
    }
  }

  // Generate exercise suggestions based on goals and equipment
  async suggestExercises(goals, equipment, muscleGroups, difficulty = 'intermediate') {
    try {
      const cacheKey = this.generateCacheKey('exercises', goals, equipment, muscleGroups, difficulty)
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      const prompt = `Suggest 5-8 exercises for someone with the following criteria:
Goals: ${goals.join(', ')}
Available Equipment: ${equipment.join(', ')}
Target Muscle Groups: ${muscleGroups.join(', ')}
Difficulty Level: ${difficulty}

For each exercise, provide:
1. Exercise name
2. Primary muscle groups worked
3. Brief description of proper form
4. Recommended sets and reps
5. Difficulty level (beginner/intermediate/advanced)
6. Equipment needed

Format as JSON array with these fields: name, muscleGroups, description, sets, reps, difficulty, equipment`

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a certified personal trainer with expertise in exercise selection and program design. Provide safe, effective exercise recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 1200
      })

      const exercises = this.parseExerciseSuggestions(response.choices[0].message.content)
      
      // Cache the result
      this.setCache(cacheKey, exercises)
      
      return { data: exercises, error: null }
    } catch (error) {
      console.error('Error suggesting exercises:', error)
      return { data: null, error: error.message }
    }
  }

  // Build recommendation prompt from user data
  buildRecommendationPrompt(userProfile, workoutHistory, options) {
    const recentWorkouts = workoutHistory.slice(0, 10) // Last 10 workouts
    const exerciseFrequency = this.analyzeExerciseFrequency(workoutHistory)
    const progressTrends = this.analyzeProgressTrends(workoutHistory)

    return `Analyze this user's fitness data and provide 3-5 personalized recommendations:

USER PROFILE:
- Subscription Tier: ${userProfile.subscription_tier}
- Fitness Goals: ${userProfile.fitness_goals?.join(', ') || 'General fitness'}
- Preferred Units: ${userProfile.preferred_units}

RECENT WORKOUT SUMMARY:
- Total Workouts (last 30 days): ${workoutHistory.length}
- Average Duration: ${this.calculateAverageDuration(recentWorkouts)} minutes
- Most Frequent Exercises: ${Object.entries(exerciseFrequency).slice(0, 5).map(([name, count]) => `${name} (${count}x)`).join(', ')}

PROGRESS TRENDS:
${progressTrends}

RECENT WORKOUTS:
${recentWorkouts.map((workout, index) => `
Workout ${index + 1} (${workout.startTime?.toDateString()}):
- Duration: ${workout.duration} minutes
- Exercises: ${workout.exercises.map(ex => `${ex.exerciseName} (${ex.sets}x${Array.isArray(ex.reps) ? ex.reps.join(',') : ex.reps} @ ${Array.isArray(ex.weight) ? ex.weight.join(',') : ex.weight}lbs)`).join(', ')}
`).join('')}

Please provide recommendations in this JSON format:
{
  "recommendations": [
    {
      "type": "progressive_overload|exercise_variety|recovery|technique|program_structure",
      "title": "Clear, actionable title",
      "description": "Detailed explanation of the issue and why it matters",
      "action": "Specific action the user should take",
      "priority": "high|medium|low",
      "confidence": 85,
      "reasoning": "Brief explanation of why this recommendation was made"
    }
  ]
}

Focus on the most impactful improvements based on the data patterns you observe.`
  }

  // Build workout analysis prompt
  buildWorkoutAnalysisPrompt(workoutData, userHistory) {
    return `Analyze this workout and provide insights:

WORKOUT DATA:
- Date: ${workoutData.startTime?.toDateString()}
- Duration: ${workoutData.duration} minutes
- Exercises: ${workoutData.exercises.map(ex => 
    `${ex.exerciseName}: ${ex.sets} sets of ${Array.isArray(ex.reps) ? ex.reps.join(',') : ex.reps} reps at ${Array.isArray(ex.weight) ? ex.weight.join(',') : ex.weight}lbs`
  ).join('; ')}

HISTORICAL CONTEXT:
- Previous workouts: ${userHistory.length}
- Average duration: ${this.calculateAverageDuration(userHistory)} minutes

Provide analysis in JSON format:
{
  "overall_rating": "excellent|good|fair|needs_improvement",
  "strengths": ["strength1", "strength2"],
  "areas_for_improvement": ["area1", "area2"],
  "volume_analysis": "Analysis of training volume",
  "balance_analysis": "Analysis of muscle group balance",
  "suggestions": ["suggestion1", "suggestion2"]
}`
  }

  // Parse AI recommendations response
  parseRecommendations(content) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.recommendations || []
      }
      
      // Fallback: parse text format
      return this.parseTextRecommendations(content)
    } catch (error) {
      console.error('Error parsing recommendations:', error)
      return []
    }
  }

  // Parse text-based recommendations as fallback
  parseTextRecommendations(content) {
    const recommendations = []
    const lines = content.split('\n').filter(line => line.trim())
    
    let currentRec = null
    for (const line of lines) {
      if (line.includes('Recommendation') || line.match(/^\d+\./)) {
        if (currentRec) recommendations.push(currentRec)
        currentRec = {
          type: 'general',
          title: line.replace(/^\d+\.?\s*/, '').replace('Recommendation:', '').trim(),
          description: '',
          action: '',
          priority: 'medium',
          confidence: 75,
          reasoning: ''
        }
      } else if (currentRec && line.trim()) {
        if (line.toLowerCase().includes('action:')) {
          currentRec.action = line.replace(/action:/i, '').trim()
        } else {
          currentRec.description += (currentRec.description ? ' ' : '') + line.trim()
        }
      }
    }
    
    if (currentRec) recommendations.push(currentRec)
    return recommendations
  }

  // Parse workout analysis response
  parseWorkoutAnalysis(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      // Fallback analysis
      return {
        overall_rating: 'good',
        strengths: ['Completed workout'],
        areas_for_improvement: ['Continue consistent training'],
        volume_analysis: 'Workout volume appears appropriate',
        balance_analysis: 'Exercise selection covers major muscle groups',
        suggestions: ['Maintain consistency', 'Focus on progressive overload']
      }
    } catch (error) {
      console.error('Error parsing workout analysis:', error)
      return null
    }
  }

  // Parse exercise suggestions response
  parseExerciseSuggestions(content) {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return []
    } catch (error) {
      console.error('Error parsing exercise suggestions:', error)
      return []
    }
  }

  // Helper methods
  analyzeExerciseFrequency(workouts) {
    const frequency = {}
    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        frequency[exercise.exerciseName] = (frequency[exercise.exerciseName] || 0) + 1
      })
    })
    return Object.fromEntries(
      Object.entries(frequency).sort(([,a], [,b]) => b - a)
    )
  }

  analyzeProgressTrends(workouts) {
    if (workouts.length < 2) return 'Insufficient data for trend analysis'
    
    const recent = workouts.slice(0, 5)
    const older = workouts.slice(5, 10)
    
    const recentAvgDuration = this.calculateAverageDuration(recent)
    const olderAvgDuration = this.calculateAverageDuration(older)
    
    if (recentAvgDuration > olderAvgDuration) {
      return 'Workout duration trending upward - good consistency'
    } else if (recentAvgDuration < olderAvgDuration) {
      return 'Workout duration trending downward - consider maintaining longer sessions'
    }
    return 'Workout duration stable'
  }

  calculateAverageDuration(workouts) {
    if (!workouts.length) return 0
    return Math.round(workouts.reduce((sum, w) => sum + (w.duration || 0), 0) / workouts.length)
  }

  // Cache management
  generateCacheKey(...args) {
    return args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join('|')
  }

  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
}

export const openaiService = new OpenAIService()
