'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import BlockWrapper from './BlockWrapper';
import AddBlockMenu from './AddBlockMenu';
import {
  createDocHeaderBlock,
  createSectionTitleBlock,
  createSubheadingBlock,
  createTextBlock,
  createBulletBlock,
  createSkillGroupBlock,
  createSpacerBlock,
  createClHeaderBlock,
  createClDateBlock,
  createClRecipientBlock,
  createClSalutationBlock,
  createClClosingBlock,
  BLOCK_TYPES,
} from '@/lib/blockSchema';

const FACTORY_MAP = {
  [BLOCK_TYPES.DOC_HEADER]: createDocHeaderBlock,
  [BLOCK_TYPES.SECTION_TITLE]: createSectionTitleBlock,
  [BLOCK_TYPES.SUBHEADING]: createSubheadingBlock,
  [BLOCK_TYPES.TEXT]: createTextBlock,
  [BLOCK_TYPES.BULLET]: createBulletBlock,
  [BLOCK_TYPES.SKILL_GROUP]: createSkillGroupBlock,
  [BLOCK_TYPES.SPACER]: createSpacerBlock,
  [BLOCK_TYPES.CL_HEADER]: createClHeaderBlock,
  [BLOCK_TYPES.CL_DATE]: createClDateBlock,
  [BLOCK_TYPES.CL_RECIPIENT]: createClRecipientBlock,
  [BLOCK_TYPES.CL_SALUTATION]: createClSalutationBlock,
  [BLOCK_TYPES.CL_CLOSING]: createClClosingBlock,
};

export default function BlockCanvas({ blocks, documentType, onChange }) {
  const [selectedId, setSelectedId] = useState(null);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Block mutation helpers ────────────────────────────────────────────────

  const updateBlock = (updatedBlock) => {
    onChange(blocks.map((b) => (b.id === updatedBlock.id ? updatedBlock : b)));
  };

  const deleteBlock = (id) => {
    onChange(blocks.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveBlock = (id, direction) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (direction === 'up' && idx > 0) {
      onChange(arrayMove(blocks, idx, idx - 1));
    } else if (direction === 'down' && idx < blocks.length - 1) {
      onChange(arrayMove(blocks, idx, idx + 1));
    }
  };

  const addBlock = (type, afterId) => {
    const factory = FACTORY_MAP[type];
    if (!factory) return;
    const newBlock = factory();

    if (!afterId) {
      // Add at bottom
      onChange([...blocks, newBlock]);
    } else {
      const idx = blocks.findIndex((b) => b.id === afterId);
      const updated = [...blocks];
      updated.splice(idx + 1, 0, newBlock);
      onChange(updated);
    }
    setSelectedId(newBlock.id);
  };

  // ── DnD handlers ─────────────────────────────────────────────────────────

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    onChange(arrayMove(blocks, from, to));
  };

  const activeBlock = activeId ? blocks.find((b) => b.id === activeId) : null;

  return (
    <div className="space-y-2">
      {blocks.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
          No blocks yet. Use the button below to add content.
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block, index) => (
            <BlockWrapper
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              documentType={documentType}
              isSelected={selectedId === block.id}
              onSelect={setSelectedId}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
              onMove={moveBlock}
              onAddAfter={addBlock}
            />
          ))}
        </SortableContext>

        {/* Drag ghost overlay */}
        <DragOverlay>
          {activeBlock && (
            <div className="rounded-lg border border-primary bg-card shadow-xl px-3 py-2 text-sm opacity-90">
              {activeBlock.type}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Add block at bottom */}
      <div className="flex justify-center pt-2">
        <AddBlockMenu documentType={documentType} onAdd={(type) => addBlock(type, null)} />
      </div>
    </div>
  );
}
