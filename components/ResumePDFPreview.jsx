'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { A4_WIDTH, A4_HEIGHT } from './constants'

export function ResumePDFPreview({ content, userProfile, maxPages = 2, compact = false }) {
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
        <h1 className="text-xl font-bold uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>{header.name}</h1>
        {header.designation && <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{header.designation}</p>}
        <div className="flex items-center justify-center gap-3 mt-2 text-xs text-blue-600 flex-wrap" style={{ fontFamily: 'Inter, sans-serif' }}>
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
      <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-300 pb-1 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{section.title}</h2>
      <div className="text-xs leading-relaxed space-y-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>
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
    fontSize: '9px',
    fontFamily: 'Inter, sans-serif'
  } : {
    width: A4_WIDTH,
    minHeight: A4_HEIGHT,
    padding: '40px',
    fontSize: '11px',
    fontFamily: 'Inter, sans-serif'
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
