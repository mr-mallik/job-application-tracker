'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'

export function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Registration successful! Check console for verification code.')
      setIsVerifying(true)
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Email verified!')
      setIsVerifying(false)
      setIsLogin(true)
      setCode('')
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success('Welcome back!')
      onLogin(data.user, data.token)
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Check console for reset code.')
      setIsResetting(true)
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code, newPassword }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Password reset!')
      setIsForgotPassword(false)
      setIsResetting(false)
      setIsLogin(true)
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Briefcase className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Job Application Tracker</CardTitle>
          <CardDescription>
            {isVerifying ? 'Verify your email' : isForgotPassword ? (isResetting ? 'Reset password' : 'Forgot password') : isLogin ? 'Sign in' : 'Create account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div><Label>Verification Code</Label><Input placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsVerifying(false)}>Back</Button>
            </form>
          ) : isForgotPassword ? (
            isResetting ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div><Label>Reset Code</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required /></div>
                <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset'}</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setIsForgotPassword(false); setIsResetting(false); }}>Back</Button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Code'}</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setIsForgotPassword(false)}>Back</Button>
              </form>
            )
          ) : isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div><Label>Email</Label><Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
              <div className="flex justify-between text-sm">
                <button type="button" className="text-primary hover:underline" onClick={() => setIsForgotPassword(true)}>Forgot password?</button>
                <button type="button" className="text-primary hover:underline" onClick={() => setIsLogin(false)}>Create account</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div><Label>Name</Label><Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div><Label>Email</Label><Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
              <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsLogin(true)}>Already have an account?</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
