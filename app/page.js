'use client'

import { useState, useEffect } from 'react'
import { Loader2, Briefcase } from 'lucide-react'
import { AuthPage } from '@/components/AuthPage'
import { Dashboard } from '@/components/Dashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token')
    const u = localStorage.getItem('user')
    if (t && u) { 
      setToken(t)
      setUser(JSON.parse(u)) 
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <div className="space-y-6 text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg mx-auto animate-pulse">
              <Briefcase className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-2 -right-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Job Application Tracker</h2>
            <p className="text-sm text-muted-foreground">Loading your applications...</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <AuthPage onLogin={(u, t) => { setUser(u); setToken(t); }} />
  }
  
  return (
    <Dashboard 
      user={user} 
      token={token} 
      onLogout={() => { 
        localStorage.clear()
        setUser(null)
        setToken(null)
      }} 
      onUserUpdate={setUser} 
    />
  )
}
