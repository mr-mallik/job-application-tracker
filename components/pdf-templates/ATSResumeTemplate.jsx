import React from 'react';
import { Document, Page, StyleSheet, Font } from '@react-pdf/renderer';
import { renderPDFBlock } from '@/lib/pdfHelpers';

// ATS-Friendly Resume Template — Clean, simple, machine-readable
function makeStyles({ accentColor = '#374151', pagePadding = 30, baseFontSize = 11 } = {}) {
  return StyleSheet.create({
    page: {
      padding: pagePadding,
      fontSize: baseFontSize,
      fontFamily: 'Helvetica',
      lineHeight: 1,
    },
    header: { marginBottom: 12, textAlign: 'center' },
    name: {
      letterSpacing: 0.6,
      fontSize: baseFontSize + 9,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 10,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    designation: {
      marginTop: 4,
      fontSize: baseFontSize + 1,
      color: '#6B7280',
      marginBottom: 1,
      textAlign: 'center',
    },
    contactRow: {
      fontSize: baseFontSize,
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 4,
      marginBottom: 2,
    },
    contact: { fontSize: baseFontSize, color: '#6B7280', marginRight: 5 },
    link: { color: accentColor, textDecoration: 'none' },
    section: { marginBottom: 14 },
    sectionTitle: {
      letterSpacing: 0.55,
      fontSize: baseFontSize,
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      marginTop: 4,
      marginBottom: 4,
      paddingBottom: 4,
      borderBottom: '1 solid #D1D5DB',
      color: accentColor,
    },
    itemContainer: { marginBottom: 4 },
    subheading: {
      fontSize: baseFontSize,
      fontFamily: 'Helvetica-Bold',
      marginTop: 4,
      marginBottom: 4,
    },
    text: { fontSize: baseFontSize - 1, color: '#374151', lineHeight: 1.4 },
    bulletContainer: { flexDirection: 'row', marginBottom: 3 },
    bulletPoint: { width: 12, fontSize: baseFontSize - 1, color: '#374151' },
    bulletText: { flex: 1, fontSize: baseFontSize - 1, color: '#374151', lineHeight: 1.4 },
    skillsContainer: {
      marginBottom: 3,
    },
    skillLabelInline: {
      fontFamily: 'Helvetica-Bold',
      fontSize: baseFontSize - 1,
    },
  });
}

export default function ATSResumeTemplate({ blocks, styleOverrides = {} }) {
  Font.register({
    family: 'Oswald',
    src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf',
  });

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
