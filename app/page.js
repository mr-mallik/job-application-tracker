'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Briefcase, Plus, LogOut, User, FileText, Sparkles, ExternalLink, 
  Trash2, Edit, Calendar, Building2, MapPin, DollarSign, Clock,
  Download, Copy, RefreshCw, X, Check, AlertCircle
} from 'lucide-react'

// Status colors
const statusColors = {
  saved: 'bg-gray-100 text-gray-800',
  applied: 'bg-blue-100 text-blue-800',
  interview: 'bg-yellow-100 text-yellow-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-purple-100 text-purple-800'
}

// Auth Component
function AuthPage({ onLogin }) {
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Registration successful! Check console for verification code.')
      setIsVerifying(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Email verified! You can now login.')
      setIsVerifying(false)
      setIsLogin(true)
      setCode('')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success('Welcome back!')
      onLogin(data.user, data.token)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Check console for reset code.')
      setIsResetting(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Password reset successful!')
      setIsForgotPassword(false)
      setIsResetting(false)
      setIsLogin(true)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
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
            {isVerifying ? 'Verify your email' : 
             isForgotPassword ? (isResetting ? 'Reset your password' : 'Forgot password') :
             isLogin ? 'Sign in to your account' : 'Create a new account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label>Verification Code</Label>
                <Input placeholder="Enter code from console" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsVerifying(false)}>
                Back
              </Button>
            </form>
          ) : isForgotPassword ? (
            isResetting ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Reset Code</Label>
                  <Input placeholder="Enter code from console" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setIsForgotPassword(false); setIsResetting(false); }}>
                  Back to Login
                </Button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setIsForgotPassword(false)}>
                  Back to Login
                </Button>
              </form>
            )
          ) : isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <div className="flex justify-between text-sm">
                <button type="button" className="text-primary hover:underline" onClick={() => setIsForgotPassword(true)}>
                  Forgot password?
                </button>
                <button type="button" className="text-primary hover:underline" onClick={() => setIsLogin(false)}>
                  Create account
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsLogin(true)}>
                Already have an account? Sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Job Form Component
function JobForm({ job, onSave, onCancel, token }) {
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [formData, setFormData] = useState({
    title: job?.title || '',
    company: job?.company || '',
    location: job?.location || '',
    salary: job?.salary || '',
    closingDate: job?.closingDate || '',
    appliedDate: job?.appliedDate || new Date().toISOString().split('T')[0],
    status: job?.status || 'saved',
    url: job?.url || '',
    description: job?.description || '',
    requirements: job?.requirements || '',
    benefits: job?.benefits || '',
    notes: job?.notes || ''
  })

  const handleScrape = async () => {
    if (!formData.url) {
      toast.error('Please enter a job URL first')
      return
    }
    setScraping(true)
    try {
      const res = await fetch('/api/jobs/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ url: formData.url })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setFormData(prev => ({
        ...prev,
        title: data.jobDetails.title || prev.title,
        company: data.jobDetails.company || prev.company,
        location: data.jobDetails.location || prev.location,
        salary: data.jobDetails.salary || prev.salary,
        closingDate: data.jobDetails.closingDate || prev.closingDate,
        description: data.jobDetails.description || prev.description,
        requirements: data.jobDetails.requirements || prev.requirements,
        benefits: data.jobDetails.benefits || prev.benefits
      }))
      toast.success('Job details extracted successfully!')
    } catch (error) {
      toast.error('Failed to extract job details: ' + error.message)
    } finally {
      setScraping(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = job ? `/api/jobs/${job.id}` : '/api/jobs'
      const method = job ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success(job ? 'Job updated!' : 'Job added!')
      onSave(data.job)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Job URL</Label>
          <Input placeholder="https://..." value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={handleScrape} disabled={scraping}>
            {scraping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span className="ml-2">{scraping ? 'Extracting...' : 'Extract'}</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Job Title *</Label>
          <Input placeholder="Software Engineer" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        </div>
        <div>
          <Label>Company *</Label>
          <Input placeholder="Company Name" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} required />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Location</Label>
          <Input placeholder="London, UK" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
        </div>
        <div>
          <Label>Salary</Label>
          <Input placeholder="£50,000 - £70,000" value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Closing Date</Label>
          <Input type="date" value={formData.closingDate} onChange={(e) => setFormData({...formData, closingDate: e.target.value})} />
        </div>
        <div>
          <Label>Applied Date</Label>
          <Input type="date" value={formData.appliedDate} onChange={(e) => setFormData({...formData, appliedDate: e.target.value})} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="saved">Saved</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label>Job Description</Label>
        <Textarea placeholder="Job description..." className="min-h-[100px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
      </div>
      
      <div>
        <Label>Requirements</Label>
        <Textarea placeholder="Requirements..." className="min-h-[80px]" value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} />
      </div>
      
      <div>
        <Label>Notes</Label>
        <Textarea placeholder="Your notes..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (job ? 'Update Job' : 'Add Job')}
        </Button>
      </div>
    </form>
  )
}

