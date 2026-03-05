'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  Link2,
  X,
  PlusCircle,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  BLOCK_TYPES,
  BLOCK_TYPE_LABELS,
  createTextBlock,
  createBulletBlock,
  createSubheadingBlock,
  createSkillGroupBlock,
  createSpacerBlock,
  createSectionTitleBlock,
} from '@/lib/blockSchema';
import { ensureSlate, slateToText } from '@/lib/slateUtils';
import RichTextEditor from './RichTextEditor';

// ─── A4 page constants ─────────────────────────────────────────────────────

// A4 at 96 dpi in pixels
const A4_WIDTH = 794;
const A4_MIN_HEIGHT = 1123;
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

// ─── Inline block update helpers ─────────────────────────────────────────

function updateBlockInList(blocks, id, updater) {
  return blocks.map((b) => (b.id === id ? updater(b) : b));
}

// ─── Block renderers ───────────────────────────────────────────────────────

// Styles that mirror the ATS PDF template
const PAGE_STYLES = {
  name: 'text-2xl font-bold uppercase tracking-wide text-center',
  designation: 'text-sm text-gray-500 text-center mt-1',
  contactRow: 'flex flex-wrap justify-center gap-x-3 mt-1.5 text-xs text-gray-500',
  sectionTitle:
    'text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2 mt-1',
  subheadingPrimary: 'text-sm font-semibold',
  subheadingMeta: 'text-xs text-gray-500',
  text: 'text-sm text-gray-700 leading-relaxed',
  bullet: 'text-sm text-gray-700 leading-relaxed',
  skillLabel: 'text-xs font-semibold text-gray-600 mr-2',
  skillTags: 'text-xs text-gray-700',
};

// ─── DocHeader block renderer ─────────────────────────────────────────────

function DocHeaderBlock({ block, onChange }) {
  const { data } = block;
  const links = data.links || [];

  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mb-4 text-center space-y-1">
      <Input
        value={data.name || ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Full Name"
        className={cn(
          PAGE_STYLES.name,
          'border-0 bg-transparent text-center focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5'
        )}
        style={{ fontSize: '1.4rem' }}
      />
      <Input
        value={data.designation || ''}
        onChange={(e) => update({ designation: e.target.value })}
        placeholder="Job Title / Headline"
        className="border-0 bg-transparent text-center text-sm text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5"
      />

      {/* Contact links — structured rows */}
      <div className="mt-2 space-y-1">
        {links.map((lnk, i) => (
          <div key={i} className="flex items-center justify-center gap-1.5">
            <Input
              value={lnk.label || ''}
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...next[i], label: e.target.value };
                update({ links: next });
              }}
              placeholder="Label (e.g. LinkedIn)"
              className="h-6 text-xs w-28 border-dashed"
            />
            <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
            <Input
              value={lnk.url || ''}
              onChange={(e) => {
                const next = [...links];
                next[i] = { ...next[i], url: e.target.value };
                update({ links: next });
              }}
              placeholder="https://..."
              className="h-6 text-xs w-44 border-dashed"
            />
            <button
              type="button"
              onClick={() => {
                update({ links: links.filter((_, j) => j !== i) });
              }}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => update({ links: [...links, { label: '', url: '' }] })}
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mx-auto mt-1"
        >
          <PlusCircle className="w-3 h-3" />
          Add link
        </button>
      </div>
    </div>
  );
}

// ─── CL Header block ──────────────────────────────────────────────────────

function ClHeaderBlock({ block, onChange }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mb-4 space-y-1">
      <Input
        value={data.name || ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Your Full Name"
        className="border-0 bg-transparent font-semibold text-base focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5"
      />
      {['email', 'phone', 'location'].map((field) => (
        <Input
          key={field}
          value={data[field] || ''}
          onChange={(e) => update({ [field]: e.target.value })}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          className="border-0 bg-transparent text-xs text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5"
        />
      ))}
    </div>
  );
}

// ─── Subheading block ─────────────────────────────────────────────────────

