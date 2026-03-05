'use client';

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Link2, X, PlusCircle } from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  BLOCK_TYPES,
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
    // SECTION_TITLE used by the measurement container only
    case BLOCK_TYPES.SECTION_TITLE:
      return (
        <div className={cn(PAGE_STYLES.sectionTitle, 'uppercase')}>
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
}) {
  return (
    <>
      {pageBlocks.map((block) => {
        const isSelected = block.id === selectedBlockId;

        // ── Section title block ────────────────────────────────────────────
        if (block.type === BLOCK_TYPES.SECTION_TITLE) {
          return (
            <div
              key={block.id}
              className={cn(
                'mt-1 rounded-sm transition-all cursor-pointer',
                isSelected && 'ring-2 ring-blue-400 ring-offset-1'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onSelectBlock(block.id);
              }}
            >
              <input
                value={block.data.title || ''}
                onChange={(e) => onSectionTitleChange(block.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder="SECTION TITLE"
                className={cn(
                  PAGE_STYLES.sectionTitle,
                  'w-full bg-transparent outline-none border-0 border-b border-gray-300 focus:border-primary py-0.5 transition-colors uppercase placeholder:text-gray-300'
                )}
              />
            </div>
          );
        }

        // ── Regular content block ──────────────────────────────────────────
        return (
          <div
            key={block.id}
            className={cn(
              'rounded-sm transition-all cursor-pointer',
              isSelected && 'ring-2 ring-blue-400 ring-offset-1'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBlock(block.id);
            }}
          >
            <BlockRenderer block={block} onChange={onBlockUpdate} jobId={jobId} />
          </div>
        );
      })}
    </>
  );
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
  { blocks, documentType, onChange, jobId, selectedBlockId, onSelectionChange },
  ref
) {
  const [blockPageMap, setBlockPageMap] = useState({});
  const [measured, setMeasured] = useState(false);
  const measureRef = useRef(null);

  const { preamble, sections } = computeSections(blocks);

  // ── Per-block measurement ────────────────────────────────────────────────
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

      if (used + h > A4_USABLE_HEIGHT && used > 0) {
        page++;
        used = 0;
      }
      newMap[el.dataset.mb] = page;
      used += h;
    }

    setBlockPageMap(newMap);
    setMeasured(true);
  }); // no dep-array — re-measure every render

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
  const makeBlock = useCallback((type) => {
    switch (type) {
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
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      addBlock(type, afterId) {
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

  // ── Page style ────────────────────────────────────────────────────────
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
      {/* ── Hidden measurement container ─────────────────────────────────── */}
      <div
        aria-hidden="true"
        ref={measureRef}
        style={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: A4_WIDTH,
          padding: `${A4_PADDING_V}px 50px`,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 11,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      >
        {blocks.map((block) => (
          <div key={block.id} data-mb={block.id}>
            <BlockRenderer block={block} onChange={() => {}} jobId={null} />
          </div>
        ))}
      </div>

      {/* ── Visible paged canvas ───────────────────────────────────────── */}
      <div
        className="doc-light flex flex-col items-center"
        style={{ gap: PAGE_GAP }}
        onClick={() => onSelectionChange?.(null)} // click outside any block deselects
      >
        {blocksByPage.map((pageBlocks, pageIndex) => (
          <div
            key={pageIndex}
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
            />

            {/* Letter documents: add-block button at end of last page */}
            {documentType !== 'resume' && pageIndex === blocksByPage.length - 1 && (
              <InlineAddMenu
                onAdd={(type) => {
                  const factory = type === BLOCK_TYPES.TEXT ? createTextBlock : createBulletBlock;
                  onChange([...blocks, factory()]);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </>
  );
});

export default DocumentCanvas;
