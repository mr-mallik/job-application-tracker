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

export default function AIRefineDialog({ documentType, blocks, onApply }) {
  const [open, setOpen] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [preferences, setPreferences] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Please paste a job description.');
      return;
    }
    setError('');
    setGenerating(true);

    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      const userProfile = userData ? JSON.parse(userData).profile : null;

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
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Label htmlFor="jd">Job Description *</Label>
            <Textarea
              id="jd"
              placeholder="Paste the full job description here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="resize-none text-sm"
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
          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {generating ? 'Generating…' : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
