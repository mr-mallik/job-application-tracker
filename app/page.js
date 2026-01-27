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
  GraduationCap, Code, FolderOpen, Heart, Award
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

// Resume PDF Preview Component with Harvard Style - Fixed 2 page max
function ResumePDFPreview({ content, userProfile, maxPages = 2 }) {
  const [pages, setPages] = useState([])
  const [overflow, setOverflow] = useState(false)
  
  // Parse markdown resume into structured sections
  const parseResumeContent = useCallback((text, profile) => {
    if (!text && !profile) return { header: null, sections: [] }
    
    // Header is always from profile
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
      
      // Check for main section headers (# HEADING or **HEADING** or UPPERCASE HEADING)
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

  // Render to pages with proper sizing
  useEffect(() => {
    const { header, sections } = parseResumeContent(content, userProfile)
    
    if (!header && sections.length === 0) {
      setPages([])
      setOverflow(false)
      return
    }

    // Each page can hold approximately:
    // - Header: ~8 lines worth
    // - Lines per page after header: ~35 lines (with smaller font)
    const LINES_PER_PAGE = 38
    const HEADER_LINES = 6
    
    const newPages = []
    let currentPage = { header: null, sections: [] }
    let currentLineCount = 0
    
    // First page always has header
    if (header) {
      currentPage.header = header
      currentLineCount = HEADER_LINES
    }
    
    // Distribute sections across pages
    sections.forEach((section, idx) => {
      // Estimate section size: title (2 lines) + items
      const sectionLines = 2 + section.items.length
      
      // Check if this section should start on page 2 (Skills)
      const isSkillsSection = section.title.toUpperCase().includes('SKILL')
      
      // If Skills section and we're on page 1, force new page
      if (isSkillsSection && newPages.length === 0 && currentPage.sections.length > 0) {
        newPages.push({ ...currentPage })
        currentPage = { header: null, sections: [] }
        currentLineCount = 0
      }
      
      // If section doesn't fit, start new page
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
  }, [content, userProfile, maxPages, parseResumeContent])

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Enter content to see preview</p>
      </div>
    )
  }

  const renderHeader = (header) => {
    if (!header) return null
    return (
      <div className="text-center mb-3 pb-2 border-b border-gray-400">
        <h1 className="text-base font-bold uppercase tracking-wider">{header.name}</h1>
        <p className="text-xs text-gray-600 mt-0.5">{header.designation}</p>
        <div className="flex items-center justify-center gap-2 mt-1 text-[10px] text-blue-600 flex-wrap">
          {header.email && <a href={`mailto:${header.email}`} className="hover:underline">{header.email}</a>}
          {header.phone && <span>|</span>}
          {header.phone && <a href={`tel:${header.phone}`} className="hover:underline">{header.phone}</a>}
          {header.linkedin && <span>|</span>}
          {header.linkedin && <a href={header.linkedin.startsWith('http') ? header.linkedin : `https://${header.linkedin}`} className="hover:underline">{header.linkedin}</a>}
          {header.portfolio && <span>|</span>}
          {header.portfolio && <a href={header.portfolio.startsWith('http') ? header.portfolio : `https://${header.portfolio}`} className="hover:underline">{header.portfolio}</a>}
        </div>
      </div>
    )
  }

  const renderSection = (section) => {
    const title = section.title.toUpperCase()
    return (
      <div className="mb-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide border-b border-gray-300 pb-0.5 mb-1">{title}</h2>
        <div className="text-[9px] leading-tight">
          {section.items.map((item, idx) => {
            // Check if it's a subheading (starts with ** or has | separators)
            const isSubheading = item.startsWith('**') || (item.includes('|') && !item.startsWith('-'))
            const isBullet = item.startsWith('-') || item.startsWith('•')
            
            if (isSubheading) {
              return (
                <p key={idx} className="font-semibold mt-1 text-[10px]">
                  {item.replace(/\*\*/g, '')}
                </p>
              )
            } else if (isBullet) {
              return (
                <p key={idx} className="ml-2 text-gray-700">
                  • {item.replace(/^[-•]\s*/, '')}
                </p>
              )
            } else {
              return (
                <p key={idx} className="text-gray-700">{item}</p>
              )
            }
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {overflow && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-700">
            Content exceeds {maxPages} pages ({pages.length} pages). Please reduce content.
          </span>
        </div>
      )}
      
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>Pages: {pages.length}/{maxPages}</span>
        {!overflow && <Check className="w-4 h-4 text-green-600" />}
      </div>
      
      <div className="space-y-3 max-h-[550px] overflow-y-auto">
        {pages.map((page, pageIndex) => (
          <div 
            key={pageIndex} 
            className={`bg-white border rounded-lg shadow-sm p-4 ${
              pageIndex >= maxPages ? 'border-red-300 bg-red-50' : ''
            }`}
            style={{ 
              fontFamily: 'Georgia, serif',
              minHeight: '280px',
              fontSize: '9px'
            }}
          >
            <div className="text-[8px] text-muted-foreground mb-2 text-right">
              Page {pageIndex + 1} of {pages.length}
            </div>
            
            {page.header && renderHeader(page.header)}
            
            {page.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                {renderSection(section)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Generic PDF Preview for Cover Letter and Supporting Statement
function DocumentPDFPreview({ content, maxPages = 2, documentType = 'coverLetter' }) {
  const [pages, setPages] = useState([])
  const [overflow, setOverflow] = useState(false)
  
  useEffect(() => {
    if (!content) {
      setPages([])
      setOverflow(false)
      return
    }

    const lines = content.split('\n').filter(l => l.trim())
    const LINES_PER_PAGE = documentType === 'supportingStatement' ? 45 : 40
    
    const newPages = []
    let currentPage = []
    
    lines.forEach(line => {
      currentPage.push(line)
      if (currentPage.length >= LINES_PER_PAGE) {
        newPages.push([...currentPage])
        currentPage = []
      }
    })
    
    if (currentPage.length > 0) {
      newPages.push(currentPage)
    }
    
    setPages(newPages)
    setOverflow(newPages.length > maxPages)
  }, [content, maxPages, documentType])

  if (!content) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-muted-foreground">Enter content to see preview</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {overflow && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-xs text-red-700">
            Content exceeds {maxPages} pages ({pages.length} pages).
          </span>
        </div>
      )}
      
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>Pages: {pages.length}/{maxPages}</span>
        {!overflow && <Check className="w-4 h-4 text-green-600" />}
      </div>
      
      <div className="space-y-3 max-h-[550px] overflow-y-auto">
        {pages.map((pageLines, pageIndex) => (
          <div 
            key={pageIndex} 
            className={`bg-white border rounded-lg shadow-sm p-4 ${
              pageIndex >= maxPages ? 'border-red-300 bg-red-50' : ''
            }`}
            style={{ fontFamily: 'Georgia, serif', minHeight: '280px' }}
          >
            <div className="text-[8px] text-muted-foreground mb-2 text-right">
              Page {pageIndex + 1} of {pages.length}
            </div>
            <div className="text-[10px] leading-relaxed space-y-1">
              {pageLines.map((line, lineIndex) => (
                <p key={lineIndex} className={line.startsWith('#') ? 'font-bold text-[11px] mt-2' : ''}>
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
              <Button type="button" variant="ghost" className="w-full" onClick={() => setIsVerifying(false)}>Back</Button>
            </form>
          ) : isForgotPassword ? (
            isResetting ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Reset Code</Label>
                  <Input placeholder="Enter code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => { setIsForgotPassword(false); setIsResetting(false); }}>Back</Button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Code'}</Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setIsForgotPassword(false)}>Back</Button>
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
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
              <div className="flex justify-between text-sm">
                <button type="button" className="text-primary hover:underline" onClick={() => setIsForgotPassword(true)}>Forgot password?</button>
                <button type="button" className="text-primary hover:underline" onClick={() => setIsLogin(false)}>Create account</button>
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
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
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
        <Textarea placeholder="Description (bullet points, one per line)" className="min-h-[80px]" value={experience.description || ''} onChange={(e) => onChange({ ...experience, description: e.target.value })} />
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
        <Textarea placeholder="Description (tech stack, problem solved, impact)" className="min-h-[60px]" value={project.description || ''} onChange={(e) => onChange({ ...project, description: e.target.value })} />
      </CardContent>
    </Card>
  )
}

// Profile Editor Component with all resume details
function ProfileEditor({ user, token, onSave, onCancel }) {
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    designation: user.designation || '',
    email: user.email || '',
    phone: user.phone || '',
    linkedin: user.linkedin || '',
    portfolio: user.portfolio || '',
    summary: user.summary || '',
    experiences: user.experiences || [],
    education: user.education || { degree: '', institution: '', location: '', grade: '', startDate: '', endDate: '' },
    skills: user.skills || { relevant: '', other: '' },
    projects: user.projects || [],
    interests: user.interests || [],
    achievements: user.achievements || ''
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')

  const addExperience = () => {
    setProfileData(prev => ({
      ...prev,
      experiences: [...prev.experiences, { title: '', company: '', location: '', startDate: '', endDate: '', description: '' }]
    }))
  }

  const updateExperience = (index, data) => {
    setProfileData(prev => ({
      ...prev,
      experiences: prev.experiences.map((exp, i) => i === index ? data : exp)
    }))
  }

  const removeExperience = (index) => {
    setProfileData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }))
  }

  const addProject = () => {
    setProfileData(prev => ({
      ...prev,
      projects: [...prev.projects, { title: '', url: '', description: '' }]
    }))
  }

  const updateProject = (index, data) => {
    setProfileData(prev => ({
      ...prev,
      projects: prev.projects.map((proj, i) => i === index ? data : proj)
    }))
  }

  const removeProject = (index) => {
    setProfileData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }))
  }

  const addInterest = () => {
    setProfileData(prev => ({
      ...prev,
      interests: [...prev.interests, { title: '', description: '' }]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Profile saved!')
      onSave(data.user)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  // Generate preview content from profile data
  const generatePreviewContent = () => {
    let content = ''
    
    if (profileData.summary) {
      content += `# SUMMARY\n${profileData.summary}\n\n`
    }
    
    if (profileData.experiences.length > 0) {
      content += `# RELEVANT WORK EXPERIENCE\n`
      profileData.experiences.forEach(exp => {
        content += `**${exp.title} | ${exp.company}, ${exp.location} | ${exp.startDate} - ${exp.endDate}**\n`
        if (exp.description) {
          exp.description.split('\n').forEach(line => {
            if (line.trim()) content += `- ${line.trim()}\n`
          })
        }
        content += '\n'
      })
    }
    
    if (profileData.education.degree) {
      content += `# EDUCATION\n`
      content += `**${profileData.education.degree} | ${profileData.education.grade} | ${profileData.education.startDate} - ${profileData.education.endDate}**\n`
      content += `${profileData.education.institution}, ${profileData.education.location}\n\n`
    }
    
    if (profileData.skills.relevant || profileData.skills.other) {
      content += `# SKILLS\n`
      if (profileData.skills.relevant) {
        content += `**Relevant Skills**\n${profileData.skills.relevant}\n\n`
      }
      if (profileData.skills.other) {
        content += `**Other Skills**\n${profileData.skills.other}\n\n`
      }
    }
    
    if (profileData.projects.length > 0) {
      content += `# PROJECTS\n`
      profileData.projects.forEach(proj => {
        content += `**${proj.title}${proj.url ? ' | ' + proj.url : ''}**\n`
        content += `${proj.description}\n\n`
      })
    }
    
    if (profileData.interests.length > 0) {
      content += `# INTERESTS\n`
      profileData.interests.forEach(int => {
        content += `**${int.title}**\n${int.description}\n\n`
      })
    }
    
    return content
  }

  return (
    <div className="grid grid-cols-2 gap-4 h-[70vh]">
      <div className="overflow-y-auto pr-2">
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
            <div>
              <Label>Professional Summary</Label>
              <Textarea placeholder="Your professional summary..." className="min-h-[100px]" value={profileData.summary} onChange={(e) => setProfileData({...profileData, summary: e.target.value})} />
            </div>
          </TabsContent>
          
          <TabsContent value="experience" className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Work Experience</h3>
              <Button size="sm" onClick={addExperience}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            {profileData.experiences.map((exp, i) => (
              <ExperienceEntry key={i} experience={exp} index={i} onChange={(data) => updateExperience(i, data)} onRemove={() => removeExperience(i)} />
            ))}
            {profileData.experiences.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No experience added yet</p>
            )}
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
              <Input placeholder="Start Date (mm/yyyy)" value={profileData.education.startDate} onChange={(e) => setProfileData({...profileData, education: {...profileData.education, startDate: e.target.value}})} />
              <Input placeholder="End Date (mm/yyyy)" value={profileData.education.endDate} onChange={(e) => setProfileData({...profileData, education: {...profileData.education, endDate: e.target.value}})} />
            </div>
            
            <Separator className="my-4" />
            <h3 className="font-semibold">Achievements</h3>
            <Textarea placeholder="Notable achievements, awards, certifications..." className="min-h-[100px]" value={profileData.achievements} onChange={(e) => setProfileData({...profileData, achievements: e.target.value})} />
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-3">
            <h3 className="font-semibold">Skills</h3>
            <div>
              <Label>All Skills (comma separated)</Label>
              <Textarea placeholder="Python, JavaScript, React, Node.js, AWS, Docker..." className="min-h-[80px]" value={profileData.skills.relevant} onChange={(e) => setProfileData({...profileData, skills: {...profileData.skills, relevant: e.target.value}})} />
              <p className="text-xs text-muted-foreground mt-1">AI will select the most relevant skills for each job</p>
            </div>
            <div>
              <Label>Secondary/Soft Skills</Label>
              <Textarea placeholder="Project Management, Communication, Leadership..." className="min-h-[80px]" value={profileData.skills.other} onChange={(e) => setProfileData({...profileData, skills: {...profileData.skills, other: e.target.value}})} />
            </div>
            
            <Separator className="my-4" />
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Interests</h3>
              <Button size="sm" onClick={addInterest}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            {profileData.interests.map((interest, i) => (
              <Card key={i} className="mb-2">
                <CardContent className="pt-3 space-y-2">
                  <div className="flex justify-between">
                    <Input placeholder="Interest Title" className="flex-1 mr-2" value={interest.title} onChange={(e) => {
                      const newInterests = [...profileData.interests]
                      newInterests[i] = { ...interest, title: e.target.value }
                      setProfileData({...profileData, interests: newInterests})
                    }} />
                    <Button variant="ghost" size="sm" onClick={() => setProfileData({...profileData, interests: profileData.interests.filter((_, idx) => idx !== i)})}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                  <Input placeholder="Short description" value={interest.description} onChange={(e) => {
                    const newInterests = [...profileData.interests]
                    newInterests[i] = { ...interest, description: e.target.value }
                    setProfileData({...profileData, interests: newInterests})
                  }} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="projects" className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Projects</h3>
              <Button size="sm" onClick={addProject}><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
            {profileData.projects.map((proj, i) => (
              <ProjectEntry key={i} project={proj} index={i} onChange={(data) => updateProject(i, data)} onRemove={() => removeProject(i)} />
            ))}
            {profileData.projects.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No projects added yet</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="border-l pl-4">
        <Label className="flex items-center gap-2 mb-2"><Eye className="w-4 h-4" /> Resume Preview</Label>
        <ResumePDFPreview 
          content={generatePreviewContent()} 
          userProfile={profileData}
          maxPages={2} 
        />
      </div>
      
      <div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
      </div>
    </div>
  )
}

// Job Form Component
function JobForm({ job, onSave, onCancel, token, userProfile }) {
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
      toast.success('Job details extracted!')
    } catch (error) {
      toast.error(error.message)
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
        <Textarea placeholder="Job description..." className="min-h-[80px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
      </div>
      
      <div>
        <Label>Requirements</Label>
        <Textarea placeholder="Requirements..." className="min-h-[60px]" value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} />
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : (job ? 'Update' : 'Add Job')}</Button>
      </div>
    </form>
  )
}

// Document Editor with PDF Preview
function DocumentEditor({ job, documentType, token, onUpdate, userProfile }) {
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
      toast.success('Document refined!')
    } catch (error) {
      toast.error(error.message)
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
        body: JSON.stringify({ [documentType]: { content, refinedContent } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Saved!')
      onUpdate(data.job)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const downloadPdf = async () => {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const text = showRefined && refinedContent ? refinedContent : content
    
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(text, 170)
    let y = 15
    
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 15 }
      doc.text(line, 20, y)
      y += 5
    })
    
    doc.save(`${job.company}-${config.label}.pdf`)
  }

  const useRefinedContent = () => {
    setContent(refinedContent)
    setRefinedContent('')
    setShowRefined(false)
    toast.success('Applied refined content')
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{config.label}</h3>
          <Badge variant="outline">Max {config.maxPages} pages</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(previewContent).then(() => toast.success('Copied!'))}><Copy className="w-4 h-4" /></Button>
          <Button size="sm" variant="outline" onClick={downloadPdf}><Download className="w-4 h-4" /></Button>
        </div>
      </div>
      
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label className="text-xs">AI Instructions (optional)</Label>
          <Input placeholder="e.g., Focus on Python skills..." value={preferences} onChange={(e) => setPreferences(e.target.value)} />
        </div>
        <Button onClick={handleRefine} disabled={refining} className="bg-purple-600 hover:bg-purple-700">
          {refining ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {refining ? 'Refining...' : 'Refine with AI'}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs"><FileEdit className="w-3 h-3 inline mr-1" />Editor</Label>
            {refinedContent && (
              <div className="flex gap-1">
                <Button size="sm" variant={!showRefined ? "default" : "ghost"} className="h-6 text-xs" onClick={() => setShowRefined(false)}>Original</Button>
                <Button size="sm" variant={showRefined ? "default" : "ghost"} className="h-6 text-xs" onClick={() => setShowRefined(true)}>Refined</Button>
              </div>
            )}
          </div>
          {showRefined && refinedContent ? (
            <div className="space-y-2">
              <Textarea className="min-h-[350px] font-mono text-xs bg-purple-50" value={refinedContent} onChange={(e) => setRefinedContent(e.target.value)} />
              <Button size="sm" variant="outline" onClick={useRefinedContent}><Check className="w-3 h-3 mr-1" />Apply</Button>
            </div>
          ) : (
            <Textarea placeholder={documentType === 'resume' ? 'AI will generate from your profile data...' : `Enter ${config.label.toLowerCase()}...`} className="min-h-[350px] font-mono text-xs" value={content} onChange={(e) => setContent(e.target.value)} />
          )}
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs"><Eye className="w-3 h-3 inline mr-1" />PDF Preview</Label>
          <div className="border rounded-lg p-2 bg-gray-50 h-[360px] overflow-hidden">
            {documentType === 'resume' ? (
              <ResumePDFPreview content={previewContent} userProfile={userProfile} maxPages={config.maxPages} />
            ) : (
              <DocumentPDFPreview content={previewContent} maxPages={config.maxPages} documentType={documentType} />
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </div>
    </div>
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
      setShowRejectDialog(false)
      toast.success('Marked as rejected')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (editing) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b">
          <h2 className="font-semibold">Edit Job</h2>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button>
        </div>
        <ScrollArea className="flex-1 p-3">
          <JobForm job={job} token={token} userProfile={userProfile} onSave={(updated) => { onUpdate(updated); setEditing(false); }} onCancel={() => setEditing(false)} />
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div>
          <h2 className="font-semibold">{job.title}</h2>
          <p className="text-sm text-muted-foreground">{job.company}</p>
        </div>
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
            <SelectContent>
              <SelectItem value="saved">Saved</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
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
                  <p className="text-xs text-red-700">{job.rejectionFeedback || 'No feedback recorded.'}</p>
                  <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setShowRejectDialog(true)}>Edit</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resume" className="mt-0">
              <DocumentEditor job={job} documentType="resume" token={token} onUpdate={onUpdate} userProfile={userProfile} />
            </TabsContent>
            
            <TabsContent value="coverLetter" className="mt-0">
              <DocumentEditor job={job} documentType="coverLetter" token={token} onUpdate={onUpdate} userProfile={userProfile} />
            </TabsContent>
            
            <TabsContent value="supportingStatement" className="mt-0">
              <DocumentEditor job={job} documentType="supportingStatement" token={token} onUpdate={onUpdate} userProfile={userProfile} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
      
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejection Feedback</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="Enter feedback..." className="min-h-[100px]" value={rejectionFeedback} onChange={(e) => setRejectionFeedback(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button onClick={handleRejectWithFeedback} disabled={updatingStatus}>{updatingStatus ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
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
    try {
      const res = await fetch('/api/jobs', { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) setJobs(data.jobs)
    } catch (error) {
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Delete this job?')) return
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
      setJobs(jobs.filter(j => j.id !== jobId))
      if (selectedJob?.id === jobId) setSelectedJob(null)
      toast.success('Deleted!')
    } catch (error) {
      toast.error('Failed to delete')
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sm">Job Tracker</h1>
              <p className="text-xs text-muted-foreground">Welcome, {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowProfile(true)}><User className="w-4 h-4 mr-1" />Profile</Button>
            <Button variant="outline" size="sm" onClick={onLogout}><LogOut className="w-4 h-4 mr-1" />Logout</Button>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Total', value: stats.total, filter: 'all' },
            { label: 'Applied', value: stats.applied, filter: 'applied', color: 'text-blue-600' },
            { label: 'Interviews', value: stats.interview, filter: 'interview', color: 'text-yellow-600' },
            { label: 'Offers', value: stats.offer, filter: 'offer', color: 'text-green-600' },
            { label: 'Rejected', value: stats.rejected, filter: 'rejected', color: 'text-red-600' }
          ].map(stat => (
            <Card key={stat.filter} className="cursor-pointer hover:shadow-md" onClick={() => setFilter(stat.filter)}>
              <CardContent className="py-3">
                <div className={`text-xl font-bold ${stat.color || ''}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="flex gap-4">
          <div className={`${selectedJob ? 'w-1/3' : 'w-full'} transition-all`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Applications</h2>
                {filter !== 'all' && <Badge variant="secondary" className="cursor-pointer" onClick={() => setFilter('all')}>{filter} <X className="w-3 h-3 ml-1" /></Badge>}
              </div>
              <Button size="sm" onClick={() => setShowAddJob(true)}><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            
            {loading ? (
              <div className="text-center py-8"><RefreshCw className="w-6 h-6 mx-auto animate-spin text-muted-foreground" /></div>
            ) : filteredJobs.length === 0 ? (
              <Card><CardContent className="py-8 text-center"><Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-2" /><p className="text-sm">No jobs found</p></CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filteredJobs.map(job => (
                  <Card key={job.id} className={`cursor-pointer hover:shadow-md ${selectedJob?.id === job.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedJob(job)}>
                    <CardContent className="py-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm">{job.title}</h3>
                          <p className="text-xs text-muted-foreground">{job.company} {job.location && `• ${job.location}`}</p>
                        </div>
                        <Badge className={statusColors[job.status]}>{job.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {selectedJob && (
            <div className="w-2/3">
              <Card className="h-[calc(100vh-220px)] overflow-hidden">
                <JobDetailsPanel 
                  job={selectedJob} 
                  token={token}
                  userProfile={user}
                  onUpdate={(updated) => { setJobs(jobs.map(j => j.id === updated.id ? updated : j)); setSelectedJob(updated); }}
                  onClose={() => setSelectedJob(null)}
                  onDelete={() => handleDeleteJob(selectedJob.id)}
                />
              </Card>
            </div>
          )}
        </div>
      </div>
      
      <Dialog open={showAddJob} onOpenChange={setShowAddJob}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Job</DialogTitle>
          </DialogHeader>
          <JobForm token={token} userProfile={user} onSave={(newJob) => { setJobs([newJob, ...jobs]); setShowAddJob(false); setSelectedJob(newJob); }} onCancel={() => setShowAddJob(false)} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Profile & Resume Data</DialogTitle>
            <DialogDescription>Your profile data is used as a template for AI-generated resumes</DialogDescription>
          </DialogHeader>
          <ProfileEditor user={user} token={token} onSave={(updated) => { localStorage.setItem('user', JSON.stringify(updated)); onUserUpdate(updated); setShowProfile(false); }} onCancel={() => setShowProfile(false)} />
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
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>
  if (!user) return <AuthPage onLogin={(u, t) => { setUser(u); setToken(t); }} />
  return <Dashboard user={user} token={token} onLogout={() => { localStorage.clear(); setUser(null); setToken(null); }} onUserUpdate={setUser} />
}
