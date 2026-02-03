'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Maximize2, FileText, Plus, Trash2 } from 'lucide-react'
import { FullScreenDocumentEditor } from './FullScreenDocumentEditor'
import TemplateGallery from './TemplateGallery'
import { profileToBlocks } from '@/lib/blockConverters'

export function CompactDocumentEditor({ job, documentType, token, onUpdate, userProfile }) {
  const [fullScreen, setFullScreen] = useState(false)
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const payload = documentType === 'resume' 
        ? { [documentType]: { blocks: null, template: 'harvard' } }
        : { [documentType]: { content: '', refinedContent: '' } }
      
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      onUpdate(data.job)
      setShowDeleteDialog(false)
      toast.success(`${config.label} deleted`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setDeleting(false)
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
        <div className="flex gap-2">
          {hasContent && (
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)} className="text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button onClick={() => setFullScreen(true)} className="gap-2">
            <Maximize2 className="w-4 h-4" />
            Open Full Editor
          </Button>
        </div>
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
    
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {config.label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete your {config.label.toLowerCase()} for this job. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
            {deleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
