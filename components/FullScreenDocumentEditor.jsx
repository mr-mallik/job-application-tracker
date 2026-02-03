'use client'

import { useState, useEffect, useCallback } from 'react'
import { getResumeMarkdown } from '@/lib/currentresume.js'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Sparkles, RefreshCw, Copy, Download, Check, FileEdit, Eye } from 'lucide-react'
import { ResumePDFPreview } from './ResumePDFPreview'
import { DocumentPDFPreview } from './DocumentPDFPreview'
import { blocksToMarkdown, markdownToBlocks, validateBlocks } from '@/lib/blockConverters'
import { RESUME_TEMPLATES } from '@/lib/resumeTemplates'
import { renderTemplate } from '@/lib/templateRenderer'

export function FullScreenDocumentEditor({ job, documentType, token, onUpdate, userProfile, onClose }) {
  const docConfig = {
    resume: { label: 'Resume', maxPages: 2 },
    coverLetter: { label: 'Cover Letter', maxPages: 2 },
    supportingStatement: { label: 'Supporting Statement', maxPages: 3 }
  }
  const config = docConfig[documentType]
  
  // For resumes: use blocks system (new architecture)
  // For other docs: use markdown content (existing)
  // Initialize content first
  const [content, setContent] = useState(() => {
    // For resume with blocks: convert to markdown
    if (documentType === 'resume' && job[documentType]?.blocks) {
      return blocksToMarkdown(job[documentType].blocks)
    }
    // Legacy markdown content
    if (job[documentType]?.content) return job[documentType].content
    // Fallback: generate from profile
    if (documentType === 'resume' && userProfile) return getResumeMarkdown(userProfile)
    return ''
  })
  
  const [blocks, setBlocks] = useState(() => {
    if (documentType === 'resume') {
      // If we have blocks, use them
      if (job[documentType]?.blocks) {
        return job[documentType].blocks
      }
      // Otherwise, parse from content if available
      if (job[documentType]?.content) {
        return markdownToBlocks(job[documentType].content)
      }
      // Or parse from profile
      if (userProfile) {
        const profileMarkdown = getResumeMarkdown(userProfile)
        return markdownToBlocks(profileMarkdown)
      }
    }
    return null
  })
  
  const [template, setTemplate] = useState(() => {
    if (documentType === 'resume') {
      return job[documentType]?.template || 'harvard'
    }
    return null
  })
  
  const [refinedContent, setRefinedContent] = useState(job[documentType]?.refinedContent || '')
  const [preferences, setPreferences] = useState('')
  const [refining, setRefining] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showRefined, setShowRefined] = useState(false)
  const [lastSyncedMarkdown, setLastSyncedMarkdown] = useState(content)
  
  // Debounce timer for markdown→blocks sync
  const [syncTimer, setSyncTimer] = useState(null)

  // Sync markdown → blocks when content changes (debounced)
  useEffect(() => {
    if (documentType !== 'resume') return
    if (content === lastSyncedMarkdown) return
    
    // Clear existing timer
    if (syncTimer) clearTimeout(syncTimer)
    
    // Set new timer to parse after 1 second of no changes
    const timer = setTimeout(() => {
      try {
        const parsedBlocks = markdownToBlocks(content)
        setBlocks(parsedBlocks)
        setLastSyncedMarkdown(content)
      } catch (error) {
        console.error('Failed to parse markdown to blocks:', error)
      }
    }, 1000)
    
    setSyncTimer(timer)
    
    // Cleanup
    return () => clearTimeout(timer)
  }, [content, documentType, lastSyncedMarkdown])
  
  // Sync blocks → markdown when blocks change externally (e.g., from refine)
  useEffect(() => {
    if (documentType !== 'resume' || !blocks) return
    
    const newMarkdown = blocksToMarkdown(blocks)
    if (newMarkdown !== content && newMarkdown !== lastSyncedMarkdown) {
      setContent(newMarkdown)
      setLastSyncedMarkdown(newMarkdown)
    }
  }, [blocks, documentType])

  // Determine preview content
  const previewContent = documentType === 'resume' && blocks 
    ? { blocks, template }
    : (showRefined && refinedContent ? refinedContent : content)
  
  const handleTemplateChange = (newTemplate) => {
    setTemplate(newTemplate)
  }

  const handleContentChange = (newContent) => {
    setContent(newContent)
  }

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
      
      // For resume, API now returns {blocks}
      if (documentType === 'resume' && data.blocks) {
        setBlocks(data.blocks)
        const refinedMd = blocksToMarkdown(data.blocks)
        setRefinedContent(refinedMd)
        setLastSyncedMarkdown(refinedMd)
      } else {
        setRefinedContent(data.refinedContent)
      }
      
      setShowRefined(true)
      toast.success('Refined!')
    } catch (error) { toast.error(error.message) } finally { setRefining(false) }
  }

  const handleSave = async () => {
    // Validate blocks before saving (for resumes)
    if (documentType === 'resume' && blocks) {
      const validation = validateBlocks(blocks)
      if (!validation.valid) {
        toast.error(`Validation failed: ${validation.errors[0]}`)
        return
      }
    }
    
    setSaving(true)
    try {
      const payload = documentType === 'resume' 
        ? { [documentType]: { blocks, template } }
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
  
  const useRefinedContent = () => {
    setContent(refinedContent)
    setLastSyncedMarkdown(refinedContent)
    setShowRefined(false)
    toast.success('Applied refined content')
  }

  const downloadPdf = async () => {
    try {
      if (documentType === 'resume' && blocks) {
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF()
        
        // Template-specific rendering
        if (template === '2columns') {
          // 2 COLUMNS TEMPLATE
          let y = 20
          const leftColX = 15
          const leftColWidth = 60
          const rightColX = 80
          const rightColWidth = 115
          const lineHeight = 5
          
          const checkPageBreak = (space = lineHeight) => {
            if (y + space > 280) {
              doc.addPage()
              y = 20
            }
          }
          
          // Header
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(20)
          doc.text(blocks.name?.toUpperCase() || '', 15, y)
          y += 7
          
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.setTextColor(61, 126, 255)
          if (blocks.subtitle) {
            doc.text(blocks.subtitle, 15, y)
            y += 5
          }
          
          doc.setTextColor(102, 102, 102)
          doc.setFontSize(9)
          const contact2col = [blocks.email, blocks.linkedin ? 'LinkedIn' : '', blocks.phone, blocks.location].filter(Boolean).join(' • ')
          doc.text(contact2col, 15, y)
          y += 10
          
          doc.setTextColor(0, 0, 0)
          
          // LEFT COLUMN - Achievements, Skills, Courses
          let leftY = y
          
          if (blocks.achievements?.length > 0) {
            doc.setFontSize(9)
            doc.setTextColor(102, 102, 102)
            doc.text('KEY ACHIEVEMENTS', leftColX, leftY)
            leftY += 3
            doc.setDrawColor(191, 198, 209)
            doc.setLineWidth(0.5)
            doc.line(leftColX, leftY, leftColX + leftColWidth, leftY)
            leftY += 5
            
            blocks.achievements.slice(0, 4).forEach(ach => {
              doc.setFontSize(10)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(10, 62, 161)
              const titleLines = doc.splitTextToSize(ach.title || '', leftColWidth - 5)
              titleLines.forEach(line => {
                doc.text(line, leftColX, leftY)
                leftY += 4
              })
              
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(9)
              doc.setTextColor(85, 85, 85)
              const descLines = doc.splitTextToSize(ach.description || '', leftColWidth - 5)
              descLines.forEach(line => {
                doc.text(line, leftColX, leftY)
                leftY += 4
              })
              leftY += 3
            })
          }
          
          if (blocks.skills?.technical || blocks.skills?.relevant || blocks.skills?.other) {
            leftY += 5
            doc.setFontSize(9)
            doc.setTextColor(102, 102, 102)
            doc.text('SKILLS', leftColX, leftY)
            leftY += 3
            doc.line(leftColX, leftY, leftColX + leftColWidth, leftY)
            leftY += 5
            
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(10, 62, 161)
            const allSkills2col = [blocks.skills.technical, blocks.skills.relevant, blocks.skills.other].filter(Boolean).join(', ')
            const skillLines2col = doc.splitTextToSize(allSkills2col, leftColWidth)
            skillLines2col.forEach(line => {
              doc.text(line, leftColX, leftY)
              leftY += 4
            })
          }
          
          if (blocks.courses?.length > 0) {
            leftY += 5
            doc.setFontSize(9)
            doc.setTextColor(102, 102, 102)
            doc.text('TRAINING / COURSES', leftColX, leftY)
            leftY += 3
            doc.line(leftColX, leftY, leftColX + leftColWidth, leftY)
            leftY += 5
            
            blocks.courses.forEach(course => {
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(9)
              doc.setTextColor(61, 126, 255)
              doc.text(course.title || '', leftColX, leftY)
              leftY += 4
              
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(0, 0, 0)
              doc.text(course.provider || 'Online', leftColX, leftY)
              leftY += 6
            })
          }
          
          // RIGHT COLUMN - Summary, Experience, Education
          let rightY = y
          doc.setTextColor(0, 0, 0)
          
          if (blocks.summary) {
            doc.setFontSize(9)
            doc.setTextColor(102, 102, 102)
            doc.text('SUMMARY', rightColX, rightY)
            rightY += 3
            doc.line(rightColX, rightY, rightColX + rightColWidth, rightY)
            rightY += 5
            
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(68, 68, 68)
            const summaryLines2col = doc.splitTextToSize(blocks.summary, rightColWidth)
            summaryLines2col.forEach(line => {
              doc.text(line, rightColX, rightY)
              rightY += 5
            })
            rightY += 3
          }
          
          if (blocks.experiences?.length > 0) {
            doc.setFontSize(9)
            doc.setTextColor(102, 102, 102)
            doc.text('EXPERIENCE', rightColX, rightY)
            rightY += 3
            doc.line(rightColX, rightY, rightColX + rightColWidth, rightY)
            rightY += 5
            
            blocks.experiences.forEach(exp => {
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(11)
              doc.setTextColor(10, 62, 161)
              doc.text(exp.title || '', rightColX, rightY)
              rightY += 5
              
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(10)
              doc.setTextColor(61, 126, 255)
              doc.text(exp.company || '', rightColX, rightY)
              rightY += 4
              
              doc.setFontSize(8)
              doc.setTextColor(119, 119, 119)
              doc.text(`${exp.startDate || ''} – ${exp.endDate || ''} | ${exp.location || ''}`, rightColX, rightY)
              rightY += 5
              
              if (exp.achievements) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(10)
                doc.setTextColor(0, 0, 0)
                const achievements = exp.achievements.split('\n').filter(a => a.trim() && !a.startsWith('#'))
                achievements.forEach(ach => {
                  const cleanAch = ach.trim().replace(/^[-•*]\s*/, '')
                  const achLines = doc.splitTextToSize(cleanAch, rightColWidth - 5)
                  achLines.forEach((line, idx) => {
                    if (idx === 0) {
                      doc.text('•', rightColX, rightY)
                      doc.text(line, rightColX + 5, rightY)
                    } else {
                      doc.text(line, rightColX + 5, rightY)
                    }
                    rightY += 4
                  })
                })
              }
              rightY += 3
            })
          }
          
          if (blocks.education?.length > 0) {
            doc.setFontSize(9)
            doc.setTextColor(102, 102, 102)
            doc.text('EDUCATION', rightColX, rightY)
            rightY += 3
            doc.line(rightColX, rightY, rightColX + rightColWidth, rightY)
            rightY += 5
            
            blocks.education.forEach(edu => {
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(10)
              doc.setTextColor(0, 0, 0)
              doc.text(`${edu.degree || ''}${edu.grade ? ` (${edu.grade})` : ''}`, rightColX, rightY)
              rightY += 5
              
              doc.setFont('helvetica', 'normal')
              doc.text(`${edu.institution || ''} (${edu.startDate || ''} – ${edu.endDate || ''})`, rightColX, rightY)
              rightY += 6
            })
          }
          
        } else {
          // HARVARD TEMPLATE (default)
          let y = 20
          const leftMargin = 20
          const rightMargin = 190
          const lineHeight = 5
          
          const checkPageBreak = (space = lineHeight) => {
            if (y + space > 280) {
              doc.addPage()
              y = 20
            }
          }
          
          // Header
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(22)
          doc.text(blocks.name || '', 105, y, { align: 'center' })
          y += 7
          
          if (blocks.subtitle) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.setTextColor(85, 85, 85)
            doc.text(blocks.subtitle, 105, y, { align: 'center' })
            y += 5
          }
          
          doc.setFontSize(9)
          const contactParts = [blocks.email, blocks.linkedin ? 'LinkedIn' : '', blocks.phone, blocks.location].filter(Boolean).join(' • ')
          doc.text(contactParts, 105, y, { align: 'center' })
          y += 10
          
          doc.setTextColor(0, 0, 0)
          
          // Summary
          if (blocks.summary) {
            checkPageBreak(15)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(13)
            doc.text('Summary', leftMargin, y)
            y += 2
            doc.setLineWidth(0.3)
            doc.line(leftMargin, y, rightMargin, y)
            y += 6
            
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            const summaryLines = doc.splitTextToSize(blocks.summary, rightMargin - leftMargin)
            summaryLines.forEach(line => {
              checkPageBreak()
              doc.text(line, leftMargin, y)
              y += lineHeight
            })
            y += 5
          }
          
          // Experience
          if (blocks.experiences?.length > 0) {
            checkPageBreak(15)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(13)
            doc.text('Experience', leftMargin, y)
            y += 2
            doc.line(leftMargin, y, rightMargin, y)
            y += 6
            
            blocks.experiences.forEach(exp => {
              checkPageBreak(20)
              
              // Title and dates on same line
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(11)
              doc.text(exp.title || '', leftMargin, y)
              doc.text(`${exp.startDate || ''} – ${exp.endDate || ''}`, rightMargin, y, { align: 'right' })
              y += 5
              
              // Company and location on another line
              doc.setFont('helvetica', 'normal')
              doc.setFontSize(10)
              doc.text(exp.company || '', leftMargin, y)
              if (exp.location) {
                doc.text(exp.location, rightMargin, y, { align: 'right' })
              }
              y += 5
              
              // Achievements
              if (exp.achievements) {
                const achievements = exp.achievements.split('\n').filter(a => a.trim() && !a.startsWith('#'))
                achievements.forEach(ach => {
                  checkPageBreak(8)
                  const cleanAch = ach.trim().replace(/^[-•*]\s*/, '')
                  const achLines = doc.splitTextToSize(cleanAch, rightMargin - leftMargin - 8)
                  achLines.forEach((line, idx) => {
                    if (idx === 0) {
                      doc.text('•', leftMargin + 2, y)
                      doc.text(line, leftMargin + 8, y)
                    } else {
                      checkPageBreak()
                      doc.text(line, leftMargin + 8, y)
                    }
                    y += lineHeight
                  })
                })
              }
              y += 4
            })
          }
          
          // Education
          if (blocks.education?.length > 0) {
            checkPageBreak(15)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(13)
            doc.text('Education', leftMargin, y)
            y += 2
            doc.line(leftMargin, y, rightMargin, y)
            y += 6
            
            blocks.education.forEach(edu => {
              checkPageBreak(10)
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(10)
              const degreeText = `${edu.degree || ''}${edu.grade ? ` (${edu.grade})` : ''} — ${edu.institution || ''}`
              doc.text(degreeText, leftMargin, y)
              doc.text(`${edu.startDate || ''} – ${edu.endDate || ''}`, rightMargin, y, { align: 'right' })
              y += 6
            })
            y += 3
          }
          
          // Skills
          if (blocks.skills?.technical || blocks.skills?.relevant || blocks.skills?.other) {
            checkPageBreak(15)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(13)
            doc.text('Skills', leftMargin, y)
            y += 2
            doc.line(leftMargin, y, rightMargin, y)
            y += 6
            
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            const allSkills = [blocks.skills.technical, blocks.skills.relevant, blocks.skills.other].filter(Boolean).join(' · ')
            const skillLines = doc.splitTextToSize(allSkills, rightMargin - leftMargin)
            skillLines.forEach(line => {
              checkPageBreak()
              doc.text(line, leftMargin, y)
              y += lineHeight
            })
            y += 3
          }
          
          // Courses
          if (blocks.courses?.length > 0) {
            checkPageBreak(15)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(13)
            doc.text('Training / Courses', leftMargin, y)
            y += 2
            doc.line(leftMargin, y, rightMargin, y)
            y += 6
            
            blocks.courses.forEach(course => {
              checkPageBreak(8)
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(10)
              doc.text(`• ${course.title}`, leftMargin + 2, y)
              y += 5
              doc.setFont('helvetica', 'normal')
              doc.text(`  ${course.provider || 'Online'}`, leftMargin + 2, y)
              y += 6
            })
          }
          
          // Achievements
          if (blocks.achievements?.length > 0) {
            checkPageBreak(15)
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(13)
            doc.text('Key Achievements', leftMargin, y)
            y += 2
            doc.line(leftMargin, y, rightMargin, y)
            y += 6
            
            blocks.achievements.slice(0, 3).forEach(ach => {
              checkPageBreak(10)
              doc.setFont('helvetica', 'bold')
              doc.setFontSize(10)
              doc.text(ach.title || '', leftMargin, y)
              y += 5
              
              doc.setFont('helvetica', 'normal')
              const descLines = doc.splitTextToSize(ach.description || '', rightMargin - leftMargin)
              descLines.forEach(line => {
                checkPageBreak()
                doc.text(line, leftMargin, y)
                y += lineHeight
              })
              y += 4
            })
          }
        }
        
        doc.save(`${job.company}-${config.label}.pdf`)
        toast.success('PDF downloaded!')
        return
      }
      
      // Fallback to jsPDF for other document types
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      const text = showRefined && refinedContent ? refinedContent : content
      
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
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Failed to generate PDF')
    }
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
          {documentType === 'resume' && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Template:</Label>
                <Select value={template} onValueChange={handleTemplateChange}>
                  <SelectTrigger className="w-[180px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(RESUME_TEMPLATES).map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
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
                placeholder={documentType === 'resume' ? '# Your Name\nYour Title/Designation\nemail@example.com • +1234567890 • City, Country\n\n## Summary\nYour professional summary...\n\n## Experience\n\n### Job Title | Company\n*mm/yyyy - mm/yyyy* • Location\n\n- Achievement 1\n- Achievement 2' : `Enter your ${config.label.toLowerCase()} content...`}
                className="h-full font-mono text-sm resize-none"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
              />
            )}
          </div>
        </div>
        
        <div className="w-1/2 flex flex-col bg-gray-100">
          <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              A4 PDF Preview {documentType === 'resume' && blocks && '(HTML Template)'}
            </Label>
            {documentType === 'resume' && blocks && template && (
              <span className="text-xs text-purple-600 font-medium">
                Using {RESUME_TEMPLATES[template]?.name || template}
              </span>
            )}
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