// Document Editor Component
function DocumentEditor({ job, documentType, token, onUpdate }) {
  const docLabels = { resume: 'Resume', coverLetter: 'Cover Letter', supportingStatement: 'Supporting Statement' }
  const maxPages = { resume: 2, coverLetter: 2, supportingStatement: 3 }
  
  const [content, setContent] = useState(job[documentType]?.content || '')
  const [refinedContent, setRefinedContent] = useState(job[documentType]?.refinedContent || '')
  const [preferences, setPreferences] = useState('')
  const [refining, setRefining] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleRefine = async () => {
    if (!content) {
      toast.error('Please enter some content first')
      return
    }
    if (!job.description) {
      toast.error('Job description is required for refinement')
      return
    }
    
    setRefining(true)
    try {
      const res = await fetch('/api/documents/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          documentType,
          content,
          jobDescription: job.description + '\n\nRequirements:\n' + job.requirements,
          userPreferences: preferences
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setRefinedContent(data.refinedContent)
      toast.success('Document refined successfully!')
    } catch (error) {
      toast.error('Failed to refine document: ' + error.message)
    } finally {
      setRefining(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          [documentType]: { content, refinedContent }
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      toast.success('Document saved!')
      onUpdate(data.job)
    } catch (error) {
      toast.error('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const downloadTxt = () => {
    const text = refinedContent || content
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.company}-${docLabels[documentType]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const text = refinedContent || content
    
    // Set font size and line height
    doc.setFontSize(11)
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin
    const lineHeight = 6
    
    // Split text into lines
    const lines = doc.splitTextToSize(text, maxWidth)
    
    let y = margin
    const maxY = pageHeight - margin
    
    for (let i = 0; i < lines.length; i++) {
      if (y + lineHeight > maxY) {
        doc.addPage()
        y = margin
      }
      doc.text(lines[i], margin, y)
      y += lineHeight
    }
    
    doc.save(`${job.company}-${docLabels[documentType]}.pdf`)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(refinedContent || content)
    toast.success('Copied to clipboard!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{docLabels[documentType]} (Max {maxPages[documentType]} A4 pages)</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={downloadTxt}>
            <Download className="w-4 h-4 mr-1" /> TXT
          </Button>
          <Button size="sm" variant="outline" onClick={downloadPdf}>
            <Download className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            <Copy className="w-4 h-4 mr-1" /> Copy
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Your Content / Draft</Label>
          <Textarea 
            placeholder={`Enter your ${docLabels[documentType].toLowerCase()} content or draft...`}
            className="min-h-[300px] font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>AI Refined Version</Label>
          <Textarea 
            placeholder="Click 'Refine with AI' to generate..."
            className="min-h-[300px] font-mono text-sm bg-muted"
            value={refinedContent}
            onChange={(e) => setRefinedContent(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Preferences / Instructions for AI</Label>
        <Input 
          placeholder="e.g., Focus on leadership experience, highlight Python skills..."
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
        />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={handleRefine} disabled={refining}>
          {refining ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {refining ? 'Refining...' : 'Refine with AI'}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Document'}
        </Button>
      </div>
    </div>
  )
}

// Job Details Panel
function JobDetailsPanel({ job, token, onUpdate, onClose, onDelete }) {
  const [activeTab, setActiveTab] = useState('details')
  const [editing, setEditing] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionFeedback, setRejectionFeedback] = useState(job.rejectionFeedback || '')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'rejected' && job.status !== 'rejected') {
      setShowRejectDialog(true)
      return
    }
    
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(data.job)
      toast.success('Status updated!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleRejectWithFeedback = async () => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'rejected', rejectionFeedback })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(data.job)
      toast.success('Status updated with feedback!')
      setShowRejectDialog(false)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (editing) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Edit Job</h2>
          <Button variant="ghost" size="icon" onClick={() => setEditing(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1 p-4">
          <JobForm job={job} token={token} onSave={(updatedJob) => { onUpdate(updatedJob); setEditing(false); }} onCancel={() => setEditing(false)} />
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">{job.title}</h2>
          <p className="text-sm text-muted-foreground">{job.company}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 border-b space-y-3">
        <div className="flex flex-wrap gap-2">
          {job.location && <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{job.location}</Badge>}
          {job.salary && <Badge variant="outline"><DollarSign className="w-3 h-3 mr-1" />{job.salary}</Badge>}
          {job.closingDate && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Closes: {job.closingDate}</Badge>}
          {job.appliedDate && <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />Applied: {job.appliedDate}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Status:</span>
          <Select value={job.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saved">Saved</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-1" />View Job</Button>
            </a>
          )}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
          <TabsTrigger value="supportingStatement">Statement</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <div className="p-4">
            <TabsContent value="details" className="mt-0 space-y-4">
              {job.description && (
                <div>
                  <h4 className="font-medium mb-2">Job Description</h4>
                  <p className="text-sm whitespace-pre-wrap">{job.description}</p>
                </div>
              )}
              {job.requirements && (
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <p className="text-sm whitespace-pre-wrap">{job.requirements}</p>
                </div>
              )}
              {job.benefits && (
                <div>
                  <h4 className="font-medium mb-2">Benefits</h4>
                  <p className="text-sm whitespace-pre-wrap">{job.benefits}</p>
                </div>
              )}
              {job.notes && (
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
                </div>
              )}
              {job.status === 'rejected' && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Rejection Feedback
                  </h4>
                  <p className="text-sm text-red-700 whitespace-pre-wrap">{job.rejectionFeedback || 'No feedback recorded.'}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowRejectDialog(true)}>
                    Edit Feedback
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resume" className="mt-0">
              <DocumentEditor job={job} documentType="resume" token={token} onUpdate={onUpdate} />
            </TabsContent>
            
            <TabsContent value="coverLetter" className="mt-0">
              <DocumentEditor job={job} documentType="coverLetter" token={token} onUpdate={onUpdate} />
            </TabsContent>
            
            <TabsContent value="supportingStatement" className="mt-0">
              <DocumentEditor job={job} documentType="supportingStatement" token={token} onUpdate={onUpdate} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
      
      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Rejection Feedback</DialogTitle>
            <DialogDescription>
              Record any feedback or notes about why this application was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection feedback or notes..."
              className="min-h-[150px]"
              value={rejectionFeedback}
              onChange={(e) => setRejectionFeedback(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button onClick={handleRejectWithFeedback} disabled={updatingStatus}>
              {updatingStatus ? 'Saving...' : 'Save & Mark Rejected'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Dashboard Component
function Dashboard({ user, token, onLogout }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showAddJob, setShowAddJob] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileData, setProfileData] = useState({ name: user.name, phone: user.phone || '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const res = await fetch('/api/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setJobs(data.jobs)
      }
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to delete')
      
      setJobs(jobs.filter(j => j.id !== jobId))
      if (selectedJob?.id === jobId) setSelectedJob(null)
      toast.success('Job deleted!')
    } catch (error) {
      toast.error('Failed to delete job')
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success('Profile updated!')
      setShowProfile(false)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)
  
  const stats = {
    total: jobs.length,
    applied: jobs.filter(j => j.status === 'applied').length,
    interview: jobs.filter(j => j.status === 'interview').length,
    offer: jobs.filter(j => j.status === 'offer').length,
    rejected: jobs.filter(j => j.status === 'rejected').length
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold">Job Tracker</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)}>
              <User className="w-4 h-4 mr-2" /> Profile
            </Button>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('all')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Jobs</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('applied')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.applied}</div>
              <div className="text-sm text-muted-foreground">Applied</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('interview')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.interview}</div>
              <div className="text-sm text-muted-foreground">Interviews</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('offer')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.offer}</div>
              <div className="text-sm text-muted-foreground">Offers</div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('rejected')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-sm text-muted-foreground">Rejected</div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="flex gap-6">
          {/* Job List */}
          <div className={`${selectedJob ? 'w-1/2' : 'w-full'} transition-all`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Applications</h2>
                {filter !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilter('all')}>
                    {filter} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
              <Button onClick={() => setShowAddJob(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Job
              </Button>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium">No jobs found</h3>
                  <p className="text-sm text-muted-foreground mt-1">Start by adding your first job application</p>
                  <Button className="mt-4" onClick={() => setShowAddJob(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Job
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredJobs.map(job => (
                  <Card 
                    key={job.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{job.company}</span>
                            {job.location && (
                              <>
                                <span className="text-muted-foreground">•</span>
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{job.location}</span>
                              </>
                            )}
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1 mt-1">
                              <DollarSign className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{job.salary}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={statusColors[job.status]}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </Badge>
                          {job.closingDate && (
                            <span className="text-xs text-muted-foreground">Closes: {job.closingDate}</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Job Details Panel */}
          {selectedJob && (
            <div className="w-1/2">
              <Card className="h-[calc(100vh-280px)] overflow-hidden">
                <JobDetailsPanel 
                  job={selectedJob} 
                  token={token}
                  onUpdate={(updated) => {
                    setJobs(jobs.map(j => j.id === updated.id ? updated : j))
                    setSelectedJob(updated)
                  }}
                  onClose={() => setSelectedJob(null)}
                  onDelete={() => handleDeleteJob(selectedJob.id)}
                />
              </Card>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Job Dialog */}
      <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Job</DialogTitle>
            <DialogDescription>
              Enter job details manually or paste a URL to extract details automatically.
            </DialogDescription>
          </DialogHeader>
          <JobForm 
            token={token}
            onSave={(newJob) => {
              setJobs([newJob, ...jobs])
              setShowAddJob(false)
              setSelectedJob(newJob)
            }}
            onCancel={() => setShowAddJob(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} placeholder="+44 123 456 7890" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfile(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Main App
export default function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
    toast.success('Logged out successfully')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />
  }

  return <Dashboard user={user} token={token} onLogout={handleLogout} />
}
