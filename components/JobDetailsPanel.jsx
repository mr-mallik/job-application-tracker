'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, DollarSign, Clock, ExternalLink, Edit, Trash2, X, AlertCircle } from 'lucide-react'
import { JobForm } from './JobForm'
import { CompactDocumentEditor } from './CompactDocumentEditor'

export function JobDetailsPanel({ job, token, onUpdate, onClose, onDelete, userProfile }) {
  const [activeTab, setActiveTab] = useState('details')
  const [editing, setEditing] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionFeedback, setRejectionFeedback] = useState(job.rejectionFeedback || '')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'rejected' && job.status !== 'rejected') { setShowRejectDialog(true); return }
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(data.job)
      toast.success('Updated!')
    } catch (error) { toast.error(error.message) } finally { setUpdatingStatus(false) }
  }

  const handleRejectWithFeedback = async () => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: 'rejected', rejectionFeedback }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onUpdate(data.job)
      setShowRejectDialog(false)
      toast.success('Marked rejected')
    } catch (error) { toast.error(error.message) } finally { setUpdatingStatus(false) }
  }

  if (editing) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-3 border-b"><h2 className="font-semibold">Edit Job</h2><Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="w-4 h-4" /></Button></div>
        <ScrollArea className="flex-1 p-3"><JobForm job={job} token={token} userProfile={userProfile} onSave={(updated) => { onUpdate(updated); setEditing(false); }} onCancel={() => setEditing(false)} /></ScrollArea>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div><h2 className="font-semibold">{job.title}</h2><p className="text-sm text-muted-foreground">{job.company}</p></div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="w-4 h-4 text-red-500" /></Button>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
      </div>
      
      <div className="p-3 border-b">
        <div className="flex flex-wrap gap-2 mb-2">
          {job.location && <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{job.location}</Badge>}
          {job.salary && <Badge variant="outline"><DollarSign className="w-3 h-3 mr-1" />{job.salary}</Badge>}
          {job.closingDate && <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Closes: {job.closingDate}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Select value={job.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
            <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="saved">Saved</SelectItem><SelectItem value="applied">Applied</SelectItem><SelectItem value="interview">Interview</SelectItem><SelectItem value="offer">Offer</SelectItem><SelectItem value="rejected">Rejected</SelectItem><SelectItem value="withdrawn">Withdrawn</SelectItem></SelectContent>
          </Select>
          {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm"><ExternalLink className="w-3 h-3 mr-1" />View</Button></a>}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 h-8">
          <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
          <TabsTrigger value="resume" className="text-xs">Resume</TabsTrigger>
          <TabsTrigger value="coverLetter" className="text-xs">Cover Letter</TabsTrigger>
          <TabsTrigger value="supportingStatement" className="text-xs">Statement</TabsTrigger>
        </TabsList>
        
        <ScrollArea className="flex-1">
          <div className="p-3">
            <TabsContent value="details" className="mt-0 space-y-3">
              {job.description && <div><h4 className="font-medium text-sm mb-1">Description</h4><p className="text-xs whitespace-pre-wrap">{job.description}</p></div>}
              {job.requirements && <div><h4 className="font-medium text-sm mb-1">Requirements</h4><p className="text-xs whitespace-pre-wrap">{job.requirements}</p></div>}
              {job.status === 'rejected' && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1 text-red-800"><AlertCircle className="w-3 h-3 inline mr-1" />Rejection Feedback</h4>
                  <p className="text-xs text-red-700">{job.rejectionFeedback || 'No feedback'}</p>
                  <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={() => setShowRejectDialog(true)}>Edit</Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="resume" className="mt-0"><CompactDocumentEditor job={job} documentType="resume" token={token} onUpdate={onUpdate} userProfile={userProfile} /></TabsContent>
            <TabsContent value="coverLetter" className="mt-0"><CompactDocumentEditor job={job} documentType="coverLetter" token={token} onUpdate={onUpdate} userProfile={userProfile} /></TabsContent>
            <TabsContent value="supportingStatement" className="mt-0"><CompactDocumentEditor job={job} documentType="supportingStatement" token={token} onUpdate={onUpdate} userProfile={userProfile} /></TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
      
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent><DialogHeader><DialogTitle>Rejection Feedback</DialogTitle></DialogHeader><Textarea placeholder="Feedback..." className="min-h-[100px]" value={rejectionFeedback} onChange={(e) => setRejectionFeedback(e.target.value)} /><DialogFooter><Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button><Button onClick={handleRejectWithFeedback} disabled={updatingStatus}>{updatingStatus ? 'Saving...' : 'Save'}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}
