'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Download, RefreshCw, Circle } from 'lucide-react';

// Direct imports required — dynamic() wrappers break @react-pdf/renderer's renderer
import ATSResumeTemplate from '@/components/pdf-templates/ATSResumeTemplate';
import ModernResumeTemplate from '@/components/pdf-templates/ModernResumeTemplate';
import CreativeResumeTemplate from '@/components/pdf-templates/CreativeResumeTemplate';
import CoverLetterTemplate from '@/components/pdf-templates/CoverLetterTemplate';

// PDF download link must be dynamic (uses browser-only Blob APIs)
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false }
);

const TEMPLATE_MAP = {
  ats: ATSResumeTemplate,
  modern: ModernResumeTemplate,
  creative: CreativeResumeTemplate,
  formal: CoverLetterTemplate,
};

const TEMPLATES_BY_TYPE = {
  resume: [
    { value: 'ats', label: 'ATS Clean' },
    { value: 'modern', label: 'Modern' },
    { value: 'creative', label: 'Creative' },
  ],
  coverLetter: [{ value: 'formal', label: 'Formal' }],
  supportingStatement: [{ value: 'formal', label: 'Formal' }],
};

export default function DocumentToolbar({
  title,
  documentType,
  template,
  blocks,
  isSaving,
  isDirty,
  onTitleChange,
  onTemplateChange,
  onSave,
  aiRefineSlot,
}) {
  const TemplateComponent = TEMPLATE_MAP[template] || ATSResumeTemplate;
  const templates = TEMPLATES_BY_TYPE[documentType] || TEMPLATES_BY_TYPE.resume;
  const fileName = `${title.replace(/\s+/g, '_') || 'document'}.pdf`;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      {/* Back */}
      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" asChild>
        <Link href="/document">
          <ArrowLeft className="w-4 h-4" />
        </Link>
      </Button>

      <div className="w-px h-5 bg-border mx-1" />

      {/* Title */}
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="h-8 max-w-xs text-sm font-medium border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1"
        placeholder="Document title…"
      />

      {/* Unsaved indicator */}
      {isDirty && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Circle className="w-2 h-2 fill-amber-400 text-amber-400" />
          Unsaved
        </span>
      )}

      <div className="flex-1" />

      {/* Template selector */}
      {templates.length > 1 && (
        <Select value={template} onValueChange={onTemplateChange}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* AI refine button slot */}
      {aiRefineSlot}

      {/* Save */}
      <Button
        size="sm"
        variant={isDirty ? 'default' : 'outline'}
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
        ) : (
          <Save className="w-3 h-3 mr-2" />
        )}
        {isSaving ? 'Saving…' : 'Save'}
      </Button>

      {/* Download PDF */}
      <PDFDownloadLink document={<TemplateComponent blocks={blocks} />} fileName={fileName}>
        {({ loading }) => (
          <Button size="sm" variant="outline" disabled={loading}>
            {loading ? (
              <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Download className="w-3 h-3 mr-2" />
            )}
            PDF
          </Button>
        )}
      </PDFDownloadLink>
    </div>
  );
}
