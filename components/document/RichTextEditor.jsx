'use client';

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { createEditor, Transforms, Text as SlateText } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Link2,
  Link2Off,
  Sparkles,
  RefreshCw,
  Unlink,
} from 'lucide-react';
import {
  SLATE_ELEM,
  ensureSlate,
  slateToText,
  toggleMark,
  isMarkActive,
  isLinkActive,
  wrapLink,
  unwrapLink,
} from '@/lib/slateUtils';

// ─── Plugin: make links inline ────────────────────────────────────────────

function withLinks(editor) {
  const { isInline } = editor;
  editor.isInline = (element) => (element.type === SLATE_ELEM.LINK ? true : isInline(element));
  return editor;
}

// ─── Leaf renderer (marks: bold, italic, underline) ───────────────────────

function Leaf({ attributes, children, leaf }) {
  let el = children;
  if (leaf.bold) el = <strong>{el}</strong>;
  if (leaf.italic) el = <em>{el}</em>;
  if (leaf.underline) el = <u>{el}</u>;
  return <span {...attributes}>{el}</span>;
}

// ─── Element renderer ─────────────────────────────────────────────────────

function Element({ attributes, children, element }) {
  if (element.type === SLATE_ELEM.LINK) {
    return (
      <a
        {...attributes}
        href={element.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
        onClick={(e) => e.preventDefault()}
      >
        {children}
      </a>
    );
  }
  return <span {...attributes}>{children}</span>;
}

// ─── Toolbar button ───────────────────────────────────────────────────────

function ToolbarButton({ active, onMouseDown, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // don't blur editor
        onMouseDown(e);
      }}
      className={cn(
        'h-6 w-6 flex items-center justify-center rounded text-[11px] transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

// ─── Link popover ─────────────────────────────────────────────────────────

function LinkPopover({ editor, onClose }) {
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleApply = () => {
    if (url.trim()) {
      const href = url.startsWith('http') ? url : `https://${url}`;
      wrapLink(editor, href);
    }
    onClose();
  };

  return (
    <div className="flex items-center gap-1 p-1">
      <Input
        ref={inputRef}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="h-7 text-xs w-44"
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleApply();
          if (e.key === 'Escape') onClose();
        }}
      />
      <Button size="sm" className="h-7 px-2 text-xs" onClick={handleApply}>
        Apply
      </Button>
    </div>
  );
}

// ─── AI Refine for a single block ─────────────────────────────────────────

function AIRefineButton({ value, onChange, jobId }) {
  const [open, setOpen] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRefine = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const currentText = slateToText(value);

      // Optionally fetch job description
      let jobDescription = '';
      if (jobId) {
        const jr = await fetch(`/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (jr.ok) {
          const jd = await jr.json();
          const j = jd.job;
          jobDescription = [j.description, j.requirements].filter(Boolean).join('\n\n');
        }
      }

      const res = await fetch('/api/documents/refine-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: currentText, instructions, jobDescription }),
      });

      if (!res.ok) throw new Error('Refinement failed');
      const data = await res.json();

      if (data.refinedText) {
        // Import slateFromText dynamically to keep this client-only
        const { slateFromText } = await import('@/lib/slateUtils');
        onChange(slateFromText(data.refinedText));
        setOpen(false);
        setInstructions('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Refine this block with AI"
          className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-2" side="top">
        <p className="text-xs font-medium text-muted-foreground">AI Refine this paragraph</p>
        <Input
          placeholder="Instructions (e.g. make more concise)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="h-7 text-xs"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRefine();
          }}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          size="sm"
          className="w-full h-7 text-xs gap-1"
          onClick={handleRefine}
          disabled={loading}
        >
          {loading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          {loading ? 'Refining…' : 'Refine'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main RichTextEditor ──────────────────────────────────────────────────

/**
 * Inline Slate rich-text editor for a single paragraph/bullet block.
 *
 * Props:
 *   value          Slate value (Array<Node>) — use ensureSlate() before passing
 *   onChange       (newSlateValue) => void — called on every change
 *   placeholder    string
 *   className      extra classes on the editable area
 *   jobId          optional — enables per-block AI refine fetching job context
 *   onFocus/onBlur standard handlers
 */
export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type here…',
  className,
  jobId,
  onFocus,
  onBlur,
  style,
}) {
  const editor = useMemo(() => withLinks(withHistory(withReact(createEditor()))), []);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const renderElement = useCallback((props) => <Element {...props} />, []);

  const safeValue = useMemo(() => ensureSlate(value), []);

  // Keyboard shortcuts
  const handleKeyDown = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    switch (event.key) {
      case 'b':
        event.preventDefault();
        toggleMark(editor, 'bold');
        break;
      case 'i':
        event.preventDefault();
        toggleMark(editor, 'italic');
        break;
      case 'u':
        event.preventDefault();
        toggleMark(editor, 'underline');
        break;
    }
  };

  const isBold = isMarkActive(editor, 'bold');
  const isItalic = isMarkActive(editor, 'italic');
  const isUnderline = isMarkActive(editor, 'underline');
  const hasLink = isLinkActive(editor);

  return (
    <div
      className={cn(
        'group relative rounded transition-colors',
        focused ? 'ring-1 ring-primary/40 bg-background' : 'hover:bg-muted/30'
      )}
      style={style}
    >
      <Slate editor={editor} initialValue={safeValue} onChange={onChange}>
        {/* Floating toolbar, visible on focus */}
        {focused && (
          <div className="flex items-center gap-0.5 px-1 py-0.5 border-b bg-muted/60 rounded-t">
            <ToolbarButton
              active={isBold}
              title="Bold (Ctrl+B)"
              onMouseDown={() => toggleMark(editor, 'bold')}
            >
              <Bold className="w-3 h-3" />
            </ToolbarButton>
            <ToolbarButton
              active={isItalic}
              title="Italic (Ctrl+I)"
              onMouseDown={() => toggleMark(editor, 'italic')}
            >
              <Italic className="w-3 h-3" />
            </ToolbarButton>
            <ToolbarButton
              active={isUnderline}
              title="Underline (Ctrl+U)"
              onMouseDown={() => toggleMark(editor, 'underline')}
            >
              <Underline className="w-3 h-3" />
            </ToolbarButton>

            <div className="w-px h-4 bg-border mx-0.5" />

            {/* Link */}
            <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
              <PopoverTrigger asChild>
                <ToolbarButton active={hasLink} title="Add link" onMouseDown={() => {}}>
                  <Link2 className="w-3 h-3" />
                </ToolbarButton>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" side="top">
                <LinkPopover editor={editor} onClose={() => setLinkPopoverOpen(false)} />
              </PopoverContent>
            </Popover>

            {hasLink && (
              <ToolbarButton
                active={false}
                title="Remove link"
                onMouseDown={() => unwrapLink(editor)}
              >
                <Unlink className="w-3 h-3" />
              </ToolbarButton>
            )}

            <div className="flex-1" />

            {/* Per-block AI refine */}
            <AIRefineButton value={value} onChange={onChange} jobId={jobId} />
          </div>
        )}

        <Editable
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className={cn(
            'outline-none px-1 py-0.5 min-h-[1.4em] text-sm leading-relaxed',
            className
          )}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
        />
      </Slate>
    </div>
  );
}