function SubheadingBlock({ block, onChange }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mb-1.5 mt-2">
      <div className="flex items-start justify-between gap-2">
        <Input
          value={data.primary || ''}
          onChange={(e) => update({ primary: e.target.value })}
          placeholder="Role / Organisation"
          className="border-0 bg-transparent font-semibold text-[0.85rem] focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 flex-1 p-0"
        />
        <Input
          value={data.dateRange || ''}
          onChange={(e) => update({ dateRange: e.target.value })}
          placeholder="Date range"
          className="border-0 bg-transparent text-xs text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 w-50 text-right p-0"
        />
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={data.secondary || ''}
          onChange={(e) => update({ secondary: e.target.value })}
          placeholder="Department / Course"
          className="border-0 bg-transparent text-xs text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 flex-1 p-0"
        />
        <Input
          value={data.location || ''}
          onChange={(e) => update({ location: e.target.value })}
          placeholder="Location"
          className="border-0 bg-transparent text-xs text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 w-50 text-right p-0"
        />
      </div>
    </div>
  );
}

// ─── SkillGroup block ─────────────────────────────────────────────────────

function SkillGroupBlock({ block, onChange }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });
  const skillsStr = (data.skills || []).join(', ');

  return (
    <div className="flex items-baseline gap-2 mb-1">
      <Input
        value={data.label || ''}
        onChange={(e) => update({ label: e.target.value })}
        placeholder="Category"
        className="border-0 bg-transparent text-xs font-semibold text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 w-28 p-0 shrink-0"
      />
      <span className="text-xs text-gray-400 shrink-0">:</span>
      <Input
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
        className="border-0 bg-transparent text-xs text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 flex-1 p-0"
      />
    </div>
  );
}

// ─── Letter detail blocks (Date, Recipient, Salutation, Closing) ──────────

function SimpleTextBlock({ block, onChange, placeholder, className: cls }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <Input
      value={data.text || data.date || ''}
      onChange={(e) =>
        update(data.date !== undefined ? { date: e.target.value } : { text: e.target.value })
      }
      placeholder={placeholder}
      className={cn(
        'border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5 p-0',
        cls
      )}
    />
  );
}

function ClRecipientBlock({ block, onChange }) {
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
          className="border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0.5 p-0"
        />
      ))}
    </div>
  );
}

function ClClosingBlock({ block, onChange }) {
  const { data } = block;
  const update = (partial) => onChange({ ...block, data: { ...data, ...partial } });

  return (
    <div className="mt-4 space-y-0.5">
      <Input
        value={data.text || ''}
        onChange={(e) => update({ text: e.target.value })}
        placeholder="Sincerely,"
        className="border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 p-0"
      />
      <Input
        value={data.name || ''}
        onChange={(e) => update({ name: e.target.value })}
        placeholder="Your name"
        className="border-0 bg-transparent text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 p-0 mt-6"
      />
    </div>
  );
}

// ─── Block router ─────────────────────────────────────────────────────────

function BlockRenderer({ block, onChange, jobId }) {
  const handleRichChange = useCallback(
    (newSlate) => {
      const text = slateToText(newSlate);
      onChange({ ...block, data: { ...block.data, slateContent: newSlate, text } });
    },
    [block, onChange]
  );

  switch (block.type) {
    case BLOCK_TYPES.DOC_HEADER:
      return <DocHeaderBlock block={block} onChange={onChange} />;
    case BLOCK_TYPES.CL_HEADER:
      return <ClHeaderBlock block={block} onChange={onChange} />;
    case BLOCK_TYPES.TEXT:
      return (
        <RichTextEditor
          value={ensureSlate(block.data.slateContent ?? block.data.text)}
          onChange={handleRichChange}
          placeholder="Paragraph text…"
          className={PAGE_STYLES.text}
          jobId={jobId}
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
          />
        </div>
      );
    case BLOCK_TYPES.SUBHEADING:
      return <SubheadingBlock block={block} onChange={onChange} />;
    case BLOCK_TYPES.SKILL_GROUP:
      return <SkillGroupBlock block={block} onChange={onChange} />;
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
        />
      );
    case BLOCK_TYPES.CL_RECIPIENT:
      return <ClRecipientBlock block={block} onChange={onChange} />;
    case BLOCK_TYPES.CL_SALUTATION:
      return (
        <SimpleTextBlock
          block={block}
          onChange={onChange}
          placeholder="Dear Hiring Manager,"
          className="text-sm mb-2"
        />
      );
    case BLOCK_TYPES.CL_CLOSING:
      return <ClClosingBlock block={block} onChange={onChange} />;
    default:
      return null;
  }
}

// ─── "Add block" inline menu ─────────────────────────────────────────────

