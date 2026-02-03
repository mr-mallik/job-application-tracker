'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Maximize2, FileText, Plus } from 'lucide-react'
import { FullScreenDocumentEditor } from './FullScreenDocumentEditor'
import TemplateGallery from './TemplateGallery'
import { profileToBlocks } from '@/lib/blockConverters'

export function CompactDocumentEditor({ job, documentType, token, onUpdate, userProfile }) {
  const [fullScreen, setFullScreen] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  
  const docConfig = {
    resume: { label: 'Resume', maxPages: 2 },
    coverLetter: { label: 'Cover Letter', maxPages: 2 },
    supportingStatement: { label: 'Supporting Statement', maxPages: 3 }
  }
  const config = docConfig[documentType]
  
  // Check if resume has blocks (new system) or content (legacy)
  const hasContent = documentType === 'resume' 
    ? (job[documentType]?.blocks || job[documentType]?.content || job[documentType]?.refinedContent)
    : (job[documentType]?.content || job[documentType]?.refinedContent)

  const handleTemplateSelect = (templateId, profile) => {
    // Convert profile to blocks and open editor
    const blocks = profileToBlocks(profile)
    
    // Update job with new resume blocks and template
    const updatedJob = {
      ...job,
      resume: {
        blocks,
        template: templateId
      }
    }
    
    onUpdate(updatedJob)
    setShowTemplateGallery(false)
    setFullScreen(true)
  }

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
    
    // For resume with blocks, show summary
    if (documentType === 'resume' && doc.blocks) {
      return `${doc.blocks.name || ''} - ${doc.blocks.subtitle || ''}\n${doc.blocks.summary || ''}`.substring(0, 500)
    }
    
    // Legacy: check blockData or content
    if (documentType === 'resume' && doc.blockData) {
      return `${doc.blockData.name || ''} - ${doc.blockData.subtitle || ''}\n${doc.blockData.summary || ''}`.substring(0, 500)
    }
    
    return (doc.refinedContent || doc.content || '').substring(0, 500)
  }

  const handleCreateClick = () => {
    if (documentType === 'resume') {
      setShowTemplateGallery(true)
    } else {
      setFullScreen(true)
    }
  }

  return (
    <>
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
            <Button variant="outline" className="mt-3" onClick={handleCreateClick}>
              <Plus className="w-4 h-4 mr-1" />
              {documentType === 'resume' ? 'Add Resume' : `Create ${config.label}`}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>

    {documentType === 'resume' && (
      <TemplateGallery
        open={showTemplateGallery}
        onOpenChange={setShowTemplateGallery}
        onSelectTemplate={handleTemplateSelect}
        userProfile={userProfile}
      />
    )}
  </>
  )
}
