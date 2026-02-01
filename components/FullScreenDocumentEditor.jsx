'use client'

import { useState } from 'react'
import { getResumeMarkdown } from '@/lib/currentresume.js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { X, Sparkles, RefreshCw, Copy, Download, Check, FileEdit, Eye } from 'lucide-react'
import { ResumePDFPreview } from './ResumePDFPreview'
import { DocumentPDFPreview } from './DocumentPDFPreview'

export function FullScreenDocumentEditor({ job, documentType, token, onUpdate, userProfile, onClose }) {
  const docConfig = {
    resume: { label: 'Resume', maxPages: 2 },
    coverLetter: { label: 'Cover Letter', maxPages: 2 },
    supportingStatement: { label: 'Supporting Statement', maxPages: 3 }
  }
  const config = docConfig[documentType]
  
  const [content, setContent] = useState(() => {
    if (job[documentType]?.content) return job[documentType].content
    if (documentType === 'resume' && userProfile) return getResumeMarkdown(userProfile)
    return ''
  })
  const [refinedContent, setRefinedContent] = useState(job[documentType]?.refinedContent || '')
  const [blockData, setBlockData] = useState(job[documentType]?.blockData || null)
  const [preferences, setPreferences] = useState('')
  const [refining, setRefining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showRefined, setShowRefined] = useState(false)

  // For resume with block data, use that; otherwise fall back to refined/content
  const previewContent = documentType === 'resume' && blockData 
    ? blockData 
    : (showRefined && refinedContent ? refinedContent : content)

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
      
      // For resume, store both blockData and refinedContent
      if (documentType === 'resume' && data.blockData) {
        setBlockData(data.blockData)
        setRefinedContent(data.refinedContent)
      } else {
        setRefinedContent(data.refinedContent)
      }
      
      setShowRefined(true)
      toast.success('Refined!')
    } catch (error) { toast.error(error.message) } finally { setRefining(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = documentType === 'resume' 
        ? { [documentType]: { content, refinedContent, blockData } }
        : { [documentType]: { content, refinedContent } }
        
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
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
    
    // For resume with block data, convert to readable text
    let text = ''
    if (documentType === 'resume' && blockData) {
      text = convertBlockDataToText(blockData)
    } else {
      text = showRefined && refinedContent ? refinedContent : content
    }
    
    let y = 20
    const leftMargin = 20
    const rightMargin = 190
    const lineHeight = 6
    const maxY = 280
    
    const checkPageBreak = (requiredSpace = lineHeight) => {
      if (y + requiredSpace > maxY) {
        doc.addPage()
        y = 20
      }
    }
    
    if (documentType === 'resume' && userProfile) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      const name = userProfile.name || ''
      doc.text(name, 105, y, { align: 'center' })
      y += 8
      
      if (userProfile.designation) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(userProfile.designation, 105, y, { align: 'center' })
        y += 6
      }
      
      doc.setFontSize(9)
      const contactParts = []
      if (userProfile.email) contactParts.push(userProfile.email)
      if (userProfile.phone) contactParts.push(userProfile.phone)
      if (userProfile.linkedin) contactParts.push(userProfile.linkedin)
      if (userProfile.portfolio) contactParts.push(userProfile.portfolio)
      const contactLine = contactParts.join(' | ')
      doc.text(contactLine, 105, y, { align: 'center' })
      y += 8
      
      doc.setDrawColor(100, 100, 100)
      doc.line(leftMargin, y, rightMargin, y)
      y += 8
    }
    
    const lines = text.split('\n')
    
    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) {
        y += 3
        return
      }
      
      if (trimmed.match(/^#\s+[A-Z]/) || (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('-') && !trimmed.startsWith('**'))) {
        checkPageBreak(10)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        const headingText = trimmed.replace(/^#+\s*/, '')
        doc.text(headingText, leftMargin, y)
        y += 4
        doc.setDrawColor(150, 150, 150)
        doc.line(leftMargin, y, rightMargin, y)
        y += 6
        return
      }
      
      if (trimmed.startsWith('**') || (trimmed.includes('|') && !trimmed.startsWith('-'))) {
        checkPageBreak(8)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        const subheadingText = trimmed.replace(/\*\*/g, '')
        doc.text(subheadingText, leftMargin, y)
        y += 6
        return
      }
      
      if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
        checkPageBreak(6)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        const bulletText = trimmed.replace(/^[-•]\s*/, '')
        const wrappedLines = doc.splitTextToSize(bulletText, rightMargin - leftMargin - 8)
        wrappedLines.forEach((wrappedLine, idx) => {
          if (idx === 0) {
            doc.text('•', leftMargin + 3, y)
            doc.text(wrappedLine, leftMargin + 8, y)
          } else {
            checkPageBreak()
            doc.text(wrappedLine, leftMargin + 8, y)
          }
          y += lineHeight
        })
        return
      }
      
      checkPageBreak(6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const wrappedLines = doc.splitTextToSize(trimmed, rightMargin - leftMargin)
      wrappedLines.forEach(wrappedLine => {
        checkPageBreak()
        doc.text(wrappedLine, leftMargin, y)
        y += lineHeight
      })
    })
    
    doc.save(`${job.company}-${config.label}.pdf`)
  }

  // Helper to convert block data to markdown for editing
  const convertBlockDataToMarkdown = (data) => {
    let md = ''
    if (data.summary) md += `# SUMMARY\n${data.summary}\n\n`
    if (data.experiences) {
      md += `# EXPERIENCE\n`
      data.experiences.forEach(exp => {
        md += `**${exp.title} | ${exp.company}, ${exp.location} | ${exp.startDate} - ${exp.endDate}**\n`
        if (exp.achievements) md += `${exp.achievements}\n`
        md += '\n'
      })
    }
    if (data.education) {
      md += `# EDUCATION\n`
      data.education.forEach(edu => {
        md += `**${edu.degree} | ${edu.grade} | ${edu.startDate} - ${edu.endDate}**\n${edu.institution}, ${edu.location}\n\n`
      })
    }
    if (data.skills) {
      md += `# SKILLS\n**Technical:** ${data.skills.technical || data.skills.relevant || ''}\n**Other:** ${data.skills.other || ''}\n\n`
    }
    return md
  }

  // Helper to convert block data to plain text for PDF
  const convertBlockDataToText = (data) => {
    let text = `${data.name || ''}\n${data.subtitle || ''}\n\n`
    if (data.summary) text += `SUMMARY\n${data.summary}\n\n`
    if (data.experiences) {
      text += `EXPERIENCE\n`
      data.experiences.forEach(exp => {
        text += `${exp.title} | ${exp.company}, ${exp.location} | ${exp.startDate} - ${exp.endDate}\n`
        if (exp.achievements) text += `${exp.achievements}\n`
        text += '\n'
      })
    }
    if (data.education) {
      text += `EDUCATION\n`
      data.education.forEach(edu => {
        text += `${edu.degree} | ${edu.institution} | ${edu.startDate} - ${edu.endDate}\n`
      })
      text += '\n'
    }
    return text
  }

  const useRefinedContent = () => {
    if (documentType === 'resume' && blockData) {
      setContent(convertBlockDataToMarkdown(blockData))
      setBlockData(null)
    } else {
      setContent(refinedContent)
    }
    setRefinedContent('')
    setShowRefined(false)
    toast.success('Applied')
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
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
      
      <div className="flex-1 flex overflow-hidden">
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
        
        <div className="w-1/2 flex flex-col bg-gray-100">
          <div className="px-4 py-2 border-b bg-muted/50">
            <Label className="flex items-center gap-2"><Eye className="w-4 h-4" />A4 PDF Preview (Inter Font)</Label>
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
