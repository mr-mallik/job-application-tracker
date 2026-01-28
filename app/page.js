'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { AuthPage } from '@/components/AuthPage'
import { Dashboard } from '@/components/Dashboard'

export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('token'), u = localStorage.getItem('user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setLoading(false)
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>
  if (!user) return <AuthPage onLogin={(u, t) => { setUser(u); setToken(t); }} />
  return <Dashboard user={user} token={token} onLogout={() => { localStorage.clear(); setUser(null); setToken(null); }} onUserUpdate={setUser} />
}
