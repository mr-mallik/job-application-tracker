import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import { renderPDFBlock } from '@/lib/pdfHelpers';

// Modern Resume Template — Contemporary design with accent colors
function makeStyles({ accentColor = '#2563EB', pagePadding = 40, baseFontSize = 11 } = {}) {
  return StyleSheet.create({
    page: {
      padding: pagePadding,
      fontSize: baseFontSize,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      backgroundColor: '#FFFFFF',
    },
    header: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottom: `2 solid ${accentColor}`,
      textAlign: 'center',
    },
    name: {
      fontSize: baseFontSize + 15,
      fontFamily: 'Helvetica-Bold',
      color: '#1F2937',
      marginBottom: 4,
      textAlign: 'center',
    },
    designation: {
      fontSize: baseFontSize + 3,
      color: accentColor,
      fontFamily: 'Helvetica-Bold',
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
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    itemContainer: { marginBottom: 12 },
    subheading: {
      fontSize: baseFontSize,
      fontFamily: 'Helvetica-Bold',
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
