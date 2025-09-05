import React from 'react'
import { useAuth } from '../../context/AuthContext'

const ProtectedRoute = ({ children, fallback = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback
  }

  return children
}

export default ProtectedRoute
