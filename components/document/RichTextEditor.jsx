'use client';

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { createEditor, Transforms, Range } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Bold, Italic, Underline, Link2, List, Sparkles, RefreshCw, Unlink } from 'lucide-react';
import {
  SLATE_ELEM,
  ensureSlate,
  slateToText,
  toggleMark,
  isMarkActive,
  isLinkActive,
  isListActive,
  wrapLink,
  unwrapLink,
  toggleList,
} from '@/lib/slateUtils';

// ─── Plugin: make links inline ────────────────────────────────────────────

function withLinks(editor) {
  const { isInline } = editor;
  editor.isInline = (element) => (element.type === SLATE_ELEM.LINK ? true : isInline(element));
  return editor;
}

// ─── Plugin: list keyboard behaviour ─────────────────────────────────────

function withLists(editor) {
  const { insertBreak, deleteBackward } = editor;

  // Enter on an empty list-item → exit the list
  editor.insertBreak = () => {
    const { selection } = editor;
    if (selection) {
      const [listItemEntry] = Array.from(
        editor.nodes({ match: (n) => n.type === SLATE_ELEM.LIST_ITEM })
      );
      if (listItemEntry) {
        const [node] = listItemEntry;
        const text = (node.children || []).map((c) => c.text || '').join('');
        if (text === '') {
          editor.setNodes(
            { type: SLATE_ELEM.PARAGRAPH },
            { match: (n) => n.type === SLATE_ELEM.LIST_ITEM }
          );
          editor.unwrapNodes({
            match: (n) => n.type === SLATE_ELEM.BULLETED_LIST,
            split: true,
          });
          return;
        }
      }
    }
    insertBreak();
  };

  // Backspace at the very start of the first list-item → exit the list
  editor.deleteBackward = (unit) => {
    const { selection } = editor;
    if (selection && Range.isCollapsed(selection) && selection.anchor.offset === 0) {
      const [listItemEntry] = Array.from(
        editor.nodes({ match: (n) => n.type === SLATE_ELEM.LIST_ITEM })
      );
      if (listItemEntry) {
        const [, itemPath] = listItemEntry;
        if (selection.anchor.path[itemPath.length] === 0) {
          editor.setNodes(
            { type: SLATE_ELEM.PARAGRAPH },
            { match: (n) => n.type === SLATE_ELEM.LIST_ITEM }
          );
          editor.unwrapNodes({
            match: (n) => n.type === SLATE_ELEM.BULLETED_LIST,
            split: true,
          });
          return;
        }
      }
    }
    deleteBackward(unit);
  };

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
  if (element.type === SLATE_ELEM.BULLETED_LIST) {
    return (
      <ul {...attributes} className="list-disc pl-5 my-0.5 space-y-0">
        {children}
      </ul>
    );
  }
  if (element.type === SLATE_ELEM.LIST_ITEM) {
    return <li {...attributes}>{children}</li>;
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
      <PopoverContent className="w-72 p-3 space-y-2 doc-light" side="top">
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
  const editor = useMemo(() => withLists(withLinks(withHistory(withReact(createEditor())))), []);

  const [focused, setFocused] = useState(false);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  // Refs — synchronous reads needed in event handlers
  const savedSelectionRef = useRef(null);
  const linkInputOpenRef = useRef(false);
  const linkUrlInputRef = useRef(null);

  const renderLeaf = useCallback((props) => <Leaf {...props} />, []);
  const renderElement = useCallback((props) => <Element {...props} />, []);

  const safeValue = useMemo(() => ensureSlate(value), []);

  // Keep ref in sync so onBlur can check synchronously
  const openLinkInput = () => {
    linkInputOpenRef.current = true;
    setLinkInputOpen(true);
  };
  const closeLinkInput = () => {
    linkInputOpenRef.current = false;
    setLinkInputOpen(false);
    setLinkUrl('');
  };

  // Focus the URL input whenever the link row becomes visible
  useEffect(() => {
    if (linkInputOpen) {
      setTimeout(() => linkUrlInputRef.current?.focus(), 10);
    }
  }, [linkInputOpen]);

  // Apply the link using the saved selection (editor may have lost focus)
  const applyLink = useCallback(() => {
    if (linkUrl.trim()) {
      const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      try {
        if (savedSelectionRef.current) {
          Transforms.select(editor, savedSelectionRef.current);
        }
        wrapLink(editor, href);
        ReactEditor.focus(editor);
      } catch (_) {}
    }
    closeLinkInput();
    savedSelectionRef.current = null;
  }, [editor, linkUrl]);

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
      case 'k':
        event.preventDefault();
        savedSelectionRef.current = editor.selection;
        if (linkInputOpenRef.current) {
          closeLinkInput();
        } else {
          openLinkInput();
        }
        break;
    }
  };

  const isBold = isMarkActive(editor, 'bold');
  const isItalic = isMarkActive(editor, 'italic');
  const isUnderline = isMarkActive(editor, 'underline');
  const hasLink = isLinkActive(editor);
  const isList = isListActive(editor);

  return (
    <div
      className={cn(
        'group relative rounded transition-colors',
        focused ? 'ring-1 ring-primary/40 bg-background' : 'hover:bg-muted/30'
      )}
      style={style}
    >
      <Slate editor={editor} initialValue={safeValue} onChange={onChange}>
        {/* Toolbar — shown while focused or while the link URL input is open */}
        {(focused || linkInputOpen) && (
          <div className="border-b bg-muted/60 rounded-t">
            {/* Button row */}
            <div className="flex items-center gap-0.5 px-1 py-0.5">
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

              {/* Bulleted list */}
              <ToolbarButton
                active={isList}
                title="Bulleted list"
                onMouseDown={() => toggleList(editor)}
              >
                <List className="w-3 h-3" />
              </ToolbarButton>

              <div className="w-px h-4 bg-border mx-0.5" />

              {/* Link — inline input, no Radix portal (avoids selection loss) */}
              <ToolbarButton
                active={hasLink || linkInputOpen}
                title="Add / edit link (Ctrl+K)"
                onMouseDown={() => {
                  savedSelectionRef.current = editor.selection;
                  if (linkInputOpenRef.current) {
                    closeLinkInput();
                  } else {
                    openLinkInput();
                  }
                }}
              >
                <Link2 className="w-3 h-3" />
              </ToolbarButton>

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

            {/* Inline link URL input row — no portal, preserves editor selection */}
            {linkInputOpen && (
              <div className="flex items-center gap-1 px-1 py-0.5 border-t">
                <Input
                  ref={linkUrlInputRef}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  className="h-6 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyLink();
                    }
                    if (e.key === 'Escape') closeLinkInput();
                  }}
                />
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyLink();
                  }}
                  className="h-6 px-2 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity shrink-0"
                >
                  Apply
                </button>
              </div>
            )}
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
            // Don't collapse the toolbar if the link URL input is still open
            if (!linkInputOpenRef.current) {
              setFocused(false);
              onBlur?.();
            }
          }}
        />
      </Slate>
    </div>
  );
}
