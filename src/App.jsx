import React, { useState } from 'react'
import AppShell from './components/AppShell'
import Dashboard from './components/Dashboard'
import WorkoutLogger from './components/WorkoutLogger'
import Progress from './components/Progress'
import Recommendations from './components/Recommendations'
import Settings from './components/Settings'
import AuthPage from './components/auth/AuthPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { WorkoutProvider } from './context/WorkoutContext'
import { AuthProvider, useAuth } from './context/AuthContext'

function AppContent() {
  const [activeView, setActiveView] = useState('dashboard')
  const { user, profile } = useAuth()

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard user={profile} />
      case 'logger':
        return <WorkoutLogger />
      case 'progress':
        return <Progress />
      case 'recommendations':
        return <Recommendations />
      case 'settings':
        return <Settings user={profile} />
      default:
        return <Dashboard user={profile} />
    }
  }

  return (
    <ProtectedRoute fallback={<AuthPage />}>
      <WorkoutProvider>
        <div className="min-h-screen bg-dark-bg text-dark-text">
          <AppShell 
            activeView={activeView} 
            setActiveView={setActiveView}
            user={profile}
          >
            {renderActiveView()}
          </AppShell>
        </div>
      </WorkoutProvider>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
