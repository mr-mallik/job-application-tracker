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

export default function PDFPreviewPanel({ blocks, template, styleOverrides = {} }) {
  const TemplateComponent = TEMPLATE_MAP[template] || ATSResumeTemplate;

  // Convert fontSize preset to actual baseFontSize value
  const getBaseFontSize = (template, fontSize = 'medium') => {
    const baseValues = {
      ats: 14,
      modern: 11,
      creative: 10,
      formal: 11,
    };
    const base = baseValues[template] || 11;
    const scales = { small: 0.9, medium: 1.0, large: 1.1 };
    const scale = scales[fontSize] || 1.0;
    return Math.round(base * scale);
  };

  // Only pass defined values to avoid overriding template defaults with undefined
  const computedStyleOverrides = {};
  if (styleOverrides.accentColor) {
    computedStyleOverrides.accentColor = styleOverrides.accentColor;
  }
  if (styleOverrides.pagePadding) {
    computedStyleOverrides.pagePadding = styleOverrides.pagePadding;
  }
  if (styleOverrides.fontSize) {
    computedStyleOverrides.baseFontSize = getBaseFontSize(template, styleOverrides.fontSize);
  }
  if (styleOverrides.fontFamily) {
    computedStyleOverrides.fontFamily = styleOverrides.fontFamily;
  }

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
          <TemplateComponent blocks={blocks} styleOverrides={computedStyleOverrides} />
        </PDFViewer>
      </div>
    </div>
  );
}
