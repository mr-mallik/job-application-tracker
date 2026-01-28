'use client'

import { useState, useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { A4_WIDTH, A4_HEIGHT } from './constants'

export function DocumentPDFPreview({ content, maxPages = 2, documentType = 'coverLetter', compact = false }) {
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
    padding: '16px',
    fontFamily: 'Inter, sans-serif'
  } : {
    width: A4_WIDTH,
    minHeight: A4_HEIGHT,
    padding: '40px',
    fontFamily: 'Inter, sans-serif'
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
            style={{ ...pageStyle }}
          >
            <div className="text-xs text-gray-400 text-right mb-3">Page {pageIndex + 1} of {pages.length}</div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed space-y-2`}>
              {pageLines.map((line, lineIndex) => {
                const isHeading = line.startsWith('#')
                const isSubheading = line.startsWith('**') || (line.includes('|') && !line.startsWith('-'))
                
                if (isHeading) {
                  return <p key={lineIndex} className="font-bold text-base mt-3">{line.replace(/^#+\s*/, '')}</p>
                } else if (isSubheading) {
                  return <p key={lineIndex} className="font-semibold mt-2">{line.replace(/\*\*/g, '')}</p>
                } else {
                  return <p key={lineIndex}>{line}</p>
                }
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
