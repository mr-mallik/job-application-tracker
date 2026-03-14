'use client';

/**
 * FloatingDocToolbar — vertical icon-bar rendered to the left of the A4 canvas.
 *
 * Sections:
 *   1. Undo / Redo
 *   2. Add block (popover with block-type choices)
 *   3. Selected-block controls (move, AI refine, delete) — visible only when a block is selected
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Undo2,
  Redo2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Type,
  List,
  Minus,
  AlignLeft,
  Layers,
  LayoutTemplate,
  Contact,
  Target,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BLOCK_TYPES } from '@/lib/blockSchema';

// ─── Keyword analysis panel ────────────────────────────────────────────────

function KeywordPanel({ jobId, resumeText }) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState(null); // { keywords, score, summary, analysedAt }
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const syncTimerRef = useRef(null);
  const analysisRef = useRef(null);
  analysisRef.current = analysis;

  const runAnalysis = useCallback(
    async (force = false) => {
      if (!jobId) return;
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/documents/analyze-keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ jobId, resumeText, force }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || 'Analysis failed');
        }
        const data = await res.json();
        setAnalysis(data.analysis);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [jobId, resumeText]
  );

  // Real-time keyword presence checking with instant UI feedback
  // Updates UI immediately, debounces DB save to prevent server spam
  useEffect(() => {
    if (!analysisRef.current?.keywords?.length || !jobId) return;

    // Immediate UI update (no delay for responsiveness)
    const textLower = resumeText.toLowerCase();
    const updated = analysisRef.current.keywords.map((kw) => ({
      ...kw,
      present: textLower.includes(kw.keyword.toLowerCase()),
    }));
    const presentCount = updated.filter((k) => k.present).length;
    const newScore = Math.round((presentCount / updated.length) * 100);
    const updatedAnalysis = {
      ...analysisRef.current,
      keywords: updated,
      keywordsPresent: updated.filter((k) => k.present).map((k) => k.keyword),
      keywordsMissing: updated.filter((k) => !k.present).map((k) => k.keyword),
      score: newScore,
      updatedAt: new Date().toISOString(),
    };

    // Update UI instantly for responsive feedback
    setAnalysis(updatedAnalysis);

    // Debounce DB save to prevent server overload
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      setSyncing(true);
      const token = localStorage.getItem('token');
      fetch('/api/documents/update-keyword-presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId, keywordAnalysis: updatedAnalysis }),
      })
        .catch(() => {})
        .finally(() => setSyncing(false));
    }, 1500);

    return () => clearTimeout(syncTimerRef.current);
  }, [resumeText, jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = (next) => {
    setOpen(next);
  };

  const score = analysis?.score ?? null;
  const scoreColor =
    score === null
      ? 'text-muted-foreground'
      : score >= 75
        ? 'text-green-600'
        : score >= 50
          ? 'text-amber-600'
          : 'text-red-600';

  const scoreBg =
    score === null
      ? 'bg-muted'
      : score >= 75
        ? 'bg-green-50 border-green-200'
        : score >= 50
          ? 'bg-amber-50 border-amber-200'
          : 'bg-red-50 border-red-200';

  if (!jobId) return null;

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <Tip label="Keyword coverage analysis">
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 relative">
            <Target className="w-5 h-5" />
            {score !== null && (
              <span
                className={cn(
                  'absolute -top-0.5 -right-2 text-[10px] font-bold leading-none p-1 rounded',
                  score >= 75
                    ? 'bg-green-500 text-white'
                    : score >= 50
                      ? 'bg-amber-500 text-white'
                      : 'bg-red-500 text-white'
                )}
              >
                {score}%
              </span>
            )}
          </Button>
        </PopoverTrigger>
      </Tip>

      <PopoverContent side="right" align="start" className="p-0 w-80 overflow-hidden">
        {/* Header */}
        <div className={cn('flex items-center justify-between px-4 py-2.5 border-b', scoreBg)}>
          <div className="flex items-center gap-2">
            <Target className={cn('w-4 h-4', scoreColor)} />
            <span className={cn('text-sm font-semibold', scoreColor)}>Keyword Coverage</span>
          </div>
          <div className="flex items-center gap-2">
            {syncing && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Syncing
              </span>
            )}
            {score !== null && (
              <span className={cn('text-base font-bold', scoreColor)}>{score}%</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={loading || syncing}
              title="Re-analyse"
              onClick={() => runAnalysis(true)}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 max-h-96 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 py-5 justify-center text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analysing keywords…
            </div>
          )}

          {!loading && !analysis && !error && (
            <div className="flex flex-col items-center gap-3 py-5">
              <Target className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center">
                Click below to analyse keyword coverage against the job description.
              </p>
              <Button size="sm" onClick={() => runAnalysis(false)}>
                <Target className="w-4 h-4 mr-1.5" />
                Analyse Keywords
              </Button>
            </div>
          )}

          {error && (
            <div className="flex flex-col gap-2 py-2">
              <p className="text-sm text-destructive">{error}</p>
              <Button size="sm" variant="outline" onClick={() => runAnalysis(false)}>
                Retry
              </Button>
            </div>
          )}

          {analysis && !loading && (
            <>
              {analysis.summary && (
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {analysis.summary}
                </p>
              )}

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full mb-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  )}
                  style={{ width: `${score}%` }}
                />
              </div>

              {/* Keyword chips */}
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex text-xs px-2 py-0.5 rounded border font-medium transition-all',
                      kw.present
                        ? 'line-through text-muted-foreground bg-muted border-transparent'
                        : 'text-foreground bg-background border-border'
                    )}
                    title={kw.present ? 'Found in resume' : 'Missing from resume'}
                  >
                    {kw.keyword}
                  </span>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 mt-3 pt-2.5 border-t">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-3 h-px bg-muted-foreground" />
                  Covered
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm border border-border" />
                  Missing
                </span>
                {analysis.analysedAt && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(analysis.analysedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Block type palette ────────────────────────────────────────────────────

const ALL_BLOCK_OPTIONS = [
  { type: BLOCK_TYPES.DOC_HEADER, label: 'Header (Name)', icon: Contact, resumeOnly: true },
  { type: BLOCK_TYPES.TEXT, label: 'Paragraph', icon: AlignLeft, resumeOnly: false },
  { type: BLOCK_TYPES.BULLET, label: 'Bullet', icon: List, resumeOnly: false },
  { type: BLOCK_TYPES.SUBHEADING, label: 'Subheading', icon: Type, resumeOnly: false },
  { type: BLOCK_TYPES.SKILL_GROUP, label: 'Skill Group', icon: Layers, resumeOnly: true },
  { type: BLOCK_TYPES.SPACER, label: 'Spacer', icon: Minus, resumeOnly: false },
  { type: BLOCK_TYPES.SECTION_TITLE, label: 'Section', icon: LayoutTemplate, resumeOnly: true },
];

// ─── Tooltip wrapper ────────────────────────────────────────────────────────

function Tip({ children, label }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" className="text-sm">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Divider ────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-9 h-px bg-border my-1 shrink-0" />;
}

// ─── Main component ─────────────────────────────────────────────────────────

/**
 * Props:
 *   selectedBlock      Block | null   — currently selected block object
 *   selectedBlockIdx   number         — index in flat blocks array (-1 if none)
 *   totalBlocks        number
 *   documentType       string
 *   canUndo            bool
 *   canRedo            bool
 *   onUndo             () => void
 *   onRedo             () => void
 *   onAddBlock         (type: string) => void
 *   onDeleteSelected   () => void
 *   onMoveUp           () => void
 *   onMoveDown         () => void
 *   onAIRefine         (instructions: string) => void
 *   isRefining         bool
 *   jobId              string | null
 *   resumeText         string
 */
export default function FloatingDocToolbar({
  selectedBlock,
  selectedBlockIdx,
  totalBlocks,
  documentType,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onAddBlock,
  onDeleteSelected,
  onMoveUp,
  onMoveDown,
  onAIRefine,
  isRefining,
  jobId,
  resumeText,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [instructions, setInstructions] = useState('');

  const hasSelection = !!selectedBlock;
  const isResume = documentType === 'resume';

  const blockOptions = ALL_BLOCK_OPTIONS.filter((opt) => !opt.resumeOnly || isResume);

  return (
    <div
      className="flex flex-col items-center gap-1 py-3 px-1.5 border-r bg-background shrink-0 overflow-y-auto overflow-x-visible"
      style={{ width: 60 }}
    >
      {/* ── Undo / Redo ─────────────────────────────────────────────────── */}
      <Tip label="Undo (Ctrl+Z)">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 className="w-5 h-5" />
        </Button>
      </Tip>
      <Tip label="Redo (Ctrl+Y)">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 className="w-5 h-5" />
        </Button>
      </Tip>

      <Divider />

      {/* ── Keyword coverage ────────────────────────────────────────────── */}
      {isResume && <KeywordPanel jobId={jobId} resumeText={resumeText} />}

      {/* ── Add block ───────────────────────────────────────────────────── */}
      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <Tip label={hasSelection ? 'Add block after selected' : 'Add block at end'}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 text-primary hover:text-primary"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </PopoverTrigger>
        </Tip>
        <PopoverContent side="right" align="start" className="p-2 w-52">
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
            {hasSelection ? 'Insert after selected block' : 'Append to document'}
          </p>
          <div className="flex flex-col gap-0.5">
            {blockOptions.map((opt) => (
              <button
                key={opt.type}
                type="button"
                onClick={() => {
                  onAddBlock(opt.type);
                  setAddOpen(false);
                }}
                className="flex items-center gap-2.5 px-2.5 py-2 text-sm rounded hover:bg-muted text-left w-full transition-colors"
              >
                <opt.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                {opt.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* ── Selected-block controls ──────────────────────────────────────── */}
      {hasSelection && (
        <>
          <Divider />

          {/* Move up */}
          <Tip label="Move block up">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={selectedBlockIdx <= 0}
              onClick={onMoveUp}
            >
              <ChevronUp className="w-5 h-5" />
            </Button>
          </Tip>

          {/* Move down */}
          <Tip label="Move block down">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              disabled={selectedBlockIdx >= totalBlocks - 1}
              onClick={onMoveDown}
            >
              <ChevronDown className="w-5 h-5" />
            </Button>
          </Tip>

          {/* AI refine */}
          <Popover open={refineOpen} onOpenChange={setRefineOpen}>
            <Tip label="AI refine selected block">
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-10 w-10 shrink-0', isRefining && 'animate-pulse text-primary')}
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent side="right" align="start" className="p-4 w-72">
              <p className="text-sm font-semibold mb-1">AI Refine Block</p>
              <p className="text-sm text-muted-foreground mb-3">
                Improve the selected block&apos;s text with AI.
              </p>
              <Textarea
                placeholder="Optional: 'Make more concise', 'Use stronger verbs', …"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="text-sm min-h-[72px] mb-3"
              />
              <Button
                size="sm"
                className="w-full"
                disabled={isRefining}
                onClick={() => {
                  onAIRefine(instructions);
                  setRefineOpen(false);
                  setInstructions('');
                }}
              >
                {isRefining ? 'Refining…' : 'Refine'}
              </Button>
            </PopoverContent>
          </Popover>

          {/* Delete */}
          <Tip label="Delete selected block">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 hover:text-destructive"
              onClick={onDeleteSelected}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </Tip>
        </>
      )}
    </div>
  );
}
