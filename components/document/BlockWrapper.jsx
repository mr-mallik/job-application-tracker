'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BlockEditor from './BlockEditor';
import AddBlockMenu from './AddBlockMenu';

const TYPE_LABELS = {
  'doc-header': 'Header',
  'section-title': 'Section Title',
  subheading: 'Subheading',
  text: 'Paragraph',
  bullet: 'Bullet',
  'skill-group': 'Skills',
  spacer: 'Spacer',
  'cl-header': 'Letter Header',
  'cl-date': 'Date',
  'cl-recipient': 'Recipient',
  'cl-salutation': 'Salutation',
  'cl-closing': 'Closing',
};

export default function BlockWrapper({
  block,
  index,
  total,
  documentType,
  onUpdate,
  onDelete,
  onMove,
  onAddAfter,
  isSelected,
  onSelect,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded-lg border bg-card transition-all',
        isSelected
          ? 'border-primary shadow-sm ring-1 ring-primary/20'
          : 'border-border hover:border-primary/40',
        isDragging && 'shadow-xl'
      )}
      onClick={() => onSelect(block.id)}
    >
      {/* Top label bar */}
      <div className="flex items-center justify-between px-3 py-1 border-b bg-muted/30 rounded-t-lg">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {TYPE_LABELS[block.type] || block.type}
        </span>
        <div className="flex items-center gap-0.5">
          {/* Move up/down (fallback when not dragging) */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={index === 0}
            onClick={(e) => {
              e.stopPropagation();
              onMove(block.id, 'up');
            }}
          >
            <ChevronUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={index === total - 1}
            onClick={(e) => {
              e.stopPropagation();
              onMove(block.id, 'down');
            }}
          >
            <ChevronDown className="w-3 h-3" />
          </Button>

          {/* Drag handle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-3 h-3" />
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Block editor */}
      <div className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
        <BlockEditor block={block} onChange={onUpdate} />
      </div>

      {/* Add block below — shown on hover */}
      <div className="flex justify-center pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <AddBlockMenu documentType={documentType} afterBlockId={block.id} onAdd={onAddAfter} />
      </div>
    </div>
  );
}
