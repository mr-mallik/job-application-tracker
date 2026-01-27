'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Briefcase, Plus, LogOut, User, FileText, Sparkles, ExternalLink, 
  Trash2, Edit, Calendar, Building2, MapPin, DollarSign, Clock,
  Download, Copy, RefreshCw, X, Check, AlertCircle, Eye, FileEdit,
  GraduationCap, Code, FolderOpen, Heart, Award, Maximize2
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

// A4 dimensions: 210mm x 297mm, at 96 DPI = 794 x 1123 px
// Using scaled version for preview: 595 x 842 (75% scale)
const A4_WIDTH = 595
const A4_HEIGHT = 842

// Full A4 Resume PDF Preview Component
function ResumePDFPreview({ content, userProfile, maxPages = 2, compact = false }) {
  const [pages, setPages] = useState([])
  const [overflow, setOverflow] = useState(false)
  
  const parseResumeContent = useCallback((text, profile) => {
    if (!text && !profile) return { header: null, sections: [] }
    
    const header = profile ? {
      name: profile.name || '',
      designation: profile.designation || '',
      email: profile.email || '',
      phone: profile.phone || '',
      linkedin: profile.linkedin || '',
      portfolio: profile.portfolio || ''
    } : null
    
    const sections = []
    if (!text) return { header, sections }
    
    const lines = text.split('\n')
    let currentSection = null
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return
      
      if (trimmed.match(/^#\s+[A-Z]/) || trimmed.match(/^##\s+/) || 
          (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('-'))) {
        if (currentSection) sections.push(currentSection)
        currentSection = {
          title: trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, ''),
          items: []
        }
      } else if (currentSection) {
        currentSection.items.push(trimmed)
      }
    })
    
    if (currentSection) sections.push(currentSection)
    return { header, sections }
  }, [])

  useEffect(() => {
    const { header, sections } = parseResumeContent(content, userProfile)
    
    if (!header && sections.length === 0) {
      setPages([])
      setOverflow(false)
      return
    }

    const LINES_PER_PAGE = compact ? 38 : 45
    const HEADER_LINES = 5
    
    const newPages = []
    let currentPage = { header: null, sections: [] }
    let currentLineCount = 0
    
    if (header) {
      currentPage.header = header
      currentLineCount = HEADER_LINES
    }
    
    sections.forEach((section) => {
      const sectionLines = 2 + section.items.length
      const isSkillsSection = section.title.toUpperCase().includes('SKILL')
      
      if (isSkillsSection && newPages.length === 0 && currentPage.sections.length > 0) {
        newPages.push({ ...currentPage })
        currentPage = { header: null, sections: [] }
        currentLineCount = 0
      }
      
      if (currentLineCount + sectionLines > LINES_PER_PAGE && currentPage.sections.length > 0) {
        newPages.push({ ...currentPage })
        currentPage = { header: null, sections: [] }
        currentLineCount = 0
      }
      
      currentPage.sections.push(section)
      currentLineCount += sectionLines
    })
    
    if (currentPage.sections.length > 0 || currentPage.header) {
      newPages.push(currentPage)
    }
    
    setPages(newPages)
    setOverflow(newPages.length > maxPages)
  }, [content, userProfile, maxPages, parseResumeContent, compact])

  if (pages.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed"
        style={{ width: compact ? '100%' : A4_WIDTH, height: compact ? 300 : A4_HEIGHT }}
      >
        <p className="text-muted-foreground">Enter content to see preview</p>
      </div>
    )
  }

  const renderHeader = (header) => {
    if (!header) return null
    return (
      <div className="text-center mb-4 pb-3 border-b-2 border-gray-400">
        <h1 className="text-xl font-bold uppercase tracking-wider">{header.name}</h1>
        {header.designation && <p className="text-sm text-gray-600 mt-1">{header.designation}</p>}
        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-blue-600 flex-wrap">
          {header.email && <a href={`mailto:${header.email}`} className="hover:underline">{header.email}</a>}
          {header.phone && <><span className="text-gray-400">|</span><a href={`tel:${header.phone}`} className="hover:underline">{header.phone}</a></>}
          {header.linkedin && <><span className="text-gray-400">|</span><a href={header.linkedin.startsWith('http') ? header.linkedin : `https://${header.linkedin}`} className="hover:underline">{header.linkedin}</a></>}
          {header.portfolio && <><span className="text-gray-400">|</span><a href={header.portfolio.startsWith('http') ? header.portfolio : `https://${header.portfolio}`} className="hover:underline">{header.portfolio}</a></>}
        </div>
      </div>
    )
  }

  const renderSection = (section) => (
    <div className="mb-4">
      <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-2">{section.title}</h2>
      <div className="text-xs leading-relaxed space-y-0.5">
        {section.items.map((item, idx) => {
          const isSubheading = item.startsWith('**') || (item.includes('|') && !item.startsWith('-'))
          const isBullet = item.startsWith('-') || item.startsWith('•')
          
          if (isSubheading) {
            return <p key={idx} className="font-semibold mt-2 text-sm">{item.replace(/\*\*/g, '')}</p>
          } else if (isBullet) {
            return <p key={idx} className="ml-3 text-gray-700">• {item.replace(/^[-•]\s*/, '')}</p>
          } else {
            return <p key={idx} className="text-gray-700">{item}</p>
          }
        })}
      </div>
    </div>
  )

  const pageStyle = compact ? {
    width: '100%',
    minHeight: 280,
    padding: '16px',
    fontSize: '9px'
  } : {
    width: A4_WIDTH,
    minHeight: A4_HEIGHT,
    padding: '40px',
    fontSize: '11px'
  }

  return (
    <div className="space-y-4">
      {overflow && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">Content exceeds {maxPages} pages ({pages.length} pages). Please reduce content.</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Pages: {pages.length}/{maxPages}</span>
        {!overflow && <Check className="w-4 h-4 text-green-600" />}
      </div>
      
      <div className={compact ? "space-y-3 max-h-[400px] overflow-y-auto" : "space-y-6"}>
        {pages.map((page, pageIndex) => (
          <div 
            key={pageIndex} 
            className={`bg-white border rounded-lg shadow-md mx-auto ${pageIndex >= maxPages ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            style={{ ...pageStyle, fontFamily: 'Georgia, serif' }}
          >
            <div className="text-xs text-gray-400 text-right mb-2">Page {pageIndex + 1} of {pages.length}</div>
            {page.header && renderHeader(page.header)}
            {page.sections.map((section, idx) => <div key={idx}>{renderSection(section)}</div>)}
          </div>
        ))}
      </div>
    </div>
  )
}

// Full A4 Document Preview for Cover Letter / Supporting Statement
function DocumentPDFPreview({ content, maxPages = 2, documentType = 'coverLetter', compact = false }) {
  const [pages, setPages] = useState([])
  const [overflow, setOverflow] = useState(false)
  
  useEffect(() => {
    if (!content) {
      setPages([])
      setOverflow(false)
      return
    }

    const lines = content.split('\n').filter(l => l.trim())
    const LINES_PER_PAGE = compact ? 40 : 50
    
    const newPages = []
    let currentPage = []
    
    lines.forEach(line => {
      currentPage.push(line)
      if (currentPage.length >= LINES_PER_PAGE) {
        newPages.push([...currentPage])
        currentPage = []
      }
    })
    
    if (currentPage.length > 0) newPages.push(currentPage)
    setPages(newPages)
    setOverflow(newPages.length > maxPages)
  }, [content, maxPages, compact])

  if (!content) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed"
        style={{ width: compact ? '100%' : A4_WIDTH, height: compact ? 300 : A4_HEIGHT }}
      >
        <p className="text-muted-foreground">Enter content to see preview</p>
      </div>
    )
  }

  const pageStyle = compact ? {
    width: '100%',
    minHeight: 280,
    padding: '16px'
  } : {
    width: A4_WIDTH,
    minHeight: A4_HEIGHT,
    padding: '40px'
  }

  return (
    <div className="space-y-4">
      {overflow && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">Content exceeds {maxPages} pages ({pages.length} pages).</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Pages: {pages.length}/{maxPages}</span>
        {!overflow && <Check className="w-4 h-4 text-green-600" />}
      </div>
      
      <div className={compact ? "space-y-3 max-h-[400px] overflow-y-auto" : "space-y-6"}>
        {pages.map((pageLines, pageIndex) => (
          <div 
            key={pageIndex} 
            className={`bg-white border rounded-lg shadow-md mx-auto ${pageIndex >= maxPages ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            style={{ ...pageStyle, fontFamily: 'Georgia, serif' }}
          >
            <div className="text-xs text-gray-400 text-right mb-3">Page {pageIndex + 1} of {pages.length}</div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed space-y-2`}>
              {pageLines.map((line, lineIndex) => (
                <p key={lineIndex} className={line.startsWith('#') ? 'font-bold text-base mt-3' : ''}>
                  {line.replace(/^#+\s*/, '')}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
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

// Experience Entry Component
function ExperienceEntry({ experience, index, onChange, onRemove }) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium">Experience #{index + 1}</span>
          <Button variant="ghost" size="sm" onClick={onRemove}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Job Title" value={experience.title || ''} onChange={(e) => onChange({ ...experience, title: e.target.value })} />
          <Input placeholder="Company" value={experience.company || ''} onChange={(e) => onChange({ ...experience, company: e.target.value })} />
          <Input placeholder="Location" value={experience.location || ''} onChange={(e) => onChange({ ...experience, location: e.target.value })} />
          <div className="flex gap-2">
            <Input placeholder="Start (mm/yyyy)" value={experience.startDate || ''} onChange={(e) => onChange({ ...experience, startDate: e.target.value })} />
            <Input placeholder="End (mm/yyyy)" value={experience.endDate || ''} onChange={(e) => onChange({ ...experience, endDate: e.target.value })} />
          </div>
        </div>
        <Textarea placeholder="Description (one bullet point per line)" className="min-h-[80px]" value={experience.description || ''} onChange={(e) => onChange({ ...experience, description: e.target.value })} />
      </CardContent>
    </Card>
  )
}

// Project Entry Component
function ProjectEntry({ project, index, onChange, onRemove }) {
  return (
    <Card className="mb-3">
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-sm font-medium">Project #{index + 1}</span>
          <Button variant="ghost" size="sm" onClick={onRemove}><Trash2 className="w-4 h-4 text-red-500" /></Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Project Title" value={project.title || ''} onChange={(e) => onChange({ ...project, title: e.target.value })} />
          <Input placeholder="URL (optional)" value={project.url || ''} onChange={(e) => onChange({ ...project, url: e.target.value })} />
        </div>
        <Textarea placeholder="Description (tech stack, problem, impact)" className="min-h-[60px]" value={project.description || ''} onChange={(e) => onChange({ ...project, description: e.target.value })} />
      </CardContent>
    </Card>
  )
}

// Full-Screen Document Editor with A4 Preview
function FullScreenDocumentEditor({ job, documentType, token, onUpdate, userProfile, onClose }) {
  const docConfig = {
    resume: { label: 'Resume', maxPages: 2 },
    coverLetter: { label: 'Cover Letter', maxPages: 2 },
    supportingStatement: { label: 'Supporting Statement', maxPages: 3 }
  }
  const config = docConfig[documentType]
  
  const [content, setContent] = useState(job[documentType]?.content || '')
  const [refinedContent, setRefinedContent] = useState(job[documentType]?.refinedContent || '')
  const [preferences, setPreferences] = useState('')
  const [refining, setRefining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showRefined, setShowRefined] = useState(false)

  const previewContent = showRefined && refinedContent ? refinedContent : content

  const handleRefine = async () => {
    if (!content && documentType !== 'resume') {
      toast.error('Please enter content first')
      return
    }
    if (!job.description) {
      toast.error('Job description required')
      return
    }
    
    setRefining(true)
    try {
      const res = await fetch('/api/documents/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          documentType,
          content: documentType === 'resume' ? JSON.stringify(userProfile) : content,
          jobDescription: job.description + '\n\nRequirements:\n' + job.requirements,
          userPreferences: preferences,
          userProfile: documentType === 'resume' ? userProfile : null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRefinedContent(data.refinedContent)
      setShowRefined(true)
      toast.success('Refined!')
    } catch (error) { toast.error(error.message) } finally { setRefining(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [documentType]: { content, refinedContent } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Saved!')
      onUpdate(data.job)
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }

  const downloadPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const text = showRefined && refinedContent ? refinedContent : content
    doc.setFontSize(11)
    const lines = doc.splitTextToSize(text, 170)
    let y = 20
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20 }
      doc.text(line, 20, y)
      y += 6
    })
    doc.save(`${job.company}-${config.label}.pdf`)
  }

  const useRefinedContent = () => {
    setContent(refinedContent)
    setRefinedContent('')
    setShowRefined(false)
    toast.success('Applied')
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4 mr-1" />Close</Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="font-semibold">{config.label} for {job.title}</h2>
            <p className="text-xs text-muted-foreground">{job.company} • Max {config.maxPages} A4 pages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input 
            placeholder="AI Instructions (optional)..." 
            className="w-64"
            value={preferences} 
            onChange={(e) => setPreferences(e.target.value)} 
          />
          <Button onClick={handleRefine} disabled={refining} className="bg-purple-600 hover:bg-purple-700">
            {refining ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {refining ? 'Refining...' : 'Refine with AI'}
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(previewContent).then(() => toast.success('Copied!'))}><Copy className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={downloadPdf}><Download className="w-4 h-4" /></Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
      
      {/* Main content - Editor and Preview side by side */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
            <Label className="flex items-center gap-2"><FileEdit className="w-4 h-4" />Markdown Editor</Label>
            {refinedContent && (
              <div className="flex gap-1">
                <Button size="sm" variant={!showRefined ? "default" : "outline"} className="h-7" onClick={() => setShowRefined(false)}>Original</Button>
                <Button size="sm" variant={showRefined ? "default" : "outline"} className="h-7" onClick={() => setShowRefined(true)}>Refined</Button>
              </div>
            )}
          </div>
          <div className="flex-1 p-4 overflow-auto">
            {showRefined && refinedContent ? (
              <div className="h-full flex flex-col">
                <Textarea 
                  className="flex-1 font-mono text-sm bg-purple-50 resize-none"
                  value={refinedContent}
                  onChange={(e) => setRefinedContent(e.target.value)}
                />
                <Button size="sm" variant="outline" className="mt-2 w-fit" onClick={useRefinedContent}>
                  <Check className="w-4 h-4 mr-1" />Apply to Original
                </Button>
              </div>
            ) : (
              <Textarea 
                placeholder={documentType === 'resume' ? '# SUMMARY\nYour professional summary...\n\n# RELEVANT WORK EXPERIENCE\n**Job Title | Company, Location | mm/yyyy - mm/yyyy**\n- Achievement 1\n- Achievement 2' : `Enter your ${config.label.toLowerCase()} content...`}
                className="h-full font-mono text-sm resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            )}
          </div>
        </div>
        
        {/* Preview Panel - A4 Size with scroll */}
        <div className="w-1/2 flex flex-col bg-gray-100">
          <div className="px-4 py-2 border-b bg-muted/50">
            <Label className="flex items-center gap-2"><Eye className="w-4 h-4" />A4 PDF Preview (Harvard Style)</Label>
          </div>
          <div className="flex-1 overflow-auto p-6">
            {documentType === 'resume' ? (
              <ResumePDFPreview content={previewContent} userProfile={userProfile} maxPages={config.maxPages} />
            ) : (
              <DocumentPDFPreview content={previewContent} maxPages={config.maxPages} documentType={documentType} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact Document Editor (for job details panel)
function CompactDocumentEditor({ job, documentType, token, onUpdate, userProfile }) {
  const [fullScreen, setFullScreen] = useState(false)
  const docConfig = {
    resume: { label: 'Resume', maxPages: 2 },
    coverLetter: { label: 'Cover Letter', maxPages: 2 },
    supportingStatement: { label: 'Supporting Statement', maxPages: 3 }
  }
  const config = docConfig[documentType]
  
  const hasContent = job[documentType]?.content || job[documentType]?.refinedContent

  if (fullScreen) {
    return (
      <FullScreenDocumentEditor 
        job={job} 
        documentType={documentType} 
        token={token} 
        onUpdate={onUpdate} 
        userProfile={userProfile}
        onClose={() => setFullScreen(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{config.label}</h3>
          <Badge variant="outline">Max {config.maxPages} pages</Badge>
        </div>
        <Button onClick={() => setFullScreen(true)} className="gap-2">
          <Maximize2 className="w-4 h-4" />
          Open Full Editor
        </Button>
      </div>
      
      {hasContent ? (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground mb-2">Content saved. Click "Open Full Editor" to edit.</p>
            <div className="text-xs font-mono bg-muted p-3 rounded max-h-32 overflow-auto">
              {(job[documentType]?.refinedContent || job[documentType]?.content || '').substring(0, 500)}...
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No content yet</p>
            <Button variant="outline" className="mt-3" onClick={() => setFullScreen(true)}>
              <Plus className="w-4 h-4 mr-1" />Create {config.label}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Profile Editor with A4 Preview
function ProfileEditor({ user, token, onSave, onCancel }) {
  const [profileData, setProfileData] = useState({
    name: user.name || '', designation: user.designation || '', email: user.email || '',
    phone: user.phone || '', linkedin: user.linkedin || '', portfolio: user.portfolio || '',
    summary: user.summary || '', experiences: user.experiences || [],
    education: user.education || { degree: '', institution: '', location: '', grade: '', startDate: '', endDate: '' },
    skills: user.skills || { relevant: '', other: '' }, projects: user.projects || [],
    interests: user.interests || [], achievements: user.achievements || ''
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const addExperience = () => setProfileData(prev => ({ ...prev, experiences: [...prev.experiences, { title: '', company: '', location: '', startDate: '', endDate: '', description: '' }] }))
  const updateExperience = (i, data) => setProfileData(prev => ({ ...prev, experiences: prev.experiences.map((exp, idx) => idx === i ? data : exp) }))
  const removeExperience = (i) => setProfileData(prev => ({ ...prev, experiences: prev.experiences.filter((_, idx) => idx !== i) }))
  
  const addProject = () => setProfileData(prev => ({ ...prev, projects: [...prev.projects, { title: '', url: '', description: '' }] }))
  const updateProject = (i, data) => setProfileData(prev => ({ ...prev, projects: prev.projects.map((p, idx) => idx === i ? data : p) }))
  const removeProject = (i) => setProfileData(prev => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }))
  
  const addInterest = () => setProfileData(prev => ({ ...prev, interests: [...prev.interests, { title: '', description: '' }] }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(profileData) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Profile saved!')
      onSave(data.user)
    } catch (error) { toast.error(error.message) } finally { setSaving(false) }
  }

  const generatePreviewContent = () => {
    let content = ''
    if (profileData.summary) content += `# SUMMARY\n${profileData.summary}\n\n`
    if (profileData.experiences.length > 0) {
      content += `# RELEVANT WORK EXPERIENCE\n`
      profileData.experiences.forEach(exp => {
        content += `**${exp.title} | ${exp.company}, ${exp.location} | ${exp.startDate} - ${exp.endDate}**\n`
        if (exp.description) exp.description.split('\n').forEach(line => { if (line.trim()) content += `- ${line.trim()}\n` })
        content += '\n'
      })
    }
    if (profileData.education.degree) {
      content += `# EDUCATION\n**${profileData.education.degree} | ${profileData.education.grade} | ${profileData.education.startDate} - ${profileData.education.endDate}**\n${profileData.education.institution}, ${profileData.education.location}\n\n`
    }
    if (profileData.skills.relevant || profileData.skills.other) {
      content += `# SKILLS\n`
      if (profileData.skills.relevant) content += `**Relevant Skills**\n${profileData.skills.relevant}\n\n`
      if (profileData.skills.other) content += `**Other Skills**\n${profileData.skills.other}\n\n`
    }
    if (profileData.projects.length > 0) {
      content += `# PROJECTS\n`
      profileData.projects.forEach(proj => { content += `**${proj.title}${proj.url ? ' | ' + proj.url : ''}**\n${proj.description}\n\n` })
    }
    if (profileData.interests.length > 0) {
      content += `# INTERESTS\n`
      profileData.interests.forEach(int => { content += `**${int.title}**\n${int.description}\n\n` })
    }
    return content
  }

  return (
    <div className="flex gap-6 h-[75vh]">
      {/* Editor Panel */}
      <div className="w-1/2 overflow-y-auto pr-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="basic"><User className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="experience"><Briefcase className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="education"><GraduationCap className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="skills"><Code className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="projects"><FolderOpen className="w-4 h-4" /></TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-3">
            <h3 className="font-semibold">Basic Information (Header)</h3>
            <Input placeholder="Full Name" value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
            <Input placeholder="Designation/Title" value={profileData.designation} onChange={(e) => setProfileData({...profileData, designation: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Phone" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} />
              <Input placeholder="Email" value={profileData.email} disabled />
            </div>
            <Input placeholder="LinkedIn URL" value={profileData.linkedin} onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})} />
            <Input placeholder="Portfolio URL" value={profileData.portfolio} onChange={(e) => setProfileData({...profileData, portfolio: e.target.value})} />
            <div><Label>Professional Summary</Label><Textarea placeholder="Summary..." className="min-h-[100px]" value={profileData.summary} onChange={(e) => setProfileData({...profileData, summary: e.target.value})} /></div>
          </TabsContent>
          
          <TabsContent value="experience" className="space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-semibold">Work Experience</h3><Button size="sm" onClick={addExperience}><Plus className="w-4 h-4 mr-1" />Add</Button></div>
            {profileData.experiences.map((exp, i) => <ExperienceEntry key={i} experience={exp} index={i} onChange={(data) => updateExperience(i, data)} onRemove={() => removeExperience(i)} />)}
            {profileData.experiences.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No experience added</p>}
          </TabsContent>
          
          <TabsContent value="education" className="space-y-3">
            <h3 className="font-semibold">Education</h3>
            <Input placeholder="Degree Name" value={profileData.education.degree} onChange={(e) => setProfileData({...profileData, education: {...profileData.education, degree: e.target.value}})} />
            <Input placeholder="Institution" value={profileData.education.institution} onChange={(e) => setProfileData({...profileData, education: {...profileData.education, institution: e.target.value}})} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Location" value={profileData.education.location} onChange={(e) => setProfileData({...profileData, education: {...profileData.education, location: e.target.value}})} />
              <Input placeholder="Grade/GPA" value={profileData.education.grade} onChange={(e) => setProfileData({...profileData, education: {...profileData.education, grade: e.target.value}})} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Start (mm/yyyy)" value={profileData.education.startDate} onChange={(e) => setProfileData({...profileData, education: {...profileData.education, startDate: e.target.value}})} />
              <Input placeholder="End (mm/yyyy)" value={profileData.education.endDate} onChange={(e) => setProfileData({...profileData, education: {...profileData.education, endDate: e.target.value}})} />
            </div>
            <Separator className="my-4" />
            <h3 className="font-semibold">Achievements</h3>
            <Textarea placeholder="Awards, certifications..." className="min-h-[80px]" value={profileData.achievements} onChange={(e) => setProfileData({...profileData, achievements: e.target.value})} />
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-3">
            <h3 className="font-semibold">Skills</h3>
            <div><Label>All Skills (comma separated)</Label><Textarea placeholder="Python, JavaScript, React..." className="min-h-[80px]" value={profileData.skills.relevant} onChange={(e) => setProfileData({...profileData, skills: {...profileData.skills, relevant: e.target.value}})} /></div>
            <div><Label>Secondary/Soft Skills</Label><Textarea placeholder="Leadership, Communication..." className="min-h-[80px]" value={profileData.skills.other} onChange={(e) => setProfileData({...profileData, skills: {...profileData.skills, other: e.target.value}})} /></div>
            <Separator className="my-4" />
            <div className="flex justify-between items-center"><h3 className="font-semibold">Interests</h3><Button size="sm" onClick={addInterest}><Plus className="w-4 h-4 mr-1" />Add</Button></div>
            {profileData.interests.map((interest, i) => (
              <Card key={i} className="mb-2"><CardContent className="pt-3 space-y-2">
                <div className="flex justify-between">
                  <Input placeholder="Interest Title" className="flex-1 mr-2" value={interest.title} onChange={(e) => { const ni = [...profileData.interests]; ni[i] = {...interest, title: e.target.value}; setProfileData({...profileData, interests: ni}); }} />
                  <Button variant="ghost" size="sm" onClick={() => setProfileData({...profileData, interests: profileData.interests.filter((_, idx) => idx !== i)})}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
                <Input placeholder="Description" value={interest.description} onChange={(e) => { const ni = [...profileData.interests]; ni[i] = {...interest, description: e.target.value}; setProfileData({...profileData, interests: ni}); }} />
              </CardContent></Card>
            ))}
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-semibold">Projects</h3><Button size="sm" onClick={addProject}><Plus className="w-4 h-4 mr-1" />Add</Button></div>
            {profileData.projects.map((proj, i) => <ProjectEntry key={i} project={proj} index={i} onChange={(data) => updateProject(i, data)} onRemove={() => removeProject(i)} />)}
            {profileData.projects.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No projects added</p>}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* A4 Preview Panel */}
      <div className="w-1/2 border-l pl-6 overflow-y-auto">
        <Label className="flex items-center gap-2 mb-4"><Eye className="w-4 h-4" />A4 Resume Preview</Label>
        <ResumePDFPreview content={generatePreviewContent()} userProfile={profileData} maxPages={2} />
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </div>
    </div>
  )
}

// Job Form
function JobForm({ job, onSave, onCancel, token, userProfile }) {
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [formData, setFormData] = useState({
    title: job?.title || '', company: job?.company || '', location: job?.location || '',
    salary: job?.salary || '', closingDate: job?.closingDate || '',
    appliedDate: job?.appliedDate || new Date().toISOString().split('T')[0],
    status: job?.status || 'saved', url: job?.url || '', description: job?.description || '',
    requirements: job?.requirements || '', benefits: job?.benefits || '', notes: job?.notes || ''
  })

  const handleScrape = async () => {
    if (!formData.url) { toast.error('Enter URL first'); return }
    setScraping(true)
    try {
      const res = await fetch('/api/jobs/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ url: formData.url }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFormData(prev => ({
        ...prev, title: data.jobDetails.title || prev.title, company: data.jobDetails.company || prev.company,
        location: data.jobDetails.location || prev.location, salary: data.jobDetails.salary || prev.salary,
        closingDate: data.jobDetails.closingDate || prev.closingDate, description: data.jobDetails.description || prev.description,
        requirements: data.jobDetails.requirements || prev.requirements, benefits: data.jobDetails.benefits || prev.benefits
      }))
      toast.success('Extracted!')
    } catch (error) { toast.error(error.message) } finally { setScraping(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(job ? `/api/jobs/${job.id}` : '/api/jobs', { method: job ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(job ? 'Updated!' : 'Added!')
      onSave(data.job)
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1"><Label>Job URL</Label><Input placeholder="https://..." value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} /></div>
        <div className="flex items-end"><Button type="button" variant="outline" onClick={handleScrape} disabled={scraping}>{scraping ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}{scraping ? 'Extracting...' : 'Extract'}</Button></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Job Title *</Label><Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required /></div>
        <div><Label>Company *</Label><Input value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Location</Label><Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
        <div><Label>Salary</Label><Input value={formData.salary} onChange={(e) => setFormData({...formData, salary: e.target.value})} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><Label>Closing Date</Label><Input type="date" value={formData.closingDate} onChange={(e) => setFormData({...formData, closingDate: e.target.value})} /></div>
        <div><Label>Applied Date</Label><Input type="date" value={formData.appliedDate} onChange={(e) => setFormData({...formData, appliedDate: e.target.value})} /></div>
        <div><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="saved">Saved</SelectItem><SelectItem value="applied">Applied</SelectItem><SelectItem value="interview">Interview</SelectItem><SelectItem value="offer">Offer</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem></SelectContent></Select></div>
      </div>
      <div><Label>Description</Label><Textarea className="min-h-[80px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
      <div><Label>Requirements</Label><Textarea className="min-h-[60px]" value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} /></div>
      <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? 'Saving...' : (job ? 'Update' : 'Add Job')}</Button></div>
    </form>
  )
}

// Job Details Panel
function JobDetailsPanel({ job, token, onUpdate, onClose, onDelete, userProfile }) {
  const [activeTab, setActiveTab] = useState('details')
  const [editing, setEditing] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionFeedback, setRejectionFeedback] = useState(job.rejectionFeedback || '')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'rejected' && job.status !== 'rejected') { setShowRejectDialog(true); return }
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(data.job)
      toast.success('Updated!')
    } catch (error) { toast.error(error.message) } finally { setUpdatingStatus(false) }
  }

  const handleRejectWithFeedback = async () => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: 'rejected', rejectionFeedback }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(data.job)
      setShowRejectDialog(false)
      toast.success('Marked rejected')
    } catch (error) { toast.error(error.message) } finally { setUpdatingStatus(false) }
  }

  if (editing) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b"><h2 className="font-semibold">Edit Job</h2><Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button></div>
        <ScrollArea className="flex-1 p-3"><JobForm job={job} token={token} userProfile={userProfile} onSave={(updated) => { onUpdate(updated); setEditing(false); }} onCancel={() => setEditing(false)} /></ScrollArea>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div><h2 className="font-semibold">{job.title}</h2><p className="text-sm text-muted-foreground">{job.company}</p></div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="w-4 h-4 text-red-500" /></Button>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
      </div>
      
      <div className="p-3 border-b">
        <div className="flex flex-wrap gap-2 mb-2">
          {job.location && <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{job.location}</Badge>}
          {job.salary && <Badge variant="outline"><DollarSign className="w-3 h-3 mr-1" />{job.salary}</Badge>}
          {job.closingDate && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Closes: {job.closingDate}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Select value={job.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
            <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="saved">Saved</SelectItem><SelectItem value="applied">Applied</SelectItem><SelectItem value="interview">Interview</SelectItem><SelectItem value="offer">Offer</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem></SelectContent>
          </Select>
          {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><ExternalLink className="w-3 h-3 mr-1" />View</Button></a>}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 h-8">
          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
          <TabsTrigger value="resume" className="text-xs">Resume</TabsTrigger>
          <TabsTrigger value="coverLetter" className="text-xs">Cover Letter</TabsTrigger>
          <TabsTrigger value="supportingStatement" className="text-xs">Statement</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <div className="p-3">
            <TabsContent value="details" className="mt-0 space-y-3">
              {job.description && <div><h4 className="font-medium text-sm mb-1">Description</h4><p className="text-xs whitespace-pre-wrap">{job.description}</p></div>}
              {job.requirements && <div><h4 className="font-medium text-sm mb-1">Requirements</h4><p className="text-xs whitespace-pre-wrap">{job.requirements}</p></div>}
              {job.status === 'rejected' && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1 text-red-800"><AlertCircle className="w-3 h-3 inline mr-1" />Rejection Feedback</h4>
                  <p className="text-xs text-red-700">{job.rejectionFeedback || 'No feedback'}</p>
                  <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setShowRejectDialog(true)}>Edit</Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="resume" className="mt-0"><CompactDocumentEditor job={job} documentType="resume" token={token} onUpdate={onUpdate} userProfile={userProfile} /></TabsContent>
            <TabsContent value="coverLetter" className="mt-0"><CompactDocumentEditor job={job} documentType="coverLetter" token={token} onUpdate={onUpdate} userProfile={userProfile} /></TabsContent>
            <TabsContent value="supportingStatement" className="mt-0"><CompactDocumentEditor job={job} documentType="supportingStatement" token={token} onUpdate={onUpdate} userProfile={userProfile} /></TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
      
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent><DialogHeader><DialogTitle>Rejection Feedback</DialogTitle></DialogHeader><Textarea placeholder="Feedback..." className="min-h-[100px]" value={rejectionFeedback} onChange={(e) => setRejectionFeedback(e.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button><Button onClick={handleRejectWithFeedback} disabled={updatingStatus}>{updatingStatus ? 'Saving...' : 'Save'}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}

// Dashboard
function Dashboard({ user, token, onLogout, onUserUpdate }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const [showAddJob, setShowAddJob] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadJobs() }, [])
  const loadJobs = async () => {
    try { const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } }); const data = await res.json(); if (res.ok) setJobs(data.jobs) }
    catch { toast.error('Failed to load') } finally { setLoading(false) }
  }
  const handleDeleteJob = async (id) => {
    if (!confirm('Delete?')) return
    try { await fetch(`/api/jobs/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); setJobs(jobs.filter(j => j.id !== id)); if (selectedJob?.id === id) setSelectedJob(null); toast.success('Deleted') }
    catch { toast.error('Failed') }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)
  const stats = { total: jobs.length, applied: jobs.filter(j => j.status === 'applied').length, interview: jobs.filter(j => j.status === 'interview').length, offer: jobs.filter(j => j.status === 'offer').length, rejected: jobs.filter(j => j.status === 'rejected').length }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center"><Briefcase className="w-5 h-5 text-primary-foreground" /></div>
            <div><h1 className="font-semibold text-sm">Job Tracker</h1><p className="text-xs text-muted-foreground">Welcome, {user.name}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)}><User className="w-4 h-4 mr-1" />Profile</Button>
            <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="w-4 h-4 mr-1" />Logout</Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[{ label: 'Total', value: stats.total, f: 'all' }, { label: 'Applied', value: stats.applied, f: 'applied', c: 'text-blue-600' }, { label: 'Interviews', value: stats.interview, f: 'interview', c: 'text-yellow-600' }, { label: 'Offers', value: stats.offer, f: 'offer', c: 'text-green-600' }, { label: 'Rejected', value: stats.rejected, f: 'rejected', c: 'text-red-600' }].map(s => (
            <Card key={s.f} className="cursor-pointer hover:shadow-md" onClick={() => setFilter(s.f)}><CardContent className="py-3"><div className={`text-xl font-bold ${s.c || ''}`}>{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></CardContent></Card>
          ))}
        </div>
        
        <div className="flex gap-4">
          <div className={`${selectedJob ? 'w-1/3' : 'w-full'} transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><h2 className="font-semibold">Applications</h2>{filter !== 'all' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilter('all')}>{filter} <X className="w-3 h-3 ml-1" /></Badge>}</div>
              <Button size="sm" onClick={() => setShowAddJob(true)}><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            {loading ? <div className="text-center py-8"><RefreshCw className="w-6 h-6 mx-auto animate-spin text-muted-foreground" /></div>
            : filteredJobs.length === 0 ? <Card><CardContent className="py-8 text-center"><Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-2" /><p className="text-sm">No jobs found</p></CardContent></Card>
            : <div className="space-y-2">{filteredJobs.map(job => (
                <Card key={job.id} className={`cursor-pointer hover:shadow-md ${selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedJob(job)}>
                  <CardContent className="py-3"><div className="flex justify-between items-start"><div><h3 className="font-medium text-sm">{job.title}</h3><p className="text-xs text-muted-foreground">{job.company} {job.location && `• ${job.location}`}</p></div><Badge className={statusColors[job.status]}>{job.status}</Badge></div></CardContent>
                </Card>
              ))}</div>}
          </div>
          {selectedJob && <div className="w-2/3"><Card className="h-[calc(100vh-220px)] overflow-hidden"><JobDetailsPanel job={selectedJob} token={token} userProfile={user} onUpdate={(u) => { setJobs(jobs.map(j => j.id === u.id ? u : j)); setSelectedJob(u); }} onClose={() => setSelectedJob(null)} onDelete={() => handleDeleteJob(selectedJob.id)} /></Card></div>}
        </div>
      </div>
      
      <Dialog open={showAddJob} onOpenChange={setShowAddJob}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Add New Job</DialogTitle></DialogHeader><JobForm token={token} userProfile={user} onSave={(nj) => { setJobs([nj, ...jobs]); setShowAddJob(false); setSelectedJob(nj); }} onCancel={() => setShowAddJob(false)} /></DialogContent></Dialog>
      <Dialog open={showProfile} onOpenChange={setShowProfile}><DialogContent className="max-w-5xl max-h-[90vh]"><DialogHeader><DialogTitle>Profile & Resume Data</DialogTitle><DialogDescription>Your data is used as template for AI-generated resumes</DialogDescription></DialogHeader><ProfileEditor user={user} token={token} onSave={(u) => { localStorage.setItem('user', JSON.stringify(u)); onUserUpdate(u); setShowProfile(false); }} onCancel={() => setShowProfile(false)} /></DialogContent></Dialog>
    </div>
  )
}

// Main App
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
