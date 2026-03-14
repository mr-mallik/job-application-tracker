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

// Modern Resume Template — Contemporary design with accent colors
function makeStyles({
  accentColor = '#2563EB',
  pagePadding = 40,
  baseFontSize = 11,
  fontFamily = 'Helvetica',
} = {}) {
  const accentLight = lightenColor(accentColor, 30);
  const accentLighter = lightenColor(accentColor, 50);
  const boldFont = getBoldFont(fontFamily);

  return StyleSheet.create({
    page: {
      padding: pagePadding,
      fontSize: baseFontSize,
      fontFamily: fontFamily,
      lineHeight: 1.4,
      backgroundColor: '#FFFFFF',
    },
    header: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: `2 solid ${accentLighter}`,
      textAlign: 'center',
    },
    name: {
      fontSize: baseFontSize + 15,
      fontFamily: boldFont,
      color: accentColor,
      marginBottom: 4,
      textAlign: 'center',
    },
    designation: {
      fontSize: baseFontSize + 3,
      color: accentLight,
      fontFamily: boldFont,
      marginBottom: 10,
      textAlign: 'center',
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 2,
    },
    contact: { fontSize: baseFontSize - 2, color: '#6B7280', marginRight: 4 },
    link: { color: accentColor, textDecoration: 'none' },
    section: { marginBottom: 18 },
    sectionTitle: {
      fontSize: baseFontSize + 3,
      fontFamily: boldFont,
      color: accentColor,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    itemContainer: { marginBottom: 12 },
    subheading: {
      fontSize: baseFontSize,
      fontFamily: boldFont,
      color: '#1F2937',
      marginBottom: 4,
    },
    text: { fontSize: baseFontSize - 1, marginBottom: 2, color: '#4B5563' },
    bulletContainer: { flexDirection: 'row', marginBottom: 4 },
    bulletPoint: { width: 15, color: accentColor },
    bulletText: { flex: 1, fontSize: baseFontSize - 1, color: '#4B5563' },
    skillsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
    skillBadge: {
      backgroundColor: '#EFF6FF',
      color: accentColor,
      fontSize: baseFontSize - 2,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginRight: 6,
      marginBottom: 6,
      borderRadius: 3,
    },
  });
}

export default function ModernResumeTemplate({ blocks, styleOverrides = {} }) {
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
