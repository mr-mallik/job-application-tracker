'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ExternalLink, FileText, Sparkles, RefreshCw, Bell } from 'lucide-react'

export function JobForm({ job, onSave, onCancel, token, userProfile }) {
  const [loading, setLoading] = useState(false)
  const [scraping, setScraping] = useState(false)
  const [extractionMode, setExtractionMode] = useState('url')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [formData, setFormData] = useState({
    title: job?.title || '', company: job?.company || '', location: job?.location || '',
    salary: job?.salary || '', closingDate: job?.closingDate || '',
    appliedDate: job?.appliedDate || new Date().toISOString().split('T')[0],
    status: job?.status || 'saved', url: job?.url || '', description: job?.description || '',
    requirements: job?.requirements || '', benefits: job?.benefits || '', notes: job?.notes || '',
    reminder: {
      enabled: job?.reminder?.enabled || false,
      daysBefore: job?.reminder?.daysBefore || null
    }
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

  const handleExtractFromText = async () => {
    if (!jobDescriptionText.trim()) { toast.error('Paste job description first'); return }
    setScraping(true)
    try {
      const res = await fetch('/api/jobs/extract-text', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ text: jobDescriptionText }) })
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
      <div className="space-y-3">
        <div className="flex gap-2 border-b pb-2">
          <Button type="button" size="sm" variant={extractionMode === 'url' ? 'default' : 'outline'} onClick={() => setExtractionMode('url')}>
            <ExternalLink className="w-3 h-3 mr-1" />From URL
          </Button>
          <Button type="button" size="sm" variant={extractionMode === 'text' ? 'default' : 'outline'} onClick={() => setExtractionMode('text')}>
            <FileText className="w-3 h-3 mr-1" />Paste Text
          </Button>
        </div>
        
        {extractionMode === 'url' ? (
          <div className="flex gap-2">
            <div className="flex-1"><Label>Job URL</Label><Input placeholder="https://..." value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} /></div>
            <div className="flex items-end"><Button type="button" variant="outline" onClick={handleScrape} disabled={scraping}>{scraping ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}{scraping ? 'Extracting...' : 'Extract'}</Button></div>
          </div>
        ) : (
          <>
          <div>
            <Label>Job Description</Label>
            <div className="mt-1 space-y-2">
              <Textarea 
                className="min-h-[120px] font-mono text-xs" 
                placeholder="Paste the full job description here...\n\nInclude:\n- Job title\n- Company name\n- Location\n- Salary (if mentioned)\n- Job description\n- Requirements\n- Benefits\n- Application deadline"
                value={jobDescriptionText}
                onChange={(e) => setJobDescriptionText(e.target.value)}
              />
              <Button type="button" variant="outline" className="w-full" onClick={handleExtractFromText} disabled={scraping}>
                {scraping ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {scraping ? 'Extracting...' : 'Extract Job Details with AI'}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><Label>Job URL</Label><Input placeholder="https://..." value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} /></div>
          </div>
          </>
        )}
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
      <div className="border rounded-lg p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Checkbox 
            id="reminder-enabled" 
            checked={formData.reminder.enabled}
            onCheckedChange={(checked) => setFormData({...formData, reminder: {...formData.reminder, enabled: checked}})}
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="reminder-enabled" className="cursor-pointer font-medium">Email Reminder</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Receive email reminders before the application deadline
            </p>
            {formData.reminder.enabled && (
              <div className="pt-2">
                <Label className="text-xs">Custom reminder (optional)</Label>
                <Input 
                  type="number" 
                  min="1" 
                  placeholder="Leave empty for defaults (7 & 1 day before)"
                  value={formData.reminder.daysBefore || ''}
                  onChange={(e) => setFormData({...formData, reminder: {...formData.reminder, daysBefore: e.target.value ? parseInt(e.target.value) : null}})}
                  className="w-full mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.reminder.daysBefore 
                    ? `Reminder will be sent ${formData.reminder.daysBefore} day${formData.reminder.daysBefore === 1 ? '' : 's'} before deadline`
                    : 'Default: Reminders at 7 days and 1 day before deadline'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div><Label>Description</Label><Textarea className="min-h-[80px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
      <div><Label>Requirements</Label><Textarea className="min-h-[60px]" value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} /></div>
      <div className="flex gap-2 justify-end"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={loading}>{loading ? 'Saving...' : (job ? 'Update' : 'Add Job')}</Button></div>
    </form>
  )
}
