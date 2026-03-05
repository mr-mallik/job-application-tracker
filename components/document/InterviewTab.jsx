'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sparkles,
  Download,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  RefreshCw,
  MessageSquare,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import InterviewQuestionsTemplate from '@/components/pdf-templates/InterviewQuestionsTemplate';

// PDF components must be loaded client-side only
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const QUESTION_COUNTS = [5, 10, 15, 20];

const LEVEL_LABELS = { fresh: 'Entry Level', mid: 'Mid Level', senior: 'Senior Level' };
const TYPE_LABELS = { technical: 'Technical', behavioural: 'Behavioural', mixed: 'Mixed' };

export function InterviewTab({ job, token }) {
  const [level, setLevel] = useState('mid');
  const [type, setType] = useState('technical');
  const [count, setCount] = useState(10);

  const [questions, setQuestions] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);

  // Append/replace dialog state
  const [showModeDialog, setShowModeDialog] = useState(false);
  const [pendingParams, setPendingParams] = useState(null);

  // Load saved questions on mount
  const loadSaved = useCallback(async () => {
    if (!job?.id) return;
    try {
      const res = await fetch(`/api/jobs/interview-questions?jobId=${job.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setQuestions(data.questions || []);
    } catch {
      // silently ignore â€” first load failure isn't critical
    } finally {
      setLoadingInitial(false);
    }
  }, [job?.id, token]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // Called when the user clicks "Generate" â€” gate through append/replace dialog if needed
  const handleGenerateClick = () => {
    const params = { level, type, count };
    if (questions.length > 0) {
      setPendingParams(params);
      setShowModeDialog(true);
    } else {
      runGenerate(params, 'replace');
    }
  };

  const runGenerate = async (params, mode) => {
    setShowModeDialog(false);
    setGenerating(true);
    try {
      const res = await fetch('/api/jobs/interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: job.id, ...params, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');

      setQuestions(data.questions || []);
      // Expand the first new question when appending
      if (mode === 'append' && data.newCount > 0) {
        setOpenIndex((data.questions || []).length - data.newCount);
      } else {
        setOpenIndex(0);
      }

      const verb = mode === 'append' ? 'Appended' : 'Generated';
      toast.success(`${verb} ${data.newCount} question${data.newCount !== 1 ? 's' : ''}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const pdfFileName = `Interview_${(job?.company || 'Prep').replace(/\s+/g, '_')}_${(job?.title || '').replace(/\s+/g, '_')}.pdf`;

  return (
    <div className="space-y-5">
      {/* Configuration card */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Generate Interview Questions
        </h4>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fresh">Fresh / Entry</SelectItem>
                <SelectItem value="mid">Mid Level</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioural">Behavioural</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Questions</Label>
            <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_COUNTS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            onClick={handleGenerateClick}
            disabled={generating || loadingInitial}
            className="flex-1"
            size="sm"
          >
            {generating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                Generate {count} Questions
              </>
            )}
          </Button>

          {questions.length > 0 && (
            <PDFDownloadLink
              document={
                <InterviewQuestionsTemplate
                  questions={questions}
                  jobTitle={job?.title}
                  company={job?.company}
                  level={level}
                  type={type}
                />
              }
              fileName={pdfFileName}
            >
              {({ loading: pdfLoading }) => (
                <Button variant="outline" size="sm" disabled={pdfLoading}>
                  {pdfLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 mr-2" />
                      PDF
                    </>
                  )}
                </Button>
              )}
            </PDFDownloadLink>
          )}
        </div>
      </div>

      {/* Skeleton while loading saved questions */}
      {loadingInitial && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Generating skeleton */}
      {!loadingInitial && generating && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 animate-pulse space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
            </div>
          ))}
          <p className="text-xs text-center text-muted-foreground">
            AI is crafting {count} tailored questions...
          </p>
        </div>
      )}

      {/* Questions list */}
      {!loadingInitial && !generating && questions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {questions.length} saved question{questions.length !== 1 ? 's' : ''}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={() => setOpenIndex(openIndex === null ? 0 : null)}
            >
              {openIndex !== null ? 'Collapse all' : 'Expand all'}
            </Button>
          </div>

          {questions.map((q, i) => (
            <Collapsible
              key={q.id || i}
              open={openIndex === i}
              onOpenChange={(open) => setOpenIndex(open ? i : null)}
            >
              <CollapsibleTrigger asChild>
                <button className="w-full text-left rounded-lg border bg-background hover:bg-muted/40 transition-colors p-3.5 flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 min-w-[28px] text-center">
                    Q{i + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium leading-snug">{q.question}</span>
                  <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                    {q.level && (
                      <span className="text-[10px] text-muted-foreground hidden sm:inline">
                        {LEVEL_LABELS[q.level] || q.level}
                      </span>
                    )}
                    {q.type && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 hidden sm:flex">
                        {TYPE_LABELS[q.type] || q.type}
                      </Badge>
                    )}
                    {openIndex === i ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="border border-t-0 rounded-b-lg bg-muted/20 px-4 py-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      Model Answer
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {q.answer}
                    </p>
                  </div>

                  {q.tip && (
                    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
                          Interviewer is assessing
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                          {q.tip}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loadingInitial && !generating && questions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No questions yet</p>
          <p className="text-xs mt-1">Configure your preferences above and click Generate</p>
        </div>
      )}

      {/* Append / Replace dialog */}
      <Dialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add or replace questions?</DialogTitle>
            <DialogDescription>
              You already have <strong>{questions.length}</strong> saved question
              {questions.length !== 1 ? 's' : ''} for this job. What would you like to do with the
              new <strong>{pendingParams?.count}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => runGenerate(pendingParams, 'append')}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 p-4 text-left transition-colors"
            >
              <PlusCircle className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm font-semibold">Append</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add {pendingParams?.count} unique new questions to the existing list
                </p>
              </div>
            </button>

            <button
              onClick={() => runGenerate(pendingParams, 'replace')}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-border hover:border-destructive hover:bg-destructive/5 p-4 text-left transition-colors"
            >
              <RotateCcw className="w-6 h-6 text-destructive" />
              <div>
                <p className="text-sm font-semibold">Replace</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clear all {questions.length} existing and start fresh
                </p>
              </div>
            </button>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setShowModeDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
