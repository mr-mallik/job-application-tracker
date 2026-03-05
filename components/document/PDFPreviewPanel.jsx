'use client';

import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

// Direct imports required — dynamic() wrappers break @react-pdf/renderer's internal renderer
import ATSResumeTemplate from '@/components/pdf-templates/ATSResumeTemplate';
import ModernResumeTemplate from '@/components/pdf-templates/ModernResumeTemplate';
import CreativeResumeTemplate from '@/components/pdf-templates/CreativeResumeTemplate';
import CoverLetterTemplate from '@/components/pdf-templates/CoverLetterTemplate';

// PDFViewer itself must be dynamic (uses browser-only APIs)
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => <PDFLoadingSpinner />,
});

const TEMPLATE_MAP = {
  ats: ATSResumeTemplate,
  modern: ModernResumeTemplate,
  creative: CreativeResumeTemplate,
  formal: CoverLetterTemplate,
};

function PDFLoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
      <RefreshCw className="w-6 h-6 animate-spin" />
      <p className="text-sm">Rendering PDF…</p>
    </div>
  );
}

export default function PDFPreviewPanel({ blocks, template }) {
  const TemplateComponent = TEMPLATE_MAP[template] || ATSResumeTemplate;

  // Stable key prevents full remount on every keystroke — only remount on template change
  const viewerKey = template;

  return (
    <div className="h-full w-full bg-muted/20 flex flex-col">
      <div className="flex-1 overflow-hidden">
        <PDFViewer
          key={viewerKey}
          width="100%"
          height="100%"
          showToolbar={false}
          style={{ border: 'none' }}
        >
          <TemplateComponent blocks={blocks} />
        </PDFViewer>
      </div>
    </div>
  );
}
