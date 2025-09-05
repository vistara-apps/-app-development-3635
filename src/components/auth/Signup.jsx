import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

const Signup = ({ onToggleMode }) => {
  const { signUp, loading } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    setErrors({})

    try {
      const { error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName.trim()
      })
      
      if (error) {
        if (error.message.includes('User already registered')) {
          setErrors({ email: 'An account with this email already exists' })
        } else {
          setErrors({ general: error.message })
        }
      } else {
        setSuccess(true)
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto p-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-dark-text mb-2">Check Your Email</h1>
          <p className="text-dark-muted mb-6">
            We've sent a confirmation link to <strong>{formData.email}</strong>. 
            Please check your email and click the link to activate your account.
          </p>
          <Button
            onClick={onToggleMode}
            variant="outline"
            className="w-full"
          >
            Back to Sign In
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark-text mb-2">Create Account</h1>
        <p className="text-dark-muted">Join FitFlow AI and start your fitness journey</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.general}</p>
          </div>
        )}

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-dark-text mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-muted" />
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={`pl-10 ${errors.fullName ? 'border-red-300 focus:border-red-500' : ''}`}
              disabled={isSubmitting || loading}
            />
          </div>
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-dark-text mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-muted" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={`pl-10 ${errors.email ? 'border-red-300 focus:border-red-500' : ''}`}
              disabled={isSubmitting || loading}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-dark-text mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-muted" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className={`pl-10 pr-10 ${errors.password ? 'border-red-300 focus:border-red-500' : ''}`}
              disabled={isSubmitting || loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-dark-text"
              disabled={isSubmitting || loading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-text mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-muted" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-red-300 focus:border-red-500' : ''}`}
              disabled={isSubmitting || loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-muted hover:text-dark-text"
              disabled={isSubmitting || loading}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-1"
            required
          />
          <label htmlFor="terms" className="ml-2 text-sm text-dark-muted">
            I agree to the{' '}
            <a href="#" className="text-primary hover:text-primary/80 font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:text-primary/80 font-medium">
              Privacy Policy
            </a>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isSubmitting || loading}
        >
          {isSubmitting || loading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Creating account...
            </div>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-dark-muted">
          Already have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-primary hover:text-primary/80 font-medium"
            disabled={isSubmitting || loading}
          >
            Sign in
          </button>
        </p>
      </div>
    </Card>
  )
}

export default Signup
