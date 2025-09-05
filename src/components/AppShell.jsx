import React from 'react'
import { 
  Activity, 
  BarChart3, 
  Brain, 
  Settings, 
  User,
  Dumbbell,
  Crown,
  LogOut
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const AppShell = ({ children, activeView, setActiveView, user }) => {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }
  const navigationItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'logger', icon: Dumbbell, label: 'Log Workout' },
    { id: 'progress', icon: Activity, label: 'Progress' },
    { id: 'recommendations', icon: Brain, label: 'AI Insights' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ]

  return (
    <div className="flex h-screen bg-dark-bg">
      {/* Sidebar */}
      <div className="w-64 bg-dark-surface border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-dark-text">FitFlow AI</h1>
              <p className="text-sm text-dark-muted">Smart Fitness Tracking</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeView === item.id
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-dark-muted hover:text-dark-text hover:bg-dark-card'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-dark-card">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dark-text truncate">
                {user?.full_name || user?.email || 'User'}
              </p>
              <div className="flex items-center space-x-1">
                <Crown className="w-3 h-3 text-accent" />
                <p className="text-xs text-accent capitalize">
                  {user?.subscription_tier || 'free'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-dark-muted hover:text-dark-text hover:bg-dark-surface rounded-lg transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppShell
