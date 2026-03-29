import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
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

// Cover Letter / Supporting Statement Template
function makeStyles({
  accentColor = '#1F2937',
  pagePadding = 30,
  baseFontSize = 11,
  fontFamily = 'Helvetica',
} = {}) {
  const accentLight = lightenColor(accentColor, 30);
  const boldFont = getBoldFont(fontFamily);

  return StyleSheet.create({
    page: {
      padding: pagePadding,
      fontSize: baseFontSize,
      fontFamily: fontFamily,
      lineHeight: 1.6,
    },
    header: { marginBottom: 30 },
    name: {
      fontSize: baseFontSize + 7,
      fontFamily: boldFont,
      marginBottom: 4,
      color: accentColor,
    },
    contact: { fontSize: baseFontSize - 2, color: '#6B7280', marginBottom: 2 },
    date: { fontSize: baseFontSize - 1, color: '#6B7280', marginTop: 15, marginBottom: 20 },
    recipient: { marginBottom: 16 },
    paragraph: {
      fontSize: baseFontSize,
      marginBottom: 12,
      textAlign: 'justify',
      color: '#374151',
    },
    text: { fontSize: baseFontSize, marginBottom: 12, color: '#374151' },
    bulletContainer: { flexDirection: 'row', marginBottom: 6 },
    bulletPoint: { width: 15 },
    bulletText: { flex: 1, fontSize: baseFontSize, color: '#374151' },
    signature: { marginTop: 30, fontSize: baseFontSize },
    signatureName: { fontFamily: boldFont, color: accentColor },
    link: { color: accentLight, textDecoration: 'none' },
  });
}

export default function CoverLetterTemplate({ blocks, styleOverrides = {} }) {
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
