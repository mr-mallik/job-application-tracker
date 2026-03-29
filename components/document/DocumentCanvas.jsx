'use client';

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Link2, X, PlusCircle, Pencil, ExternalLink, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BLOCK_TYPES,
  createTextBlock,
  createBulletBlock,
  createSubheadingBlock,
  createSkillGroupBlock,
  createSpacerBlock,
  createSectionTitleBlock,
  createDocHeaderBlock,
} from '@/lib/blockSchema';
import { ensureSlate, slateToText } from '@/lib/slateUtils';
import RichTextEditor from './RichTextEditor';

// ─── A4 page constants ─────────────────────────────────────────────────────

// A4 at 96 dpi in pixels
const A4_WIDTH = 794;
const A4_MIN_HEIGHT = 960;
const A4_PADDING_V = 40; // top + bottom padding (px)
const A4_USABLE_HEIGHT = A4_MIN_HEIGHT - A4_PADDING_V * 2; // content area per page
const PAGE_GAP = 32; // grey gap between pages (px)

// ─── Section grouping ──────────────────────────────────────────────────────

/**
 * Group a flat blocks array into { preamble, sections, postamble }.
 *
 * preamble  — everything before the first SECTION_TITLE
 * sections  — [{ titleBlock, children: Block[] }] — one per SECTION_TITLE
 * postamble — CL_CLOSING and anything after final section (for letters)
 */
export function computeSections(blocks) {
  const preamble = [];
  const sections = [];
  let current = null;

  for (const block of blocks) {
    if (block.type === BLOCK_TYPES.SECTION_TITLE) {
      if (current) sections.push(current);
      current = { titleBlock: block, children: [] };
    } else if (current) {
      current.children.push(block);
    } else {
      preamble.push(block);
    }
  }
  if (current) sections.push(current);

  return { preamble, sections };
}

/** Reconstruct flat blocks array from the structured layout */
export function flattenSections({ preamble, sections }) {
  return [...preamble, ...sections.flatMap((s) => [s.titleBlock, ...s.children])];
}

// ─── Color utilities ───────────────────────────────────────────────────────

/**
 * Lightens a hex color by a percentage.
 * @param {string} hex - Hex color (e.g., '#1e40af')
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened hex color
 */
