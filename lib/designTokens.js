/**
 * Design Tokens — shared visual constants consumed by:
 *   1. The HTML block editor CSS (Tailwind classes / inline styles)
 *   2. @react-pdf/renderer StyleSheet.create() in PDF templates
 *
 * Keeping tokens here ensures the editor HTML preview and the downloaded
 * PDF remain visually in sync. Never hardcode colours or font sizes in
 * individual block components or PDF templates — always reference these.
 */

export const DESIGN_TOKENS = {
  // ── ATS-Friendly template ───────────────────────────────────────────
  ats: {
    // Colours
    primaryColor: '#111827',
    accentColor: '#374151',
    textColor: '#374151',
    mutedColor: '#6B7280',
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    sectionTitleColor: '#111827',

    // Typography (pt — maps directly to @react-pdf/renderer fontSize)
    fontSizeBase: 10,
    fontSizeSmall: 9,
    fontSizeHeading: 13,
    fontSizeName: 24,
    fontSizeDesignation: 10,

    // Spacing (pt)
    pagePaddingH: 30,
    pagePaddingV: 30,
    sectionGap: 16,
    itemGap: 10,
    bulletIndent: 15,
    lineHeight: 1.3,

    // Section title style
    sectionTitleUppercase: true,
    sectionTitleBorderBottom: true,
    sectionTitleLetterSpacing: 0.7,
  },

  // ── Modern Professional template ────────────────────────────────────
  modern: {
    primaryColor: '#1F2937',
    accentColor: '#2563EB',
    textColor: '#4B5563',
    mutedColor: '#6B7280',
    borderColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    sectionTitleColor: '#2563EB',

    fontSizeBase: 10,
    fontSizeSmall: 9,
    fontSizeHeading: 14,
    fontSizeName: 26,
    fontSizeDesignation: 14,

    pagePaddingH: 40,
    pagePaddingV: 40,
    sectionGap: 18,
    itemGap: 12,
    bulletIndent: 15,
    lineHeight: 1.4,

    sectionTitleUppercase: true,
    sectionTitleBorderBottom: false,
    sectionTitleLetterSpacing: 0.5,

    // Modern-specific
    skillBadgeBackground: '#EFF6FF',
    skillBadgeColor: '#1E40AF',
  },

  // ── Creative Two-Column template ────────────────────────────────────
  creative: {
    primaryColor: '#1F2937',
    accentColor: '#2563EB',
    textColor: '#4B5563',
    mutedColor: '#6B7280',
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    sectionTitleColor: '#1E3A8A',

    // Left column (dark)
    leftColumnBackground: '#1E3A8A',
    leftColumnText: '#FFFFFF',
    leftColumnMuted: '#DBEAFE',
    leftColumnAccent: '#93C5FD',
    leftColumnBorder: '#3B82F6',

    fontSizeBase: 10,
    fontSizeSmall: 9,
    fontSizeHeading: 14,
    fontSizeName: 22,
    fontSizeDesignation: 12,

    pagePaddingH: 30,
    pagePaddingV: 30,
    sectionGap: 18,
    itemGap: 14,
    bulletIndent: 15,
    lineHeight: 1.4,

    sectionTitleUppercase: false,
    sectionTitleBorderBottom: true,
    sectionTitleLetterSpacing: 0,

    // Column widths (percentage, no % symbol — used in PDF flexbox)
    leftColumnWidth: '35%',
    rightColumnWidth: '65%',
  },

  // ── Formal (Cover Letter / Supporting Statement) ────────────────────
  formal: {
    primaryColor: '#1F2937',
    accentColor: '#2563EB',
    textColor: '#374151',
    mutedColor: '#6B7280',
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    sectionTitleColor: '#1F2937',

    fontSizeBase: 11,
    fontSizeSmall: 9,
    fontSizeHeading: 14,
    fontSizeName: 18,
    fontSizeDesignation: 11,

    pagePaddingH: 60,
    pagePaddingV: 60,
    sectionGap: 16,
    itemGap: 12,
    bulletIndent: 20,
    lineHeight: 1.6,

    sectionTitleUppercase: false,
    sectionTitleBorderBottom: false,
    sectionTitleLetterSpacing: 0,
  },
};

/**
 * Get design tokens for a given template ID.
 * Falls back to 'ats' for unknown template IDs.
 */
export function getTokens(templateId) {
  return DESIGN_TOKENS[templateId] ?? DESIGN_TOKENS.ats;
}

/**
 * Map token values to Tailwind-compatible inline styles for the HTML
 * block editor canvas. The PDF templates use the raw token numbers
 * directly via @react-pdf StyleSheet.
 *
 * Converts pt → approximate px for screen rendering (1pt ≈ 1.333px).
 */
export function getEditorStyles(templateId) {
  const t = getTokens(templateId);
  const PT_TO_PX = 1.333;

  return {
    page: {
      backgroundColor: t.backgroundColor,
      padding: `${t.pagePaddingV * PT_TO_PX}px ${t.pagePaddingH * PT_TO_PX}px`,
      fontFamily: 'Helvetica, Arial, sans-serif',
      color: t.textColor,
      fontSize: `${t.fontSizeBase * PT_TO_PX}px`,
      lineHeight: t.lineHeight,
      maxWidth: '794px', // A4 width at 96dpi
      margin: '0 auto',
      boxSizing: 'border-box',
    },
    name: {
      fontSize: `${t.fontSizeName * PT_TO_PX}px`,
      fontWeight: 'bold',
      color: t.primaryColor,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    designation: {
      fontSize: `${t.fontSizeDesignation * PT_TO_PX}px`,
      color: t.accentColor,
      textAlign: 'center',
      marginTop: '4px',
    },
    contactRow: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '4px',
      fontSize: `${t.fontSizeSmall * PT_TO_PX}px`,
      color: t.mutedColor,
    },
    sectionTitle: {
      fontSize: `${t.fontSizeHeading * PT_TO_PX}px`,
      fontWeight: 'bold',
      color: t.sectionTitleColor,
      textTransform: t.sectionTitleUppercase ? 'uppercase' : 'none',
      letterSpacing: `${t.sectionTitleLetterSpacing}px`,
      borderBottom: t.sectionTitleBorderBottom ? `1px solid ${t.borderColor}` : 'none',
      paddingBottom: t.sectionTitleBorderBottom ? '4px' : '0',
      marginTop: `${t.sectionGap * PT_TO_PX}px`,
      marginBottom: '6px',
    },
    subheadingPrimary: {
      fontSize: `${t.fontSizeBase * PT_TO_PX}px`,
      fontWeight: 'bold',
      color: t.primaryColor,
    },
    subheadingSecondary: {
      fontSize: `${t.fontSizeSmall * PT_TO_PX}px`,
      color: t.mutedColor,
    },
    text: {
      fontSize: `${t.fontSizeBase * PT_TO_PX}px`,
      color: t.textColor,
      marginBottom: '4px',
    },
    bullet: {
      fontSize: `${t.fontSizeBase * PT_TO_PX}px`,
      color: t.textColor,
      paddingLeft: `${t.bulletIndent * PT_TO_PX}px`,
      position: 'relative',
    },
  };
}
