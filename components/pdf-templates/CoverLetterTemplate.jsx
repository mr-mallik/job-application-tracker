import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import { renderPDFBlock } from '@/lib/pdfHelpers';

// Cover Letter / Supporting Statement Template
function makeStyles({ accentColor = '#1F2937', pagePadding = 60, baseFontSize = 11 } = {}) {
  return StyleSheet.create({
    page: {
      padding: pagePadding,
      fontSize: baseFontSize,
      fontFamily: 'Helvetica',
      lineHeight: 1.6,
    },
    header: { marginBottom: 30 },
    name: {
      fontSize: baseFontSize + 7,
      fontFamily: 'Helvetica-Bold',
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
    signatureName: { fontFamily: 'Helvetica-Bold' },
    link: { color: accentColor, textDecoration: 'none' },
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
