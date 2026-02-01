'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Maximize2, FileText, Plus } from 'lucide-react'
import { FullScreenDocumentEditor } from './FullScreenDocumentEditor'

export function CompactDocumentEditor({ job, documentType, token, onUpdate, userProfile }) {
  const [fullScreen, setFullScreen] = useState(false)
  const docConfig = {
    resume: { label: 'Resume', maxPages: 2 },
    coverLetter: { label: 'Cover Letter', maxPages: 2 },
    supportingStatement: { label: 'Supporting Statement', maxPages: 3 }
  }
  const config = docConfig[documentType]
  
  const hasContent = job[documentType]?.content || job[documentType]?.refinedContent || job[documentType]?.blockData

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

  const getPreviewText = () => {
    const doc = job[documentType]
    if (!doc) return ''
    
    // For resume with block data, show summary
    if (documentType === 'resume' && doc.blockData) {
      return `${doc.blockData.name || ''} - ${doc.blockData.subtitle || ''}\n${doc.blockData.summary || ''}`.substring(0, 500)
    }
    
    return (doc.refinedContent || doc.content || '').substring(0, 500)
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
              {getPreviewText()}...
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
