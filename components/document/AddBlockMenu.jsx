'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { BLOCK_TYPES, getAllowedBlockTypes } from '@/lib/blockSchema';

const BLOCK_LABELS = {
  [BLOCK_TYPES.DOC_HEADER]: 'Header (Name & Contact)',
  [BLOCK_TYPES.SECTION_TITLE]: 'Section Title',
  [BLOCK_TYPES.SUBHEADING]: 'Subheading (Role / Dates)',
  [BLOCK_TYPES.TEXT]: 'Text Paragraph',
  [BLOCK_TYPES.BULLET]: 'Bullet Point',
  [BLOCK_TYPES.SKILL_GROUP]: 'Skill Group',
  [BLOCK_TYPES.SPACER]: 'Spacer',
  [BLOCK_TYPES.CL_HEADER]: 'Letter Header',
  [BLOCK_TYPES.CL_DATE]: 'Date Line',
  [BLOCK_TYPES.CL_RECIPIENT]: 'Recipient Address',
  [BLOCK_TYPES.CL_SALUTATION]: 'Salutation',
  [BLOCK_TYPES.CL_CLOSING]: 'Closing',
};

const BLOCK_GROUPS = {
  resume: [
    {
      label: 'Structure',
      types: [BLOCK_TYPES.DOC_HEADER, BLOCK_TYPES.SECTION_TITLE, BLOCK_TYPES.SPACER],
    },
    {
      label: 'Content',
      types: [
        BLOCK_TYPES.SUBHEADING,
        BLOCK_TYPES.TEXT,
        BLOCK_TYPES.BULLET,
        BLOCK_TYPES.SKILL_GROUP,
      ],
    },
  ],
  coverLetter: [
    {
      label: 'Letter Structure',
      types: [
        BLOCK_TYPES.CL_HEADER,
        BLOCK_TYPES.CL_DATE,
        BLOCK_TYPES.CL_RECIPIENT,
        BLOCK_TYPES.CL_SALUTATION,
        BLOCK_TYPES.CL_CLOSING,
      ],
    },
    { label: 'Content', types: [BLOCK_TYPES.TEXT, BLOCK_TYPES.BULLET, BLOCK_TYPES.SPACER] },
  ],
  supportingStatement: [
    {
      label: 'Structure',
      types: [BLOCK_TYPES.SECTION_TITLE, BLOCK_TYPES.SPACER],
    },
    { label: 'Content', types: [BLOCK_TYPES.TEXT, BLOCK_TYPES.BULLET] },
  ],
};

export default function AddBlockMenu({ documentType, onAdd, afterBlockId, size = 'sm' }) {
  const allowed = getAllowedBlockTypes(documentType);
  const groups = BLOCK_GROUPS[documentType] || BLOCK_GROUPS.resume;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={size} className="h-6 px-2 text-muted-foreground">
          <Plus className="w-3 h-3 mr-1" />
          Add block
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start" className="w-52">
        {groups.map((group, i) => (
          <div key={group.label}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {group.label}
            </DropdownMenuLabel>
            {group.types
              .filter((t) => allowed.has(t))
              .map((type) => (
                <DropdownMenuItem
                  key={type}
                  onSelect={() => onAdd(type, afterBlockId)}
                  className="text-sm cursor-pointer"
                >
                  {BLOCK_LABELS[type]}
                </DropdownMenuItem>
              ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
