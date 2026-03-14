'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, RefreshCw } from 'lucide-react';

export default function AIRefineDialog({ documentType, blocks, jobId, onApply }) {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [preferences, setPreferences] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingJob, setLoadingJob] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill job description + requirements when opening, if linked to a job
  const handleOpenChange = async (next) => {
    setOpen(next);
    if (next && jobId && !jobDescription.trim()) {
      setLoadingJob(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const job = data.job;
          const parts = [job.description?.trim(), job.requirements?.trim()].filter(Boolean);
          if (parts.length > 0) setJobDescription(parts.join('\n\n'));
        }
      } catch {
        // silently ignore — user can paste manually
      } finally {
        setLoadingJob(false);
      }
    }
  };

  const handleGenerateClick = () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }
    setError('');
    setConfirmOpen(true);
  };

  const handleGenerate = async () => {
    setConfirmOpen(false);
    setGenerating(true);

    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const userProfile = userData ? JSON.parse(userData).profile : null;
      console.log('User profile sent to AI:', userProfile);

      // Serialize current blocks to markdown for context
      const { blocksToPreview } = await import('@/lib/blockSchema');
      const content = blocksToPreview(blocks, 4000);

      const res = await fetch('/api/documents/refine-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentType,
          content,
          jobDescription: jobDescription.trim(),
          userPreferences: preferences.trim() || undefined,
          userProfile,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'AI generation failed');
      }

      const data = await res.json();
      onApply(data.blocks);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          AI Refine
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" />
            AI-Powered Refinement
          </DialogTitle>
          <DialogDescription>
            Paste the job description below. The AI will tailor your document content to match the
            role — without fabricating any information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="jd">
              Job Description &amp; Requirements *
              {loadingJob && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Loading from job…
                </span>
              )}
            </Label>
            <Textarea
              id="jd"
              placeholder="Paste the full job description and requirements here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="resize-none text-sm"
              disabled={loadingJob}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pref">Additional Instructions (optional)</Label>
            <Textarea
              id="pref"
              placeholder="e.g. Focus on leadership experience. Keep it concise."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateClick}
            disabled={generating || loadingJob}
            className="gap-2"
          >
            {generating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Overwrite Current Content?</DialogTitle>
            <DialogDescription className="pt-2 space-y-2">
              <p className="font-semibold text-destructive">
                ⚠️ All current changes will be lost and overwritten.
              </p>
              <p>
                The AI will generate new content based on the job description. Your existing
                document content will be completely replaced.
              </p>
              <p className="text-sm">
                This action cannot be undone. Make sure you&apos;ve saved any content you want to
                keep.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleGenerate}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Proceed & Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