const SECTION_BLOCK_ADDITIONS = [
  { type: BLOCK_TYPES.SUBHEADING, label: 'Subheading (Role/Org)' },
  { type: BLOCK_TYPES.TEXT, label: 'Paragraph' },
  { type: BLOCK_TYPES.BULLET, label: 'Bullet Point' },
  { type: BLOCK_TYPES.SKILL_GROUP, label: 'Skill Group' },
  { type: BLOCK_TYPES.SPACER, label: 'Spacer' },
];

const LETTER_BLOCK_ADDITIONS = [
  { type: BLOCK_TYPES.TEXT, label: 'Paragraph' },
  { type: BLOCK_TYPES.BULLET, label: 'Bullet Point' },
];

function InlineAddMenu({ onAdd, documentType }) {
  const [open, setOpen] = useState(false);
  const items = documentType === 'resume' ? SECTION_BLOCK_ADDITIONS : LETTER_BLOCK_ADDITIONS;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1 py-1 text-xs text-muted-foreground hover:text-primary opacity-1 group-hover:opacity-100 transition-all hover:bg-muted/40 rounded"
      >
        <Plus className="w-3 h-3" />
        Add block
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-1 py-1 px-1 bg-muted/40 rounded mt-0.5">
      {items.map((item) => (
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

// ─── Section group (collapsible) ──────────────────────────────────────────

function SectionGroup({
  section,
  sectionIndex,
  totalSections,
  collapsed,
  onToggle,
  onTitleChange,
  onBlockUpdate,
  onBlockDelete,
  onBlockAdd,
  onMoveBlock,
  onMoveSection,
  onDeleteSection,
  documentType,
  jobId,
}) {
  const { titleBlock, children } = section;

  const createBlock = (type) => {
    switch (type) {
      case BLOCK_TYPES.SUBHEADING:
        return createSubheadingBlock();
      case BLOCK_TYPES.TEXT:
        return createTextBlock();
      case BLOCK_TYPES.BULLET:
        return createBulletBlock();
      case BLOCK_TYPES.SKILL_GROUP:
        return createSkillGroupBlock();
      case BLOCK_TYPES.SPACER:
        return createSpacerBlock();
      default:
        return createTextBlock();
    }
  };

  return (
    <div className="group/section mb-2">
      {/* Section title row */}
      <div className="flex items-center gap-1 group/title">
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title={collapsed ? 'Expand section' : 'Collapse section'}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <input
          value={titleBlock.data.title || ''}
          onChange={(e) => onTitleChange(titleBlock.id, e.target.value)}
          placeholder="SECTION TITLE"
          className={cn(
            PAGE_STYLES.sectionTitle,
            'flex-1 bg-transparent outline-none border-0 border-b border-gray-300 focus:border-primary py-0.5 transition-colors uppercase placeholder:text-gray-300'
          )}
        />

        {/* Section controls — visible on hover */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            disabled={sectionIndex === 0}
            onClick={() => onMoveSection(sectionIndex, 'up')}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <MoveUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={sectionIndex === totalSections - 1}
            onClick={() => onMoveSection(sectionIndex, 'down')}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <MoveDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSection(sectionIndex)}
            className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
            title="Delete section"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Children */}
      {!collapsed && (
        <div className="pl-4 space-y-px mt-1">
          {children.map((block, idx) => (
            <div key={block.id} className="group/block relative">
              {/* Block controls */}
              <div className="absolute -right-7 top-0 flex flex-col gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => onMoveBlock(block.id, 'up')}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  title="Move block up"
                >
                  <MoveUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={idx === children.length - 1}
                  onClick={() => onMoveBlock(block.id, 'down')}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                  title="Move block down"
                >
                  <MoveDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onBlockDelete(block.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete block"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              <BlockRenderer block={block} onChange={onBlockUpdate} jobId={jobId} />
            </div>
          ))}

          {/* Inline add menu */}
          <InlineAddMenu
            onAdd={(type) => onBlockAdd(section.titleBlock.id, createBlock(type))}
            documentType={documentType}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main DocumentCanvas ──────────────────────────────────────────────────

/**
 * A4 HTML canvas — renders the document as styled HTML with inline editing.
 *
 * Props:
 *   blocks         Block[]
 *   documentType   'resume' | 'coverLetter' | 'supportingStatement'
 *   onChange       (newBlocks: Block[]) => void
 *   jobId          optional, passed to AI refine per block
 */
export default function DocumentCanvas({ blocks, documentType, onChange, jobId }) {
  const [collapsedSections, setCollapsedSections] = useState({});
  // Maps section titleBlock.id → page index (0-based)
  const [sectionPageMap, setSectionPageMap] = useState({});
  const measureRef = useRef(null);

  const { preamble, sections } = computeSections(blocks);

  // ── Page-break measurement ──────────────────────────────────────────────
  useEffect(() => {
    if (!measureRef.current) return;

    const container = measureRef.current;
    const newMap = {};
    let page = 0;
    let used = 0; // height used on current page

    // Account for preamble height on page 0
    const preambleEl = container.querySelector('[data-measure="preamble"]');
    if (preambleEl) {
      used += preambleEl.offsetHeight;
    }

    for (const section of sections) {
      const el = container.querySelector(`[data-measure="${section.titleBlock.id}"]`);
      const h = el ? el.offsetHeight : 0;

      if (used + h > A4_USABLE_HEIGHT && used > 0) {
        page++;
        used = 0;
      }
      newMap[section.titleBlock.id] = page;
      used += h;
    }

    setSectionPageMap(newMap);
  }, [blocks]); // re-measure whenever blocks change

  // Derive pages: array of sections[] per page
  const totalPages =
    sections.length === 0 ? 1 : Math.max(1, Math.max(0, ...Object.values(sectionPageMap)) + 1);
  const sectionsByPage = Array.from({ length: totalPages }, (_, pageIdx) =>
    sections.filter((s) => (sectionPageMap[s.titleBlock.id] ?? 0) === pageIdx)
  );

  // ── Block mutation helpers ───────────────────────────────────────────────

  const updateBlock = useCallback(
    (updatedBlock) => {
      onChange(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
    },
    [blocks, onChange]
  );

  const deleteBlock = useCallback(
    (id) => {
      onChange(blocks.filter((b) => b.id !== id));
    },
    [blocks, onChange]
  );

  // Update a section-title block's text
  const updateSectionTitle = useCallback(
    (titleId, newTitle) => {
      onChange(
        blocks.map((b) => (b.id === titleId ? { ...b, data: { ...b.data, title: newTitle } } : b))
      );
    },
    [blocks, onChange]
  );

  // Add a new block after the given section's title (at end of that section's children)
  const addBlockToSection = useCallback(
    (sectionTitleId, newBlock) => {
      const flat = [];
      let insertAfterNext = false;
      for (const block of blocks) {
        flat.push(block);
        if (block.id === sectionTitleId) insertAfterNext = true;
      }

      // Find last block in that section
      const { sections: secs } = computeSections(blocks);
      const sec = secs.find((s) => s.titleBlock.id === sectionTitleId);
      const lastChild = sec?.children?.at(-1);

      if (lastChild) {
        const idx = blocks.findIndex((b) => b.id === lastChild.id);
        const next = [...blocks];
        next.splice(idx + 1, 0, newBlock);
        onChange(next);
      } else {
        // Empty section — insert right after title
        const idx = blocks.findIndex((b) => b.id === sectionTitleId);
        const next = [...blocks];
        next.splice(idx + 1, 0, newBlock);
        onChange(next);
      }
    },
    [blocks, onChange]
  );

  // Move a block up or down within its section
  const moveBlock = useCallback(
    (blockId, direction) => {
      const { preamble: pre, sections: secs } = computeSections(blocks);
      const newSecs = secs.map((sec) => {
        const idx = sec.children.findIndex((b) => b.id === blockId);
        if (idx === -1) return sec;
        const to = direction === 'up' ? idx - 1 : idx + 1;
        if (to < 0 || to >= sec.children.length) return sec;
        return { ...sec, children: arrayMove(sec.children, idx, to) };
      });
      onChange(flattenSections({ preamble: pre, sections: newSecs }));
    },
    [blocks, onChange]
  );

  // Move section up or down
  const moveSectionInList = useCallback(
    (sectionIndex, direction) => {
      const { preamble: pre, sections: secs } = computeSections(blocks);
      const newSecs = [...secs];
      const to = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
      if (to < 0 || to >= newSecs.length) return;
      const swapped = arrayMove(newSecs, sectionIndex, to);
      onChange(flattenSections({ preamble: pre, sections: swapped }));
    },
    [blocks, onChange]
  );

  // Delete an entire section (title + children)
  const deleteSection = useCallback(
    (sectionIndex) => {
      const { preamble: pre, sections: secs } = computeSections(blocks);
      const newSecs = secs.filter((_, i) => i !== sectionIndex);
      onChange(flattenSections({ preamble: pre, sections: newSecs }));
    },
    [blocks, onChange]
  );

  const toggleSection = (id) => setCollapsedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Shared page styles ──────────────────────────────────────────────────
  const pageStyle = {
    width: A4_WIDTH,
    minHeight: A4_MIN_HEIGHT,
    padding: `${A4_PADDING_V}px 50px`,
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 11,
    color: '#111',
    colorScheme: 'light',
    position: 'relative',
  };

  return (
    <>
      {/* ── Hidden measurement container ─────────────────────────────── */}
      {/* Invisible but laid-out so offsetHeight is accurate */}
      <div
        aria-hidden="true"
        ref={measureRef}
        style={{
          ...pageStyle,
          position: 'absolute',
          top: 0,
          left: '-9999px',
          visibility: 'hidden',
          pointerEvents: 'none',
          minHeight: 0,
        }}
      >
        <div data-measure="preamble">
          {preamble.map((block) => (
            <BlockRenderer key={block.id} block={block} onChange={() => {}} jobId={jobId} />
          ))}
        </div>
        {sections.map((section) => (
          <div key={section.titleBlock.id} data-measure={section.titleBlock.id}>
            <SectionGroup
              section={section}
              sectionIndex={0}
              totalSections={1}
              collapsed={false}
              onToggle={() => {}}
              onTitleChange={() => {}}
              onBlockUpdate={() => {}}
              onBlockDelete={() => {}}
              onBlockAdd={() => {}}
              onMoveBlock={() => {}}
              onMoveSection={() => {}}
              onDeleteSection={() => {}}
              documentType={documentType}
              jobId={jobId}
            />
          </div>
        ))}
      </div>

      {/* ── Visible paged canvas ─────────────────────────────────────── */}
      <div className="doc-light flex flex-col items-center" style={{ gap: PAGE_GAP }}>
        {sectionsByPage.map((pageSections, pageIndex) => (
          <div
            key={pageIndex}
            className="bg-white shadow-[0_1px_12px_rgba(0,0,0,0.12)] rounded-sm"
            style={pageStyle}
          >
            {/* Page label (page 2+) */}
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
                  gap: '12px',
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

            {/* Preamble only on page 0 */}
            {pageIndex === 0 &&
              preamble.map((block) => (
                <BlockRenderer key={block.id} block={block} onChange={updateBlock} jobId={jobId} />
              ))}

            {/* Sections assigned to this page */}
            {pageSections.map((section) => {
              const idx = sections.indexOf(section);
              return (
                <SectionGroup
                  key={section.titleBlock.id}
                  section={section}
                  sectionIndex={idx}
                  totalSections={sections.length}
                  collapsed={!!collapsedSections[section.titleBlock.id]}
                  onToggle={() => toggleSection(section.titleBlock.id)}
                  onTitleChange={updateSectionTitle}
                  onBlockUpdate={updateBlock}
                  onBlockDelete={deleteBlock}
                  onBlockAdd={addBlockToSection}
                  onMoveBlock={moveBlock}
                  onMoveSection={moveSectionInList}
                  onDeleteSection={deleteSection}
                  documentType={documentType}
                  jobId={jobId}
                />
              );
            })}

            {/* ── Add section (resume, last page only) */}
            {documentType === 'resume' && pageIndex === sectionsByPage.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  const newSection = createSectionTitleBlock('NEW SECTION');
                  onChange([...blocks, newSection]);
                }}
                className="mt-4 w-full text-xs text-muted-foreground border border-dashed border-gray-300 rounded py-1.5 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add section
              </button>
            )}

            {/* ── Letter add blocks (last page only) */}
            {documentType !== 'resume' && pageIndex === sectionsByPage.length - 1 && (
              <InlineAddMenu
                onAdd={(type) => {
                  const factory = type === BLOCK_TYPES.TEXT ? createTextBlock : createBulletBlock;
                  onChange([...blocks, factory()]);
                }}
                documentType={documentType}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
