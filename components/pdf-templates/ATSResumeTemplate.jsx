import React from 'react';
import { Document, Page, StyleSheet, Font } from '@react-pdf/renderer';
import { renderPDFBlock } from '@/lib/pdfHelpers';

// Helper to lighten a hex color by a percentage (0-100)
function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.floor((num >> 16) + ((255 - (num >> 16)) * percent) / 100));
  const g = Math.min(
    255,
    Math.floor(((num >> 8) & 0x00ff) + ((255 - ((num >> 8) & 0x00ff)) * percent) / 100)
  );
  const b = Math.min(
    255,
    Math.floor((num & 0x0000ff) + ((255 - (num & 0x0000ff)) * percent) / 100)
  );
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Helper to get the correct bold font variant
function getBoldFont(fontFamily) {
  const boldMap = {
    Helvetica: 'Helvetica-Bold',
    'Times-Roman': 'Times-Bold',
    Courier: 'Courier-Bold',
  };
  return boldMap[fontFamily] || 'Helvetica-Bold';
}

// ATS-Friendly Resume Template — Clean, simple, machine-readable
// Styled to match DocumentCanvas.jsx exactly with tight spacing for 2-page layout
function makeStyles({
  accentColor = '#374151',
  pagePadding = 40,
  baseFontSize = 14,
  fontFamily = 'Helvetica',
} = {}) {
  const accentLight = lightenColor(accentColor, 30);
  const accentLighter = lightenColor(accentColor, 50);
  const boldFont = getBoldFont(fontFamily);

  return StyleSheet.create({
    page: {
      paddingVertical: pagePadding,
      paddingHorizontal: 35,
      fontSize: baseFontSize,
      fontFamily: fontFamily,
      lineHeight: 1,
    },
    header: { marginBottom: 12, textAlign: 'center' },
    name: {
      letterSpacing: 1.2, // tracking-wide
      fontSize: baseFontSize + 4, // text-2xl
      fontFamily: boldFont,
      marginBottom: 8,
      textAlign: 'center',
      textTransform: 'uppercase',
      color: accentColor,
    },
    designation: {
      marginTop: 2,
      fontSize: baseFontSize - 2, // text-sm
      color: accentLight, // lighter tone
      marginBottom: 4,
      textAlign: 'center',
    },
    contactRow: {
      fontSize: baseFontSize - 2, // text-xs
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 4,
      marginBottom: 6,
      gap: 8, // reduced gap
    },
    contact: { fontSize: baseFontSize - 2, color: '#6B7280', marginHorizontal: 1 },
    link: { color: accentColor, textDecoration: 'none' },
    section: { marginBottom: 4, marginTop: 2 },
    sectionTitle: {
      letterSpacing: 1.4, // tracking-wider
      fontSize: baseFontSize, // text-sm
      fontFamily: boldFont,
      textTransform: 'uppercase',
      marginTop: 6,
      marginBottom: 3,
      paddingBottom: 3, // pb-1
      borderBottom: `1 solid ${accentLighter}`, // lighter border
      color: accentColor,
    },
    itemContainer: { marginBottom: 3, marginTop: 4 },
    subheading: {
      fontSize: baseFontSize - 2, // text-[0.85rem] ≈ 13.6px
      fontFamily: boldFont,
      marginBottom: 0,
      color: accentLight, // lighter tone for subheadings
    },
    text: { fontSize: baseFontSize - 3, color: '#374151', lineHeight: 1.5 }, // reduced line height
    bulletContainer: {
      flexDirection: 'row',
      marginBottom: 1.5,
      marginTop: 1,
      alignItems: 'flex-start',
    },
    bulletPoint: { width: 16, fontSize: baseFontSize - 2, color: '#6B7280' }, // text-xs, gray-500, bullet
    bulletText: { flex: 1, fontSize: baseFontSize - 3, color: '#374151', lineHeight: 1.5 }, // reduced line height
    skillsContainer: {
      marginBottom: 2,
      flexDirection: 'row',
    },
    skillLabelInline: {
      fontFamily: boldFont,
      fontSize: baseFontSize - 4, // text-xs
      color: accentLight, // lighter tone
    },
    skillTags: {
      fontSize: baseFontSize - 4, // text-xs
      color: '#374151', // gray-700
      flex: 1,
      lineHeight: 1.5,
    },
  });
}

export default function ATSResumeTemplate({ blocks, styleOverrides = {} }) {
  const styles = makeStyles(styleOverrides);
  if (!blocks?.length) return null;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {blocks.map((block) => renderPDFBlock(block, styles))}
      </Page>
    </Document>
  );
}
