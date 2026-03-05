'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Building2,
  Calendar,
  Loader2,
  FileText,
  FileCheck,
  Sparkles,
  Files,
} from 'lucide-react';
import { JobForm } from './JobForm';
import { JobDocumentsTab } from '@/components/document/JobDocumentsTab';
import { formatDateShort, isPastDate } from '@/lib/dateUtils';

export function JobDetailsPanel({ job, token, onUpdate, onClose, onDelete, userProfile }) {
  const [activeTab, setActiveTab] = useState('details');
  const [editing, setEditing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionFeedback, setRejectionFeedback] = useState(job.rejectionFeedback || '');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'rejected' && job.status !== 'rejected') {
      setShowRejectDialog(true);
      return;
    }
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data.job);
      toast.success('Status updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleRejectWithFeedback = async () => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'rejected', rejectionFeedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate(data.job);
      setShowRejectDialog(false);
      toast.success('Job marked as rejected');
    } catch (error) {
      toast.error(error.message || 'Failed to save feedback');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (editing) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-muted/50 shrink-0">
          <h2 className="font-semibold text-lg">Edit Job Application</h2>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <JobForm
            job={job}
            token={token}
            userProfile={userProfile}
            onSave={(updated) => {
              onUpdate(updated);
              setEditing(false);
              toast.success('Job updated!');
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10 shrink-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-xl mb-1 truncate">{job.title}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium truncate">{job.company}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              className="hover:bg-primary/10"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-muted">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Info Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {job.location && (
            <Badge variant="outline" className="bg-background/50">
              <MapPin className="w-3 h-3 mr-1" />
              {job.location}
            </Badge>
          )}
          {job.salary && (
            <Badge variant="outline" className="bg-background/50">
              <DollarSign className="w-3 h-3 mr-1" />
              {job.salary}
            </Badge>
          )}
          {job.closingDate && (
            <Badge
              variant="outline"
              className={`bg-background/50 ${isPastDate(job.closingDate) ? 'line-through text-muted-foreground' : ''}`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {isPastDate(job.closingDate) ? 'Closed' : 'Closes'}:{' '}
              {formatDateShort(job.closingDate)}
            </Badge>
          )}
          {job.appliedDate && (
            <Badge variant="outline" className="bg-background/50">
              <Calendar className="w-3 h-3 mr-1" />
              Applied: {formatDateShort(job.appliedDate)}
            </Badge>
          )}
        </div>

        {/* Status and Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Label className="text-xs font-medium">Status:</Label>
          <Select value={job.status} onValueChange={handleStatusChange} disabled={updatingStatus}>
            <SelectTrigger className="w-[140px] h-9">
              {updatingStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saved">💾 Saved</SelectItem>
              <SelectItem value="applied">📤 Applied</SelectItem>
              <SelectItem value="interview">🎯 Interview</SelectItem>
              <SelectItem value="offer">🎉 Offer</SelectItem>
              <SelectItem value="rejected">❌ Rejected</SelectItem>
              <SelectItem value="withdrawn">↩️ Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          {job.url && (
            <a href={job.url} target="_blank" rel="noopener noreferrer" className="ml-auto">
              <Button variant="outline" size="sm" className="shadow-sm">
                <ExternalLink className="w-3 h-3 mr-2" />
                View Posting
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-4 mt-3 w-auto shrink-0">
          <TabsTrigger value="details" className="text-sm gap-2">
            <FileText className="w-3 h-3" />
            Details
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-sm gap-2">
            <Files className="w-3 h-3" />
            Documents
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <TabsContent value="details" className="mt-0 space-y-6">
              {job.description && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Job Description
                  </h4>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                    {job.description}
                  </p>
                </div>
              )}

              {job.requirements && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-primary" />
                      Requirements & Qualifications
                    </h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {job.requirements}
                    </p>
                  </div>
                </>
              )}

              {job.benefits && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Benefits & Perks
                    </h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {job.benefits}
                    </p>
                  </div>
                </>
              )}

              {job.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Personal Notes
                    </h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">
                      {job.notes}
                    </p>
                  </div>
                </>
              )}

              {job.status === 'rejected' && job.rejectionFeedback && (
                <>
                  <Separator />
                  <div className="p-4 bg-destructive/5 border-2 border-destructive/20 rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      Rejection Feedback
                    </h4>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {job.rejectionFeedback}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowRejectDialog(true)}
                    >
                      Edit Feedback
                    </Button>
                  </div>
                </>
              )}

              {!job.description && !job.requirements && !job.benefits && !job.notes && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No job details yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setEditing(true)}
                  >
                    <Edit className="w-3 h-3 mr-2" />
                    Add Details
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <JobDocumentsTab job={job} token={token} />
            </TabsContent>
          </div>
        </div>
      </Tabs>

      {/* Rejection Feedback Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Rejection Feedback
            </DialogTitle>
            <DialogDescription>
              Record any feedback you received or notes about why the application was rejected
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection-feedback">Feedback Details</Label>
            <Textarea
              id="rejection-feedback"
              placeholder="e.g., Position filled internally, qualifications didn't match, etc..."
              className="min-h-[120px] resize-y"
              value={rejectionFeedback}
              onChange={(e) => setRejectionFeedback(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRejectWithFeedback}
              disabled={updatingStatus}
              className="min-w-[100px]"
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Feedback'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
