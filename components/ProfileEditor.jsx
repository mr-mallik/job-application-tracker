'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  User, Briefcase, GraduationCap, Code, FolderOpen, 
  Plus, Clock, Sparkles, RefreshCw, FileText, Eye, Trash2
} from 'lucide-react'
import { ExperienceEntry } from './ExperienceEntry'
import { ProjectEntry } from './ProjectEntry'
import { ResumePDFPreview } from './ResumePDFPreview'

export function ProfileEditor({ user, token, onSave, onCancel }) {
  const [profileData, setProfileData] = useState({
    name: user.name || '', designation: user.designation || '', email: user.email || '',
    phone: user.phone || '', linkedin: user.linkedin || '', portfolio: user.portfolio || '',
    summary: user.summary || '', experiences: user.experiences || [],
    education: Array.isArray(user.education) ? user.education : (user.education?.degree ? [user.education] : []),
    skills: user.skills || { relevant: '', other: '' }, projects: user.projects || [],
    interests: user.interests || [], achievements: user.achievements || ''
  })
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const fileInputRef = useRef(null)

  const addExperience = () => setProfileData(prev => ({ ...prev, experiences: [...prev.experiences, { title: '', company: '', location: '', startDate: '', endDate: '', description: '' }] }))
  const updateExperience = (i, data) => setProfileData(prev => ({ ...prev, experiences: prev.experiences.map((exp, idx) => idx === i ? data : exp) }))
  const removeExperience = (i) => setProfileData(prev => ({ ...prev, experiences: prev.experiences.filter((_, idx) => idx !== i) }))
  
  const addProject = () => setProfileData(prev => ({ ...prev, projects: [...prev.projects, { title: '', url: '', description: '' }] }))
  const updateProject = (i, data) => setProfileData(prev => ({ ...prev, projects: prev.projects.map((p, idx) => idx === i ? data : p) }))
  const removeProject = (i) => setProfileData(prev => ({ ...prev, projects: prev.projects.filter((_, idx) => idx !== i) }))
  
  const addEducation = () => setProfileData(prev => ({ ...prev, education: [...prev.education, { degree: '', institution: '', location: '', grade: '', startDate: '', endDate: '' }] }))
  const updateEducation = (i, data) => setProfileData(prev => ({ ...prev, education: prev.education.map((edu, idx) => idx === i ? data : edu) }))
  const removeEducation = (i) => setProfileData(prev => ({ ...prev, education: prev.education.filter((_, idx) => idx !== i) }))
  
  const addInterest = () => setProfileData(prev => ({ ...prev, interests: [...prev.interests, { title: '', description: '' }] }))

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setParsing(true)
    toast.info('Parsing resume with AI...', { duration: 2000 })
    
    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        try {
          // Extract base64 content (remove data URL prefix)
          const base64Content = event.target.result.split(',')[1]
          
          const res = await fetch('/api/auth/parse-resume', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ base64Content })
          })
          
          const data = await res.json()
          if (!res.ok) throw new Error(data.error)
          
          // Merge parsed data with existing profile, preserving user's email
          setProfileData({
            ...data.profileData,
            email: user.email // Always preserve the authenticated user's email
          })
          
          // Clear the file input for future uploads
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          
          toast.success('Resume imported successfully! Review and edit the extracted data.')
          setActiveTab('basic')
        } catch (error) {
          console.error('Resume parsing error:', error)
          toast.error(error.message || 'Failed to parse resume')
        } finally {
          setParsing(false)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read file')
        setParsing(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('File upload error:', error)
      toast.error(error.message || 'Failed to upload file')
      setParsing(false)
    }
  }

  const sortExperiencesChronologically = () => {
    const sorted = [...profileData.experiences].sort((a, b) => {
      const parseDate = (dateStr) => {
        if (!dateStr || dateStr.toLowerCase() === 'present') return new Date()
        const parts = dateStr.split('/')
        if (parts.length === 2) {
          return new Date(parseInt(parts[1]), parseInt(parts[0]) - 1)
        }
        return new Date(0)
      }
      return parseDate(b.startDate) - parseDate(a.startDate)
    })
    setProfileData({ ...profileData, experiences: sorted })
    toast.success('Experiences sorted chronologically')
  }

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
    
    const sortedExperiences = [...profileData.experiences].sort((a, b) => {
      const parseDate = (dateStr) => {
        if (!dateStr || dateStr.toLowerCase() === 'present') return new Date()
        const parts = dateStr.split('/')
        if (parts.length === 2) {
          return new Date(parseInt(parts[1]), parseInt(parts[0]) - 1)
        }
        return new Date(0)
      }
      return parseDate(b.startDate) - parseDate(a.startDate)
    })
    
    if (sortedExperiences.length > 0) {
      content += `# RELEVANT WORK EXPERIENCE\n`
      sortedExperiences.forEach(exp => {
        content += `**${exp.title} | ${exp.company}, ${exp.location} | ${exp.startDate} - ${exp.endDate}**\n`
        if (exp.description) exp.description.split('\n').forEach(line => { if (line.trim()) content += `- ${line.trim()}\n` })
        content += '\n'
      })
    }
    if (profileData.education.length > 0) {
      content += `# EDUCATION\n`
      profileData.education.forEach(edu => {
        content += `**${edu.degree} | ${edu.grade} | ${edu.startDate} - ${edu.endDate}**\n${edu.institution}, ${edu.location}\n\n`
      })
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
    <>
    <div className="flex gap-6 h-[75vh]">
      <div className="w-1/2 overflow-y-auto pr-4">
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Import Resume with AI
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Upload your PDF resume to auto-populate all fields</p>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
                className="bg-white"
              >
                {parsing ? (
                  <><RefreshCw className="w-4 h-4 mr-1 animate-spin" />Parsing...</>
                ) : (
                  <><FileText className="w-4 h-4 mr-1" />Upload PDF</>
                )}
              </Button>
            </div>
          </div>
        </div>

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
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Work Experience</h3>
              <div className="flex gap-2">
                {profileData.experiences.length > 1 && (
                  <Button size="sm" variant="outline" onClick={sortExperiencesChronologically}>
                    <Clock className="w-4 h-4 mr-1" />Sort
                  </Button>
                )}
                <Button size="sm" onClick={addExperience}><Plus className="w-4 h-4 mr-1" />Add</Button>
              </div>
            </div>
            {profileData.experiences.map((exp, i) => <ExperienceEntry key={i} experience={exp} index={i} onChange={(data) => updateExperience(i, data)} onRemove={() => removeExperience(i)} />)}
            {profileData.experiences.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No experience added</p>}
          </TabsContent>
          
          <TabsContent value="education" className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Education</h3>
              <Button size="sm" onClick={addEducation}><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
            {profileData.education.map((edu, i) => (
              <Card key={i} className="mb-2">
                <CardContent className="pt-3 space-y-2">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Education #{i + 1}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeEducation(i)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  <Input placeholder="Degree Name" value={edu.degree} onChange={(e) => updateEducation(i, {...edu, degree: e.target.value})} />
                  <Input placeholder="Institution" value={edu.institution} onChange={(e) => updateEducation(i, {...edu, institution: e.target.value})} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Location" value={edu.location} onChange={(e) => updateEducation(i, {...edu, location: e.target.value})} />
                    <Input placeholder="Grade/GPA" value={edu.grade} onChange={(e) => updateEducation(i, {...edu, grade: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Start (mm/yyyy)" value={edu.startDate} onChange={(e) => updateEducation(i, {...edu, startDate: e.target.value})} />
                    <Input placeholder="End (mm/yyyy)" value={edu.endDate} onChange={(e) => updateEducation(i, {...edu, endDate: e.target.value})} />
                  </div>
                </CardContent>
              </Card>
            ))}
            {profileData.education.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No education added</p>}
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
      
      <div className="w-1/2 border-l pl-6 overflow-y-auto">
        <Label className="flex items-center gap-2 mb-4"><Eye className="w-4 h-4" />A4 Resume Preview</Label>
        <ResumePDFPreview content={generatePreviewContent()} userProfile={profileData} maxPages={2} />
      </div>
    
    </div>
    <div className="bg-background border-t flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
    </div>
    </>
)
}
