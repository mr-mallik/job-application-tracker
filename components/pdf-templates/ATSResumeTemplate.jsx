import React from 'react';
import { Document, Page, StyleSheet, Font } from '@react-pdf/renderer';
import { renderPDFBlock } from '@/lib/pdfHelpers';

// ATS-Friendly Resume Template — Clean, simple, machine-readable
// Styled to match DocumentCanvas.jsx exactly with tight spacing for 2-page layout
function makeStyles({ accentColor = '#374151', pagePadding = 40, baseFontSize = 14 } = {}) {
  return StyleSheet.create({
    page: {
      paddingVertical: pagePadding,
      paddingHorizontal: 35,
      fontSize: baseFontSize,
      fontFamily: 'Helvetica',
      lineHeight: 1,
    },
    header: { marginBottom: 12, textAlign: 'center' },
    name: {
      letterSpacing: 1.2, // tracking-wide
      fontSize: 18, // text-2xl
      fontFamily: 'Helvetica-Bold',
      marginBottom: 8,
      textAlign: 'center',
      textTransform: 'uppercase',
    },
    designation: {
      marginTop: 2,
      fontSize: 12, // text-sm
      color: '#6B7280', // gray-500
      marginBottom: 4,
      textAlign: 'center',
    },
    contactRow: {
      fontSize: 12, // text-xs
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 4,
      marginBottom: 6,
      gap: 8, // reduced gap
    },
    contact: { fontSize: 12, color: '#6B7280', marginHorizontal: 1 },
    link: { color: accentColor, textDecoration: 'none' },
    section: { marginBottom: 4, marginTop: 2 },
    sectionTitle: {
      letterSpacing: 1.4, // tracking-wider
      fontSize: 14, // text-sm
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      marginTop: 6,
      marginBottom: 3,
      paddingBottom: 3, // pb-1
      borderBottom: '1 solid #D1D5DB', // border-gray-300
      color: accentColor,
    },
    itemContainer: { marginBottom: 3, marginTop: 4 },
    subheading: {
      fontSize: 12, // text-[0.85rem] ≈ 13.6px
      fontFamily: 'Helvetica-Bold',
      marginBottom: 0,
    },
    text: { fontSize: 11, color: '#374151', lineHeight: 1.5 }, // reduced line height
    bulletContainer: {
      flexDirection: 'row',
      marginBottom: 1.5,
      marginTop: 1,
      alignItems: 'flex-start',
    },
    bulletPoint: { width: 16, fontSize: 12, color: '#6B7280' }, // text-xs, gray-500, bullet
    bulletText: { flex: 1, fontSize: 11, color: '#374151', lineHeight: 1.5 }, // reduced line height
    skillsContainer: {
      marginBottom: 2,
      flexDirection: 'row',
    },
    skillLabelInline: {
      fontFamily: 'Helvetica-Bold',
      fontSize: 10, // text-xs
      color: '#4B5563', // gray-600
    },
    skillTags: {
      fontSize: 10, // text-xs
      color: '#374151', // gray-700
      flex: 1,
      lineHeight: 1.5,
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
