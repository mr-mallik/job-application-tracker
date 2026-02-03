'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { A4_WIDTH, A4_HEIGHT } from './constants'
import { renderTemplate } from '@/lib/templateRenderer'

/**
 * ResumePDFPreview - Renders resume previews using structured block data with HTML templates
 * 
 * Props:
 * - content: Object with { blocks, template } or legacy data
 * - userProfile: User profile data  
 * - maxPages: Maximum allowed pages (default: 2)
 * - compact: Compact mode for smaller previews
 */
export function ResumePDFPreview({ content, userProfile, maxPages = 2, compact = false }) {
  const [htmlContent, setHtmlContent] = useState('')
  const [overflow, setOverflow] = useState(false)
  
  // Extract blocks and template from content
  const getBlocksAndTemplate = () => {
    if (!content) return { blocks: null, template: 'harvard' }
    
    // New format: { blocks, template }
    if (content.blocks && content.template) {
      return { blocks: content.blocks, template: content.template }
    }
    
    // Legacy: structured block data directly
    if (typeof content === 'object' && (content.experiences || content.education || content.skills)) {
      return { blocks: content, template: 'harvard' }
    }
    
    // Fallback: empty
    return { blocks: null, template: 'harvard' }
  }

  useEffect(() => {
    const { blocks, template } = getBlocksAndTemplate()
    
    if (blocks) {
      renderFromBlockData(blocks, template)
    } else {
      setHtmlContent('')
      setOverflow(false)
    }
  }, [content])

  const renderFromBlockData = (blockData, templateId) => {
    try {
      // Use shared template renderer
      const html = renderTemplate(templateId, blockData)
      setHtmlContent(html)
      
      // Simple page count estimation (can be improved with actual rendering)
      const estimatedPages = estimatePages(blockData)
      setOverflow(estimatedPages > maxPages)
    } catch (error) {
      console.error('Error rendering block data:', error)
      setHtmlContent('<div class="error">Failed to render resume</div>')
    }
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
        <span>Rendering: {content?.blocks ? 'Structured Template' : 'Legacy'}</span>
        {!overflow && <Check className="w-4 h-4 text-green-600" />}
      </div>
      
      <div style={containerStyle}>
        <div 
          className="bg-white border rounded-lg shadow-md"
          style={{ 
            // padding: compact ? '16px' : '40px',
            minHeight: compact ? '280px' : A4_HEIGHT 
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  )
}
