import React, { useState } from 'react'
import Login from './Login'
import Signup from './Signup'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

const AuthPage = () => {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const { resetPassword } = useAuth()

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
  }

  const handleForgotPassword = () => {
    setShowForgotPassword(true)
    setForgotPasswordEmail('')
    setForgotPasswordSuccess(false)
  }

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!forgotPasswordEmail) return

    setForgotPasswordLoading(true)
    const { error } = await resetPassword(forgotPasswordEmail)
    
    if (!error) {
      setForgotPasswordSuccess(true)
    }
    
    setForgotPasswordLoading(false)
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPassword(false)
    setForgotPasswordEmail('')
    setForgotPasswordSuccess(false)
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {mode === 'login' ? (
          <Login 
            onToggleMode={toggleMode}
            onForgotPassword={handleForgotPassword}
          />
        ) : (
          <Signup onToggleMode={toggleMode} />
        )}
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPassword}
        onClose={closeForgotPasswordModal}
        title="Reset Password"
      >
        {forgotPasswordSuccess ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-dark-text mb-2">Check Your Email</h3>
            <p className="text-dark-muted mb-6">
              We've sent a password reset link to <strong>{forgotPasswordEmail}</strong>
            </p>
            <Button onClick={closeForgotPasswordModal} variant="primary" className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <p className="text-dark-muted mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-dark-text mb-2">
                Email Address
              </label>
              <Input
                id="resetEmail"
                type="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={forgotPasswordLoading}
              />
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={closeForgotPasswordModal}
                variant="outline"
                className="flex-1"
                disabled={forgotPasswordLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={forgotPasswordLoading || !forgotPasswordEmail}
              >
                {forgotPasswordLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default AuthPage
