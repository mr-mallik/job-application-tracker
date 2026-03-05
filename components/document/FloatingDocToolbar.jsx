'use client';

/**
 * FloatingDocToolbar — vertical icon-bar rendered to the left of the A4 canvas.
 *
 * Sections:
 *   1. Undo / Redo
 *   2. Add block (popover with block-type choices)
 *   3. Selected-block controls (move, AI refine, delete) — visible only when a block is selected
 */

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { BLOCK_TYPES } from '@/lib/blockSchema';

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
        <TooltipContent side="right" className="text-xs">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Divider ────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-7 h-px bg-border my-1 shrink-0" />;
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
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [instructions, setInstructions] = useState('');

  const hasSelection = !!selectedBlock;
  const isResume = documentType === 'resume';

  const blockOptions = ALL_BLOCK_OPTIONS.filter((opt) => !opt.resumeOnly || isResume);

  return (
    <div
      className="flex flex-col items-center gap-0.5 py-3 px-1 border-r bg-background shrink-0 overflow-y-auto overflow-x-visible"
      style={{ width: 48 }}
    >
      {/* ── Undo / Redo ─────────────────────────────────────────────────── */}
      <Tip label="Undo (Ctrl+Z)">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 className="w-4 h-4" />
        </Button>
      </Tip>
      <Tip label="Redo (Ctrl+Y)">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 className="w-4 h-4" />
        </Button>
      </Tip>

      <Divider />

      {/* ── Add block ───────────────────────────────────────────────────── */}
      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <Tip label={hasSelection ? 'Add block after selected' : 'Add block at end'}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-primary hover:text-primary"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
        </Tip>
        <PopoverContent side="right" align="start" className="p-2 w-44">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
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
                className="flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted text-left w-full transition-colors"
              >
                <opt.icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
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
              className="h-8 w-8 shrink-0"
              disabled={selectedBlockIdx <= 0}
              onClick={onMoveUp}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </Tip>

          {/* Move down */}
          <Tip label="Move block down">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={selectedBlockIdx >= totalBlocks - 1}
              onClick={onMoveDown}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </Tip>

          {/* AI refine */}
          <Popover open={refineOpen} onOpenChange={setRefineOpen}>
            <Tip label="AI refine selected block">
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn('h-8 w-8 shrink-0', isRefining && 'animate-pulse text-primary')}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent side="right" align="start" className="p-3 w-64">
              <p className="text-xs font-semibold mb-1">AI Refine Block</p>
              <p className="text-xs text-muted-foreground mb-2">
                Improve the selected block&apos;s text with AI.
              </p>
              <Textarea
                placeholder="Optional: 'Make more concise', 'Use stronger verbs', …"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="text-xs min-h-[56px] mb-2"
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
              className="h-8 w-8 shrink-0 hover:text-destructive"
              onClick={onDeleteSelected}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Tip>
        </>
      )}
    </div>
  );
}