function lightenColor(hex, percent) {
  if (!hex) return '#000000';
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(
    255,
    ((num >> 16) & 0xff) + Math.round((255 - ((num >> 16) & 0xff)) * (percent / 100))
  );
  const g = Math.min(
    255,
    ((num >> 8) & 0xff) + Math.round((255 - ((num >> 8) & 0xff)) * (percent / 100))
  );
  const b = Math.min(255, (num & 0xff) + Math.round((255 - (num & 0xff)) * (percent / 100)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ─── Block renderers ───────────────────────────────────────────────────────

// Styles that mirror the ATS PDF template
const PAGE_STYLES = {
  name: 'text-2xl font-bold uppercase tracking-wide text-center',
  designation: 'text-sm text-gray-500 text-center mt-1',
  contactRow: 'flex flex-wrap justify-center gap-x-3 mt-1.5 text-xs text-gray-500',
  sectionTitle:
    'text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mt-1 break-words',
  subheadingPrimary: 'text-sm font-semibold',
  subheadingMeta: 'text-xs text-gray-500',
  text: 'text-sm text-gray-700 leading-relaxed',
  bullet: 'text-sm text-gray-700 leading-relaxed',
  skillLabel: 'text-xs font-semibold text-gray-600 mr-2',
  skillTags: 'text-xs text-gray-700',
};

// ─── Links editor dialog ──────────────────────────────────────────────────

function LinksEditorDialog({ links, open, onOpenChange, onSave }) {
  const [draft, setDraft] = useState(links);

  // Reset draft whenever the dialog opens
  useEffect(() => {
    if (open) setDraft(links);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const updateRow = (i, partial) => {
    const next = [...draft];
    next[i] = { ...next[i], ...partial };
    setDraft(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage contact links</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-1 max-h-72 overflow-y-auto pr-1">
          {draft.map((lnk, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={lnk.label || ''}
                onChange={(e) => updateRow(i, { label: e.target.value })}
                placeholder="Label"
                className="h-8 text-xs w-28 shrink-0"
              />
              <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <Input
                value={lnk.url || ''}
                onChange={(e) => updateRow(i, { url: e.target.value })}
                placeholder="https://…"
                className="h-8 text-xs flex-1"
              />
              <button
                type="button"
                onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setDraft([...draft, { label: '', url: '' }])}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add link
        </button>

        <DialogFooter className="mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onSave(draft.filter((l) => l.label || l.url));
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── DocHeader block renderer ─────────────────────────────────────────────

function DocHeaderBlock({ block, onChange, isDragMode, accentColor }) {
  const { data } = block;
  const links = data.links || [];
  const [dialogOpen, setDialogOpen] = useState(false);

  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mb-4 text-center space-y-1">
      <Input
        value={data.name || ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Full Name"
        disabled={isDragMode}
        className={cn(
          PAGE_STYLES.name,
          'border-0 bg-transparent text-center focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5',
          isDragMode && 'cursor-move'
        )}
        style={{ fontSize: '1.4rem', color: accentColor }}
      />
      <Input
        value={data.designation || ''}
        onChange={(e) => update({ designation: e.target.value })}
        placeholder="Job Title / Headline"
        disabled={isDragMode}
        className={cn(
          'border-0 bg-transparent text-center text-sm text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5',
          isDragMode && 'cursor-move'
        )}
        style={{ color: lightenColor(accentColor, 30) }}
      />

      {/* Contact links — compact chip row */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-2">
        {links.length > 0 ? (
          links.map((lnk, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs text-gray-500 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200"
            >
              {lnk.url ? (
                <ExternalLink className="w-2.5 h-2.5 shrink-0 text-gray-400" />
              ) : (
                <Link2 className="w-2.5 h-2.5 shrink-0 text-gray-400" />
              )}
              {lnk.label || lnk.url || '—'}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-300 italic">No contact links</span>
        )}
        {!isDragMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDialogOpen(true);
            }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded hover:bg-muted"
            title="Edit links"
          >
            <Pencil className="w-3 h-3" />
            Edit links
          </button>
        )}
      </div>

      <LinksEditorDialog
        links={links}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(newLinks) => update({ links: newLinks })}
      />
    </div>
  );
}

// ─── CL Header block ──────────────────────────────────────────────────────

function ClHeaderBlock({ block, onChange, isDragMode }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mb-4 space-y-1">
      <Input
        value={data.name || ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Your Full Name"
        disabled={isDragMode}
        className={cn(
          'border-0 bg-transparent font-semibold text-base focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5',
          isDragMode && 'cursor-move'
        )}
      />
      {['email', 'phone', 'location'].map((field) => (
        <Input
          key={field}
          value={data[field] || ''}
          onChange={(e) => update({ [field]: e.target.value })}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          disabled={isDragMode}
          className={cn(
            'border-0 bg-transparent text-xs text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5',
            isDragMode && 'cursor-move'
          )}
        />
      ))}
    </div>
  );
}

// ─── Subheading block ─────────────────────────────────────────────────────

function SubheadingBlock({ block, onChange, isDragMode, accentColor }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mb-1.5 mt-2">
      <div className="flex items-start justify-between gap-2">
        <Input
          value={data.primary || ''}
          onChange={(e) => update({ primary: e.target.value })}
          placeholder="Role / Organisation"
          disabled={isDragMode}
          className={cn(
            'border-0 bg-transparent font-semibold text-[0.85rem] focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 flex-1 p-0',
            isDragMode && 'cursor-move'
          )}
          style={{ color: lightenColor(accentColor, 30) }}
        />
        <Input
          value={data.dateRange || ''}
          onChange={(e) => update({ dateRange: e.target.value })}
          placeholder="Date range"
          disabled={isDragMode}
          className={cn(
            'border-0 bg-transparent text-xs text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 w-50 text-right p-0',
            isDragMode && 'cursor-move'
          )}
        />
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={data.secondary || ''}
          onChange={(e) => update({ secondary: e.target.value })}
          placeholder="Department / Course"
          disabled={isDragMode}
          className={cn(
            'border-0 bg-transparent text-xs text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 flex-1 p-0',
            isDragMode && 'cursor-move'
          )}
        />
        <Input
          value={data.location || ''}
          onChange={(e) => update({ location: e.target.value })}
          placeholder="Location"
          disabled={isDragMode}
          className={cn(
            'border-0 bg-transparent text-xs text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 w-50 text-right p-0',
            isDragMode && 'cursor-move'
          )}
        />
      </div>
    </div>
  );
}

// ─── SkillGroup block ─────────────────────────────────────────────────────

function AutoResizeTextarea({ value, onChange, placeholder, className, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
}

function SkillGroupBlock({ block, onChange, isDragMode, accentColor }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });
  const skillsStr = (data.skills || []).join(', ');
  const labelRef = useRef(null);
  const [labelWidth, setLabelWidth] = useState(112); // w-28 = 7rem = 112px

  useEffect(() => {
    if (!labelRef.current) return;
    // Create temporary span to measure text width
    const span = document.createElement('span');
    span.style.cssText =
      'position:absolute;visibility:hidden;white-space:pre;font-size:0.75rem;font-weight:600;';
    span.textContent = data.label || 'Category';
    document.body.appendChild(span);
    const width = Math.max(span.offsetWidth + 30, 60); // +30px padding, min 60px
    document.body.removeChild(span);
    setLabelWidth(width);
  }, [data.label]);

  return (
    <div className="flex items-start gap-2 mb-1">
      <Input
        ref={labelRef}
        value={data.label || ''}
        onChange={(e) => update({ label: e.target.value })}
        placeholder="Category"
        disabled={isDragMode}
        className={cn(
          'border-0 bg-transparent text-xs font-semibold text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 p-0 shrink-0 mt-px',
          isDragMode && 'cursor-move'
        )}
        style={{ width: `${labelWidth}px`, color: accentColor }}
      />
      <span className="text-xs text-gray-400 shrink-0 mt-px">:</span>
      <AutoResizeTextarea
        value={skillsStr}
        onChange={(e) =>
          update({
            skills: e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        placeholder="Skill 1, Skill 2, Skill 3"
        disabled={isDragMode}
        className={cn(
          'border-0 bg-transparent text-xs text-gray-700 outline-none w-full p-0 leading-relaxed',
          isDragMode && 'cursor-move'
        )}
      />
    </div>
  );
}

// ─── Letter detail blocks (Date, Recipient, Salutation, Closing) ──────────

function SimpleTextBlock({ block, onChange, placeholder, className: cls, isDragMode }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <Input
      value={data.text || data.date || ''}
      onChange={(e) =>
        update(data.date !== undefined ? { date: e.target.value } : { text: e.target.value })
      }
      placeholder={placeholder}
      disabled={isDragMode}
      className={cn(
        'border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5 p-0',
        isDragMode && 'cursor-move',
        cls
      )}
    />
  );
}

function ClRecipientBlock({ block, onChange, isDragMode }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mb-2 space-y-0">
      {['name', 'company', 'address'].map((f) => (
        <Input
          key={f}
          value={data[f] || ''}
          onChange={(e) => update({ [f]: e.target.value })}
          placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
          disabled={isDragMode}
          className={cn(
            'border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5 p-0',
            isDragMode && 'cursor-move'
          )}
        />
      ))}
    </div>
  );
}

function ClClosingBlock({ block, onChange, isDragMode }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mt-4 space-y-0.5">
      <Input
        value={data.text || ''}
        onChange={(e) => update({ text: e.target.value })}
        placeholder="Sincerely,"
        disabled={isDragMode}
        className={cn(
          'border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 p-0',
          isDragMode && 'cursor-move'
        )}
      />
      <Input
        value={data.name || ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Your name"
        disabled={isDragMode}
        className={cn(
          'border-0 bg-transparent text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 p-0 mt-6',
          isDragMode && 'cursor-move'
        )}
      />
    </div>
  );
}

// ─── Lightweight block renderer for the hidden measurement container ──────
// Must NOT render Slate editors — the visible canvas already holds Slate
// instances for every block.  Sharing the same slateContent objects between
// two editors causes "Unable to find the path for Slate node" crashes.

function MeasureBlockRenderer({ block, accentColor }) {
  switch (block.type) {
    case BLOCK_TYPES.DOC_HEADER: {
      const { data } = block;
      return (
        <div className="mb-4 text-center space-y-1">
          <div className={PAGE_STYLES.name}>{data.name || 'Full Name'}</div>
          <div className="text-sm text-gray-500 mt-1">{data.designation || ''}</div>
          <div className="flex flex-wrap justify-center gap-x-2 mt-2">
            {(data.links || []).map((l, i) => (
              <span key={i} className="text-xs text-gray-500">
                {l.label || l.url}
              </span>
            ))}
          </div>
        </div>
      );
    }
    case BLOCK_TYPES.CL_HEADER: {
      const { data } = block;
      return (
        <div className="mb-4 space-y-1">
          <div className="font-semibold text-base">{data.name || ''}</div>
          {['email', 'phone', 'location'].map((f) => (
            <div key={f} className="text-xs text-gray-500">
              {data[f] || ''}
            </div>
          ))}
        </div>
      );
    }
    case BLOCK_TYPES.TEXT:
      return (
        <div className={PAGE_STYLES.text}>
          {slateToText(block.data.slateContent ?? block.data.text) || '\u00a0'}
        </div>
      );
    case BLOCK_TYPES.BULLET:
      return (
        <div className="flex items-start gap-1.5 my-0.5">
          <span className="mt-[3px] text-gray-500 select-none text-xs">•</span>
          <div className={PAGE_STYLES.bullet} style={{ flex: 1 }}>
            {slateToText(block.data.slateContent ?? block.data.text) || '\u00a0'}
          </div>
        </div>
      );
    case BLOCK_TYPES.SUBHEADING: {
      const { data } = block;
      return (
        <div className="mb-1.5 mt-2">
          <div className="flex items-start justify-between gap-2">
            <div className="font-semibold text-[0.85rem] flex-1">{data.primary || ''}</div>
            <div className="text-xs text-gray-500 w-50 text-right">{data.dateRange || ''}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 flex-1">{data.secondary || ''}</div>
            <div className="text-xs text-gray-500 w-50 text-right">{data.location || ''}</div>
          </div>
        </div>
      );
    }
    case BLOCK_TYPES.SKILL_GROUP: {
      const { data } = block;
      return (
        <div className="flex items-start gap-2 mb-1">
          <div className="text-xs font-semibold text-gray-600 w-28 shrink-0 mt-px">
            {data.label || ''}
          </div>
          <span className="text-xs text-gray-400 shrink-0 mt-px">:</span>
          <div className="text-xs text-gray-700">{(data.skills || []).join(', ')}</div>
        </div>
      );
    }
    case BLOCK_TYPES.SPACER:
      return (
        <div
          className="w-full"
          style={{ height: block.data.size === 'lg' ? 20 : block.data.size === 'md' ? 12 : 8 }}
        />
      );
    case BLOCK_TYPES.SECTION_TITLE:
      return (
        <div
          className={cn(PAGE_STYLES.sectionTitle, 'uppercase mt-1 break-words')}
          style={{ color: accentColor, borderColor: accentColor + '50' }}
        >
          {block.data.title || 'SECTION'}
        </div>
      );
    case BLOCK_TYPES.CL_DATE:
      return <div className="text-sm mb-1">{block.data.date || ''}</div>;
    case BLOCK_TYPES.CL_RECIPIENT: {
      const { data } = block;
      return (
        <div className="mb-2">
          {['name', 'company', 'address'].map((f) => (
            <div key={f} className="text-sm">
              {data[f] || ''}
            </div>
          ))}
        </div>
      );
    }
    case BLOCK_TYPES.CL_SALUTATION:
      return <div className="text-sm mb-2">{block.data.text || ''}</div>;
    case BLOCK_TYPES.CL_CLOSING:
      return (
        <div className="mt-4">
          <div className="text-sm">{block.data.text || ''}</div>
          <div className="text-sm font-semibold mt-6">{block.data.name || ''}</div>
        </div>
      );
    default:
      return null;
  }
}

// ─── Block router ─────────────────────────────────────────────────────────

function BlockRenderer({ block, onChange, jobId, isDragMode, accentColor }) {
  const handleRichChange = useCallback(
    (newSlate) => {
      if (isDragMode) return;
      const text = slateToText(newSlate);
      onChange({ ...block, data: { ...block.data, slateContent: newSlate, text } });
    },
    [block, onChange, isDragMode]
  );

  switch (block.type) {
    case BLOCK_TYPES.DOC_HEADER:
      return (
        <DocHeaderBlock
          block={block}
          onChange={onChange}
          isDragMode={isDragMode}
          accentColor={accentColor}
        />
      );
    case BLOCK_TYPES.CL_HEADER:
      return <ClHeaderBlock block={block} onChange={onChange} isDragMode={isDragMode} />;
    case BLOCK_TYPES.TEXT:
      return (
        <RichTextEditor
          value={ensureSlate(block.data.slateContent ?? block.data.text)}
          onChange={handleRichChange}
          placeholder="Paragraph text…"
          className={PAGE_STYLES.text}
          jobId={jobId}
          readOnly={isDragMode}
        />
      );
    case BLOCK_TYPES.BULLET:
      return (
        <div className="flex items-start gap-1.5 my-0.5">
          <span className="mt-[3px] text-gray-500 select-none text-xs">•</span>
          <RichTextEditor
            value={ensureSlate(block.data.slateContent ?? block.data.text)}
            onChange={handleRichChange}
            placeholder="Bullet point…"
            className={PAGE_STYLES.bullet}
            jobId={jobId}
            style={{ flex: 1 }}
            readOnly={isDragMode}
          />
        </div>
      );
    case BLOCK_TYPES.SUBHEADING:
      return (
        <SubheadingBlock
          block={block}
          onChange={onChange}
          isDragMode={isDragMode}
          accentColor={accentColor}
        />
      );
    case BLOCK_TYPES.SKILL_GROUP:
      return (
        <SkillGroupBlock
          block={block}
          onChange={onChange}
          isDragMode={isDragMode}
          accentColor={accentColor}
        />
      );
    case BLOCK_TYPES.SPACER:
      return (
        <div
          className="w-full"
          style={{
            height: block.data.size === 'lg' ? 20 : block.data.size === 'md' ? 12 : 8,
          }}
        />
      );
    case BLOCK_TYPES.CL_DATE:
      return (
        <SimpleTextBlock
          block={block}
          onChange={onChange}
          placeholder="Date"
          className="text-sm mb-1"
          isDragMode={isDragMode}
        />
      );
    case BLOCK_TYPES.CL_RECIPIENT:
      return <ClRecipientBlock block={block} onChange={onChange} isDragMode={isDragMode} />;
    case BLOCK_TYPES.CL_SALUTATION:
      return (
        <SimpleTextBlock
          block={block}
          onChange={onChange}
          placeholder="Dear Hiring Manager,"
          className="text-sm mb-2"
          isDragMode={isDragMode}
        />
      );
    case BLOCK_TYPES.CL_CLOSING:
      return <ClClosingBlock block={block} onChange={onChange} isDragMode={isDragMode} />;
    // SECTION_TITLE used by the measurement container only
    case BLOCK_TYPES.SECTION_TITLE:
      return (
        <div className={cn(PAGE_STYLES.sectionTitle, 'uppercase break-words')}>
          {block.data.title || 'SECTION'}
        </div>
      );
    default:
      return null;
  }
}

// ─── Add block inline menu ────────────────────────────────────────────────
// Only shown on letter documents at the bottom of the last page.
// Resume documents use the FloatingDocToolbar for all add-block actions.

const LETTER_BLOCK_ADDITIONS = [
  { type: BLOCK_TYPES.TEXT, label: 'Paragraph' },
  { type: BLOCK_TYPES.BULLET, label: 'Bullet Point' },
];

function InlineAddMenu({ onAdd }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-primary transition-all hover:bg-muted/40 rounded border border-dashed border-gray-200 mt-2"
      >
        + Add block
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 py-1 px-1 bg-muted/40 rounded mt-0.5">
      {LETTER_BLOCK_ADDITIONS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => {
            onAdd(item.type);
            setOpen(false);
          }}
          className="text-xs px-2 py-0.5 bg-background border rounded hover:bg-muted transition-colors"
        >
          {item.label}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs px-1.5 py-0.5 text-muted-foreground hover:text-destructive transition-colors ml-auto"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Sortable Block Item ──────────────────────────────────────────────────

function SortableBlockItem({ block, children, isDragMode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative group', isDragMode && 'cursor-move hover:bg-blue-50/30 rounded-sm')}
    >
      {isDragMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      <div className={cn(isDragMode && 'pl-8')}>{children}</div>
    </div>
  );
}

// ─── Flat page renderer ───────────────────────────────────────────────────
//
// Pure display: no inline controls. Blocks are clickable to select them.
// Section-title blocks get an editable heading input.
// Selection is indicated by a subtle blue ring (no extra space added).

function PageBlocks({
  pageBlocks,
  allBlocks,
  documentType,
  jobId,
  onBlockUpdate,
  onSectionTitleChange,
  selectedBlockId,
  onSelectBlock,
  sections,
  isDragMode,
  accentColor,
}) {
  return (
    <>
      {pageBlocks.map((block) => {
        const isSelected = block.id === selectedBlockId;

        // ── Section title block ────────────────────────────────────────────
        if (block.type === BLOCK_TYPES.SECTION_TITLE) {
          return (
            <SortableBlockItem key={block.id} block={block} isDragMode={isDragMode}>
              <div
                className={cn(
                  'mt-1 rounded-sm transition-all',
                  !isDragMode && 'cursor-pointer',
                  isSelected && !isDragMode && 'ring-2 ring-blue-400 ring-offset-1'
                )}
                onClick={(e) => {
                  if (isDragMode) return;
                  e.stopPropagation();
                  onSelectBlock(block.id);
                }}
              >
                <textarea
                  value={block.data.title || ''}
                  onChange={(e) => onSectionTitleChange(block.id, e.target.value)}
                  onClick={(e) => {
                    if (isDragMode) return;
                    e.stopPropagation();
                    onSelectBlock(block.id);
                  }}
                  placeholder="SECTION TITLE"
                  disabled={isDragMode}
                  rows={1}
                  className={cn(
                    PAGE_STYLES.sectionTitle,
                    'w-full bg-transparent outline-none border-0 border-b border-gray-300 focus:border-primary py-0.5 transition-colors uppercase placeholder:text-gray-300 resize-none overflow-hidden break-words',
                    isDragMode && 'cursor-move pointer-events-none'
                  )}
                  style={{ color: accentColor, borderColor: accentColor + '50' }}
                  ref={(el) => {
                    // Auto-resize on mount and when content changes
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    }
                  }}
                  onInput={(e) => {
                    // Auto-resize textarea to fit content
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                />
              </div>
            </SortableBlockItem>
          );
        }

        // ── Regular content block ──────────────────────────────────────────
        return (
          <SortableBlockItem key={block.id} block={block} isDragMode={isDragMode}>
            <div
              className={cn(
                'rounded-sm transition-all',
                !isDragMode && 'cursor-pointer',
                isSelected && !isDragMode && 'ring-2 ring-blue-400 ring-offset-1'
              )}
              onClick={(e) => {
                if (isDragMode) return;
                e.stopPropagation();
                onSelectBlock(block.id);
              }}
            >
              <BlockRenderer
                block={block}
                onChange={onBlockUpdate}
                jobId={jobId}
                isDragMode={isDragMode}
                accentColor={accentColor}
              />
            </div>
          </SortableBlockItem>
        );
      })}
    </>
  );
}

// ─── Header helper ───────────────────────────────────────────────────────

/**
 * Build the structured links array for a DOC_HEADER block from a user profile.
 */
function buildLinksFromProfile(profile) {
  if (!profile) return [];
  const links = [];
  if (profile.email) links.push({ label: profile.email, url: `mailto:${profile.email}` });
  if (profile.phone) links.push({ label: profile.phone, url: `tel:${profile.phone}` });
  if (profile.location) links.push({ label: profile.location, url: '' });
  if (profile.linkedin) {
    const url = profile.linkedin.startsWith('http')
      ? profile.linkedin
      : `https://${profile.linkedin}`;
    // Extract readable part: linkedin.com/in/username or full path
    const label = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    links.push({ label, url });
  }
  if (profile.portfolio) {
    const url = profile.portfolio.startsWith('http')
      ? profile.portfolio
      : `https://${profile.portfolio}`;
    // Extract domain/path without protocol
    const label = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    links.push({ label, url });
  }
  return links;
}

// ─── Main DocumentCanvas ──────────────────────────────────────────────────

/**
 * A4 HTML canvas — renders the document as styled HTML with inline editing.
 *
 * Pages are computed by measuring every block individually in a hidden
 * off-screen container, then greedily bin-packing blocks into A4-height
 * pages.  Sections can split across page boundaries.
 *
 * Props:
 *   blocks              Block[]
 *   documentType        'resume' | 'coverLetter' | 'supportingStatement'
 *   onChange            (newBlocks: Block[]) => void
 *   jobId               optional
 *   selectedBlockId     controlled selection (from parent)
 *   onSelectionChange   (id | null) => void
 *
 * Ref API (via forwardRef + useImperativeHandle):
 *   addBlock(type, afterId?)   — insert block of given type after afterId (or at end)
 *   deleteBlock(id)            — delete block by id
 *   moveUp(id)                 — move block up
 *   moveDown(id)               — move block down
 */
const DocumentCanvas = forwardRef(function DocumentCanvas(
  {
    blocks,
    documentType,
    onChange,
    jobId,
    selectedBlockId,
    onSelectionChange,
    userProfile,
    styleOverrides = {},
  },
  ref
) {
  const [blockPageMap, setBlockPageMap] = useState({});
  const [measured, setMeasured] = useState(false);
  const [isDragMode, setIsDragMode] = useState(false);
  const measureRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { preamble, sections } = computeSections(blocks);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        onChange(arrayMove(blocks, oldIndex, newIndex));
      }
    },
    [blocks, onChange]
  );

  // ── Auto-inject DOC_HEADER for resumes when AI-generated blocks omit it ───
  useEffect(() => {
    if (documentType !== 'resume') return;
    if (blocks.length === 0) return;
    if (blocks[0]?.type === BLOCK_TYPES.DOC_HEADER) return;
    const headerBlock = createDocHeaderBlock({
      name: userProfile?.name || '',
      designation: userProfile?.headline || userProfile?.designation || '',
      links: buildLinksFromProfile(userProfile),
    });
    onChange([headerBlock, ...blocks]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, documentType]);

  // ── Per-block measurement ────────────────────────────────────────────────
  // Uses a ref to track the last serialised map so setState is only called
  // when page assignments actually change — prevents the infinite-loop that
  // would occur if setState triggered a re-render that re-ran this effect.
  const prevMapSerialRef = useRef('');

  useEffect(() => {
    const container = measureRef.current;
    if (!container) return;
    const wrappers = Array.from(container.querySelectorAll('[data-mb]'));
    if (wrappers.length === 0) return;

    const newMap = {};
    let page = 0;
    let used = 0;

    for (let i = 0; i < wrappers.length; i++) {
      const el = wrappers[i];
      const next = wrappers[i + 1];
      const h = next ? next.offsetTop - el.offsetTop : container.scrollHeight - el.offsetTop;

      if (used + h > usableHeight && used > 0) {
        page++;
        used = 0;
      }
      newMap[el.dataset.mb] = page;
      used += h;
    }

    const serial = JSON.stringify(newMap);
    if (serial !== prevMapSerialRef.current) {
      prevMapSerialRef.current = serial;
      setBlockPageMap(newMap);
      setMeasured(true);
    }
  }); // no dep-array — re-measure after every render, but only setState on change

  // ── Page distribution ────────────────────────────────────────────────────
  const totalPages =
    !measured || blocks.length === 0
      ? 1
      : Math.max(1, Math.max(...Object.values(blockPageMap)) + 1);

  const blocksByPage = Array.from({ length: totalPages }, (_, pageIdx) =>
    blocks.filter((b) => (blockPageMap[b.id] ?? 0) === pageIdx)
  );

  // ── Block mutations (inline editing) ─────────────────────────────────────

  const updateBlock = useCallback(
    (updated) => onChange(blocks.map((b) => (b.id === updated.id ? updated : b))),
    [blocks, onChange]
  );

  const updateSectionTitle = useCallback(
    (titleId, newTitle) =>
      onChange(
        blocks.map((b) => (b.id === titleId ? { ...b, data: { ...b.data, title: newTitle } } : b))
      ),
    [blocks, onChange]
  );

  // ── Imperative API (used by FloatingDocToolbar via ref) ────────────────────
  const makeBlock = useCallback(
    (type) => {
      switch (type) {
        case BLOCK_TYPES.DOC_HEADER:
          return createDocHeaderBlock({
            name: userProfile?.name || '',
            designation: userProfile?.headline || userProfile?.designation || '',
            links: buildLinksFromProfile(userProfile),
          });
        case BLOCK_TYPES.SECTION_TITLE:
          return createSectionTitleBlock('NEW SECTION');
        case BLOCK_TYPES.SUBHEADING:
          return createSubheadingBlock();
        case BLOCK_TYPES.BULLET:
          return createBulletBlock();
        case BLOCK_TYPES.SKILL_GROUP:
          return createSkillGroupBlock();
        case BLOCK_TYPES.SPACER:
          return createSpacerBlock();
        default:
          return createTextBlock();
      }
    },
    [userProfile]
  );

  useImperativeHandle(
    ref,
    () => ({
      toggleDragMode() {
        setIsDragMode((prev) => !prev);
        if (!isDragMode) {
          onSelectionChange?.(null); // Clear selection when entering drag mode
        }
      },
      isDragMode,
      addBlock(type, afterId) {
        // Handle special 'section-with-content' type that creates 3 blocks
        if (type === 'section-with-content') {
          const sectionTitle = createSectionTitleBlock('NEW SECTION');
          const subheading = createSubheadingBlock();
          const textBlock = createTextBlock();
          const newBlocks = [sectionTitle, subheading, textBlock];

          if (!afterId) {
            onChange([...blocks, ...newBlocks]);
          } else {
            // If afterId is a section title, insert after last child of that section
            const { sections: secs } = computeSections(blocks);
            const sec = secs.find((s) => s.titleBlock.id === afterId);
            const insertAfterId = sec?.children?.at(-1)?.id ?? afterId;
            const idx = blocks.findIndex((b) => b.id === insertAfterId);
            const next = [...blocks];
            next.splice(idx + 1, 0, ...newBlocks);
            onChange(next);
          }
          onSelectionChange?.(sectionTitle.id);
          return;
        }

        // Normal single block creation
        const newBlock = makeBlock(type);
        if (!afterId) {
          onChange([...blocks, newBlock]);
        } else {
          // If afterId is a section title, insert after last child of that section
          const { sections: secs } = computeSections(blocks);
          const sec = secs.find((s) => s.titleBlock.id === afterId);
          const insertAfterId = sec?.children?.at(-1)?.id ?? afterId;
          const idx = blocks.findIndex((b) => b.id === insertAfterId);
          const next = [...blocks];
          next.splice(idx + 1, 0, newBlock);
          onChange(next);
        }
        onSelectionChange?.(newBlock.id);
      },
      deleteBlock(id) {
        onChange(blocks.filter((b) => b.id !== id));
        onSelectionChange?.(null);
      },
      moveUp(id) {
        const idx = blocks.findIndex((b) => b.id === id);
        if (idx <= 0) return;
        onChange(arrayMove(blocks, idx, idx - 1));
      },
      moveDown(id) {
        const idx = blocks.findIndex((b) => b.id === id);
        if (idx < 0 || idx >= blocks.length - 1) return;
        onChange(arrayMove(blocks, idx, idx + 1));
      },
      updateSelectedBlock(updater) {
        onChange(blocks.map((b) => (b.id === selectedBlockId ? updater(b) : b)));
      },
      getBlock(id) {
        return blocks.find((b) => b.id === id) ?? null;
      },
    }),
    [blocks, onChange, onSelectionChange, selectedBlockId, makeBlock]
  );

  // ── Page style with dynamic overrides ────────────────────────────────────
  const getFontFamilyForHTML = (pdfFont) => {
    const fontMap = {
      Helvetica: 'Arial, Helvetica, sans-serif',
      'Times-Roman': '"Times New Roman", Times, serif',
      Courier: '"Courier New", Courier, monospace',
    };
    return fontMap[pdfFont] || 'Arial, Helvetica, sans-serif';
  };

  const baseFontSize =
    styleOverrides.fontSize === 'small' ? 10 : styleOverrides.fontSize === 'large' ? 12 : 11;
  const pagePadding = styleOverrides.pagePadding || 40;
  const fontFamily = getFontFamilyForHTML(styleOverrides.fontFamily || 'Helvetica');
  const accentColor = styleOverrides.accentColor || '#374151';
  const usableHeight = A4_MIN_HEIGHT - pagePadding * 2; // dynamic usable height based on padding

  const pageStyle = {
    width: A4_WIDTH,
    minHeight: A4_MIN_HEIGHT,
    padding: `${pagePadding}px 50px`,
    fontFamily: fontFamily,
    fontSize: `${baseFontSize}px`,
    color: '#111',
    colorScheme: 'light',
    position: 'relative',
  };

  return (
    <>
      {/* ── Hidden measurement container ─────────────────────────────────── */}
      <div
        aria-hidden="true"
        ref={measureRef}
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: A4_WIDTH,
          padding: `${pagePadding}px 50px`,
          fontFamily: fontFamily,
          fontSize: `${baseFontSize}px`,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {blocks.map((block) => (
          <div key={block.id} data-mb={block.id}>
            <MeasureBlockRenderer block={block} accentColor={accentColor} />
          </div>
        ))}
      </div>

      {/* ── Visible paged canvas ───────────────────────────────────────── */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div
          className="doc-light flex flex-col items-center"
          style={{ gap: PAGE_GAP }}
          onClick={() => !isDragMode && onSelectionChange?.(null)} // click outside any block deselects
        >
          {blocksByPage.map((pageBlocks, pageIndex) => (
            <SortableContext
              key={pageIndex}
              items={pageBlocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div
                className="bg-white shadow-[0_1px_12px_rgba(0,0,0,0.12)] rounded-sm"
                style={pageStyle}
              >
                {/* Page N label */}
                {pageIndex > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -PAGE_GAP,
                      left: 0,
                      right: 0,
                      height: PAGE_GAP,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '0 16px',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ flex: 1, height: 1, background: '#9ca3af' }} />
                    <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                      Page {pageIndex + 1}
                    </span>
                    <div style={{ flex: 1, height: 1, background: '#9ca3af' }} />
                  </div>
                )}

                <PageBlocks
                  pageBlocks={pageBlocks}
                  allBlocks={blocks}
                  documentType={documentType}
                  jobId={jobId}
                  onBlockUpdate={updateBlock}
                  onSectionTitleChange={updateSectionTitle}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={(id) => onSelectionChange?.(id)}
                  sections={sections}
                  isDragMode={isDragMode}
                  accentColor={accentColor}
                />

                {/* Letter documents: add-block button at end of last page */}
                {documentType !== 'resume' &&
                  pageIndex === blocksByPage.length - 1 &&
                  !isDragMode && (
                    <InlineAddMenu
                      onAdd={(type) => {
                        const factory =
                          type === BLOCK_TYPES.TEXT ? createTextBlock : createBulletBlock;
                        onChange([...blocks, factory()]);
                      }}
                    />
                  )}
              </div>
            </SortableContext>
          ))}
        </div>
      </DndContext>
    </>
  );
});

export default DocumentCanvas;
