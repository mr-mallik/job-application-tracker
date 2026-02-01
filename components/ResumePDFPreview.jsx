'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { A4_WIDTH, A4_HEIGHT } from './constants'

/**
 * ResumePDFPreview - Renders resume previews using either:
 * 1. Structured block data with HTML templates (new approach)
 * 2. Markdown content (legacy fallback)
 * 
 * Props:
 * - content: Markdown string (legacy) OR structured block data object
 * - userProfile: User profile data
 * - maxPages: Maximum allowed pages (default: 2)
 * - compact: Compact mode for smaller previews
 * - template: Template ID (default: 'harvard')
 */
export function ResumePDFPreview({ content, userProfile, maxPages = 2, compact = false, template = 'harvard' }) {
  const [htmlContent, setHtmlContent] = useState('')
  const [overflow, setOverflow] = useState(false)
  const [isBlockData, setIsBlockData] = useState(false)
  
  // Detect if content is structured block data or markdown
  const isStructuredData = useCallback((data) => {
    return data && typeof data === 'object' && !Array.isArray(data) && 
           (data.experiences || data.education || data.skills)
  }, [])

  useEffect(() => {
    // Check if content is structured block data
    if (isStructuredData(content)) {
      setIsBlockData(true)
      renderFromBlockData(content)
    } else if (typeof content === 'string') {
      // Legacy markdown rendering
      setIsBlockData(false)
      renderFromMarkdown(content, userProfile)
    } else {
      setHtmlContent('')
      setOverflow(false)
    }
  }, [content, userProfile, template])

  const renderFromBlockData = (blockData) => {
    try {
      // Build HTML using template approach
      const html = buildHtmlFromTemplate(blockData, template)
      setHtmlContent(html)
      
      // Simple page count estimation (can be improved with actual rendering)
      const estimatedPages = estimatePages(blockData)
      setOverflow(estimatedPages > maxPages)
    } catch (error) {
      console.error('Error rendering block data:', error)
      setHtmlContent('<div class="error">Failed to render resume</div>')
    }
  }

  const renderFromMarkdown = (markdown, profile) => {
    // Legacy markdown parsing (existing logic)
    const { header, sections } = parseMarkdownContent(markdown, profile)
    
    if (!header && sections.length === 0) {
      setHtmlContent('')
      setOverflow(false)
      return
    }

    // Build simple HTML from markdown
    let html = '<div class="resume-preview">'
    
    if (header) {
      html += buildHeaderHtml(header)
    }
    
    sections.forEach(section => {
      html += buildSectionHtml(section)
    })
    
    html += '</div>'
    
    setHtmlContent(html)
    
    // Estimate page count
    const estimatedLines = sections.reduce((sum, s) => sum + s.items.length + 2, 0)
    setOverflow(estimatedLines > (maxPages * 45))
  }

  const buildHtmlFromTemplate = (blockData, templateId) => {
    // Simple HTML builder - can be enhanced to use actual template files
    const data = {
      name: blockData.name || '',
      subtitle: blockData.subtitle || blockData.designation || '',
      email: blockData.email || '',
      phone: blockData.phone || '',
      linkedin: blockData.linkedin || '',
      location: blockData.location || '',
      summary: blockData.summary || '',
      experiences: blockData.experiences || [],
      education: blockData.education || [],
      skills: blockData.skills || {},
      courses: blockData.courses || [],
      achievements: blockData.achievements || []
    }

    let html = `
      <div class="resume-template harvard" style="font-family: Arial, sans-serif; padding: 40px 60px; line-height: 1.5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-family: Georgia, serif; font-size: 32px; margin: 0;">${data.name}</h1>
          <div style="font-size: 14px; color: #555; margin: 4px 0;">${data.subtitle}</div>
          <div style="font-size: 13px; color: #555;">
            ${[data.email, data.linkedin ? 'LinkedIn' : '', data.phone, data.location].filter(Boolean).join(' • ')}
          </div>
        </div>

        ${data.summary ? `
        <div style="margin-top: 30px;">
          <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Summary</h2>
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
          <p style="font-size: 14px; text-align: justify;">${data.summary}</p>
        </div>
        ` : ''}

        ${data.experiences.length > 0 ? `
        <div style="margin-top: 30px;">
          <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Experience</h2>
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
          ${data.experiences.map((exp, idx) => `
            <div style="margin-bottom: 18px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 15px;">
                <span>${exp.company || ''}</span>
                <span>${exp.location || ''}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px;">
                <span>${exp.title || ''}</span>
                <span>${exp.startDate || ''} – ${exp.endDate || ''}</span>
              </div>
              <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 14px;">
                ${exp.achievements ? exp.achievements.split('\n').filter(a => a.trim() && !a.trim().startsWith('#')).map(achievement => 
                  `<li style="margin-bottom: 6px;">${achievement.trim().replace(/^[-•*]\s*/, '')}</li>`
                ).join('') : ''}
              </ul>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${data.education.length > 0 ? `
        <div style="margin-top: 30px;">
          <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Education</h2>
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
          ${data.education.map(edu => `
            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
              <span><strong>${edu.institution || ''}</strong> — ${edu.degree || ''}${edu.grade ? ` (${edu.grade})` : ''}</span>
              <span>${edu.startDate || ''} – ${edu.endDate || ''}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${(data.skills.technical || data.skills.relevant || data.skills.other) ? `
        <div style="margin-top: 30px;">
          <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Skills</h2>
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
          <div style="font-size: 14px;">
            ${[data.skills.technical, data.skills.relevant, data.skills.other].filter(Boolean).join(' · ')}
          </div>
        </div>
        ` : ''}

        ${data.courses && data.courses.length > 0 ? `
        <div style="margin-top: 30px;">
          <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Training / Courses</h2>
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
          <ul style="margin: 6px 0 0 18px; padding: 0; font-size: 14px;">
            ${data.courses.map(course => `
              <li style="margin-bottom: 6px;"><strong>${course.title}</strong> — ${course.provider || 'Online'}</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}

        ${data.achievements && data.achievements.length > 0 ? `
        <div style="margin-top: 30px;">
          <h2 style="font-family: Georgia, serif; font-size: 18px; margin-bottom: 6px;">Key Achievements</h2>
          <div style="border-bottom: 1px solid #000; margin-bottom: 12px;"></div>
          <div style="display: flex; gap: 20px; font-size: 14px;">
            ${data.achievements.slice(0, 3).map(achievement => `
              <div style="flex: 1;">
                <strong>${achievement.title || ''}</strong><br>
                ${achievement.description || ''}
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `
    
    return html
  }

  const estimatePages = (blockData) => {
    // Simple estimation based on content
    const experienceLines = (blockData.experiences || []).reduce((sum, exp) => {
      const achievements = exp.achievements ? exp.achievements.split('\n').length : 0
      return sum + 4 + achievements
    }, 0)
    
    const educationLines = (blockData.education || []).length * 2
    const skillsLines = 4
    const summaryLines = blockData.summary ? 3 : 0
    const achievementLines = (blockData.achievements || []).length > 0 ? 8 : 0
    
    const totalLines = summaryLines + experienceLines + educationLines + skillsLines + achievementLines + 10
    return Math.ceil(totalLines / 45)
  }

  const parseMarkdownContent = (text, profile) => {
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
  }

  const buildHeaderHtml = (header) => {
    return `
      <div style="text-center: center; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #666;">
        <h1 style="font-size: 24px; font-weight: bold; margin: 0; font-family: Georgia, serif;">${header.name}</h1>
        ${header.designation ? `<p style="font-size: 14px; color: #666; margin-top: 4px;">${header.designation}</p>` : ''}
        <div style="font-size: 12px; color: #0066cc; margin-top: 8px;">
          ${[header.email, header.phone, header.linkedin, header.portfolio].filter(Boolean).join(' | ')}
        </div>
      </div>
    `
  }

  const buildSectionHtml = (section) => {
    return `
      <div style="margin-bottom: 16px;">
        <h2 style="font-size: 16px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px; font-family: Georgia, serif;">
          ${section.title}
        </h2>
        <div style="font-size: 13px; line-height: 1.6;">
          ${section.items.map(item => {
            const isSubheading = item.startsWith('**') || (item.includes('|') && !item.startsWith('-'))
            const isBullet = item.startsWith('-') || item.startsWith('•')
            
            if (isSubheading) {
              return `<p style="font-weight: 600; margin-top: 8px;">${item.replace(/\*\*/g, '')}</p>`
            } else if (isBullet) {
              return `<p style="margin-left: 16px; color: #333;">• ${item.replace(/^[-•]\s*/, '')}</p>`
            } else {
              return `<p style="color: #333;">${item}</p>`
            }
          }).join('')}
        </div>
      </div>
    `
  }

  if (!htmlContent) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed"
        style={{ width: compact ? '100%' : A4_WIDTH, height: compact ? 300 : A4_HEIGHT }}
      >
        <p className="text-muted-foreground">Enter content to see preview</p>
      </div>
    )
  }

  const containerStyle = compact ? {
    width: '100%',
    maxHeight: '400px',
    overflow: 'auto'
  } : {
    width: A4_WIDTH,
    minHeight: A4_HEIGHT
  }

  return (
    <div className="space-y-4">
      {overflow && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">Content may exceed {maxPages} pages. Please reduce content.</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Rendering: {isBlockData ? 'Structured Template' : 'Markdown'}</span>
        {!overflow && <Check className="w-4 h-4 text-green-600" />}
      </div>
      
      <div style={containerStyle}>
        <div 
          className="bg-white border rounded-lg shadow-md"
          style={{ 
            padding: compact ? '16px' : '40px',
            minHeight: compact ? '280px' : A4_HEIGHT 
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  )
}
