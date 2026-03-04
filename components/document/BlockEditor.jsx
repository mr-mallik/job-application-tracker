'use client';

import { BLOCK_TYPES } from '@/lib/blockSchema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

// Helper: simple two-column row for a label + input
function FieldRow({ label, children }) {
  return (
    <div className="flex items-start gap-2">
      <Label className="w-24 shrink-0 pt-2 text-xs text-muted-foreground">{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ── Per-type editors ────────────────────────────────────────────────────────

function DocHeaderEditor({ data, onChange }) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Full Name"
        value={data.name || ''}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        className="font-semibold text-base"
      />
      <Input
        placeholder="Job Title / Headline"
        value={data.designation || ''}
        onChange={(e) => onChange({ ...data, designation: e.target.value })}
      />
      <Textarea
        placeholder="Contact lines (one per line): email · phone · location · linkedin"
        value={(data.contact || []).join('\n')}
        onChange={(e) =>
          onChange({
            ...data,
            contact: e.target.value.split('\n'),
          })
        }
        rows={2}
        className="text-sm resize-none"
      />
    </div>
  );
}

function SectionTitleEditor({ data, onChange }) {
  return (
    <Input
      placeholder="Section Title (e.g. Work Experience)"
      value={data.title || ''}
      onChange={(e) => onChange({ ...data, title: e.target.value })}
      className="font-semibold uppercase tracking-wide"
    />
  );
}

function SubheadingEditor({ data, onChange }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Role / Degree / Project"
          value={data.left || ''}
          onChange={(e) => onChange({ ...data, left: e.target.value })}
        />
        <Input
          placeholder="Company / Institution"
          value={data.right || ''}
          onChange={(e) => onChange({ ...data, right: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Start date (e.g. Jan 2022)"
          value={data.dateStart || ''}
          onChange={(e) => onChange({ ...data, dateStart: e.target.value })}
        />
        <Input
          placeholder="End date (e.g. Present)"
          value={data.dateEnd || ''}
          onChange={(e) => onChange({ ...data, dateEnd: e.target.value })}
        />
      </div>
      {data.meta !== undefined && (
        <Input
          placeholder="Location (optional)"
          value={data.meta || ''}
          onChange={(e) => onChange({ ...data, meta: e.target.value })}
        />
      )}
    </div>
  );
}

function TextEditor({ data, onChange }) {
  return (
    <Textarea
      placeholder="Type your paragraph here…"
      value={data.text || ''}
      onChange={(e) => onChange({ ...data, text: e.target.value })}
      rows={3}
      className="resize-none text-sm"
    />
  );
}

function BulletEditor({ data, onChange }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-2 text-muted-foreground select-none">•</span>
      <Textarea
        placeholder="Bullet point text…"
        value={data.text || ''}
        onChange={(e) => onChange({ ...data, text: e.target.value })}
        rows={2}
        className="resize-none text-sm flex-1"
      />
    </div>
  );
}

function SkillGroupEditor({ data, onChange }) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Category (e.g. Languages)"
        value={data.category || ''}
        onChange={(e) => onChange({ ...data, category: e.target.value })}
        className="font-medium"
      />
      <Input
        placeholder="Skills, comma-separated (e.g. JavaScript, Python, Go)"
        value={(data.skills || []).join(', ')}
        onChange={(e) =>
          onChange({
            ...data,
            skills: e.target.value
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
      />
    </div>
  );
}

function SpacerEditor({ data, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <Label className="text-xs text-muted-foreground">Height (pt)</Label>
      <Input
        type="number"
        min={2}
        max={40}
        value={data.height || 6}
        onChange={(e) => onChange({ ...data, height: Number(e.target.value) })}
        className="w-20"
      />
      <div
        className="flex-1 border-t border-dashed border-muted-foreground/30"
        style={{ height: 1 }}
      />
    </div>
  );
}

function ClHeaderEditor({ data, onChange }) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Sender Name"
        value={data.name || ''}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        className="font-semibold"
      />
      <Textarea
        placeholder="Sender address/contact (one per line)"
        value={(data.lines || []).join('\n')}
        onChange={(e) => onChange({ ...data, lines: e.target.value.split('\n') })}
        rows={3}
        className="text-sm resize-none"
      />
    </div>
  );
}

function ClDateEditor({ data, onChange }) {
  return (
    <Input
      placeholder="Date (e.g. 12 May 2025)"
      value={data.date || ''}
      onChange={(e) => onChange({ ...data, date: e.target.value })}
    />
  );
}

function ClRecipientEditor({ data, onChange }) {
  return (
    <Textarea
      placeholder="Recipient name & address (one line per row)"
      value={(data.lines || []).join('\n')}
      onChange={(e) => onChange({ ...data, lines: e.target.value.split('\n') })}
      rows={4}
      className="text-sm resize-none"
    />
  );
}

function ClSalutationEditor({ data, onChange }) {
  return (
    <Input
      placeholder="e.g. Dear Hiring Manager,"
      value={data.text || ''}
      onChange={(e) => onChange({ ...data, text: e.target.value })}
    />
  );
}

function ClClosingEditor({ data, onChange }) {
  return (
    <div className="space-y-2">
      <Input
        placeholder="Closing phrase (e.g. Yours sincerely,)"
        value={data.closing || ''}
        onChange={(e) => onChange({ ...data, closing: e.target.value })}
      />
      <Input
        placeholder="Signature name"
        value={data.name || ''}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
      />
    </div>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────

const EDITORS = {
  [BLOCK_TYPES.DOC_HEADER]: DocHeaderEditor,
  [BLOCK_TYPES.SECTION_TITLE]: SectionTitleEditor,
  [BLOCK_TYPES.SUBHEADING]: SubheadingEditor,
  [BLOCK_TYPES.TEXT]: TextEditor,
  [BLOCK_TYPES.BULLET]: BulletEditor,
  [BLOCK_TYPES.SKILL_GROUP]: SkillGroupEditor,
  [BLOCK_TYPES.SPACER]: SpacerEditor,
  [BLOCK_TYPES.CL_HEADER]: ClHeaderEditor,
  [BLOCK_TYPES.CL_DATE]: ClDateEditor,
  [BLOCK_TYPES.CL_RECIPIENT]: ClRecipientEditor,
  [BLOCK_TYPES.CL_SALUTATION]: ClSalutationEditor,
  [BLOCK_TYPES.CL_CLOSING]: ClClosingEditor,
};

export default function BlockEditor({ block, onChange }) {
  const Editor = EDITORS[block.type];
  if (!Editor) {
    return <p className="text-xs text-muted-foreground italic">Unknown block type: {block.type}</p>;
  }
  return <Editor data={block.data} onChange={(newData) => onChange({ ...block, data: newData })} />;
}
