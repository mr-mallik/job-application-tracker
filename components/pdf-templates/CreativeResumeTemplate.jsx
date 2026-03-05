import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { renderPDFBlock } from '@/lib/pdfHelpers';
import { BLOCK_TYPES } from '@/lib/blockSchema';

// Creative Resume Template — Two-column layout with coloured sidebar
function makeStyles({
  sidebarColor = '#1E3A8A',
  accentColor = '#1E3A8A',
  pagePadding = 30,
  baseFontSize = 10,
} = {}) {
  return StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontSize: baseFontSize,
      fontFamily: 'Helvetica',
      backgroundColor: '#FFFFFF',
    },
    leftColumn: {
      width: '35%',
      backgroundColor: sidebarColor,
      padding: pagePadding,
      color: '#FFFFFF',
    },
    rightColumn: {
      width: '65%',
      padding: pagePadding,
    },
    header: { marginBottom: 25, textAlign: 'center' },
    name: {
      textTransform: 'uppercase',
      fontSize: baseFontSize + 12,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
      marginBottom: 6,
      textAlign: 'center',
    },
    designation: {
      fontSize: baseFontSize + 2,
      color: '#93C5FD',
      marginBottom: 12,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'center',
    },
    contactRow: { flexDirection: 'column', alignItems: 'center', marginTop: 4 },
    contact: { fontSize: baseFontSize - 1, color: '#DBEAFE', marginBottom: 4 },
    link: { color: '#93C5FD', textDecoration: 'none' },
    sectionTitle: {
      fontSize: baseFontSize + 4,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottom: '2 solid #DBEAFE',
    },
    leftSectionTitle: {
      fontSize: baseFontSize + 2,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
      marginBottom: 8,
      paddingBottom: 4,
      borderBottom: '1 solid #3B82F6',
      marginTop: 2,
    },
    itemContainer: { marginBottom: 14 },
    leftItemContainer: { marginBottom: 10 },
    subheading: {
      fontSize: baseFontSize + 1,
      fontFamily: 'Helvetica-Bold',
      color: '#1F2937',
      marginBottom: 3,
    },
    leftSubheading: {
      fontSize: baseFontSize,
      fontFamily: 'Helvetica-Bold',
      color: '#FFFFFF',
      marginTop: 4,
      marginBottom: 2,
    },
    text: { fontSize: baseFontSize, marginBottom: 2, color: '#4B5563' },
    leftText: { fontSize: baseFontSize - 1, marginBottom: 3, color: '#E0E7FF', lineHeight: 1.4 },
    bulletContainer: { flexDirection: 'row', marginBottom: 4 },
    leftBulletContainer: { flexDirection: 'row', marginBottom: 3 },
    bulletPoint: { width: 15, color: accentColor },
    leftBulletPoint: { width: 12, color: '#93C5FD', fontSize: baseFontSize - 1 },
    bulletText: { flex: 1, fontSize: baseFontSize, color: '#4B5563' },
    leftBulletText: { flex: 1, fontSize: baseFontSize - 1, color: '#E0E7FF', lineHeight: 1.4 },
    section: { marginBottom: 18 },
    skillsRow: { flexDirection: 'row', flexWrap: 'wrap' },
    skillsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    skill: { fontSize: baseFontSize - 1, color: '#374151', marginRight: 8, marginBottom: 4 },
    skillBadge: {
      fontSize: baseFontSize - 1,
      color: '#1E40AF',
      backgroundColor: '#EFF6FF',
      paddingVertical: 3,
      paddingHorizontal: 6,
      marginRight: 4,
      marginBottom: 4,
      borderRadius: 2,
    },
    leftSkillBadge: { fontSize: baseFontSize - 1, color: '#E0E7FF', marginBottom: 3 },
    leftSkillsRow: { flexDirection: 'column' },
  });
}

export default function CreativeResumeTemplate({ blocks, styleOverrides = {} }) {
  const styles = makeStyles(styleOverrides);
  if (!blocks?.length) return null;

  const headerBlock = blocks.find((b) => b.type === BLOCK_TYPES.DOC_HEADER);
  const nonHeaderBlocks = blocks.filter((b) => b.type !== BLOCK_TYPES.DOC_HEADER);

  const autoLeft = [];
  const autoRight = [];
  let currentTarget = autoRight;
  for (const block of nonHeaderBlocks) {
    if (block.type === BLOCK_TYPES.SECTION_TITLE) {
      const title = (block.data?.title || '').toLowerCase();
      currentTarget =
        title.includes('skill') || title.includes('education') || title.includes('certification')
          ? autoLeft
          : autoRight;
    }
    currentTarget.push(block);
  }

  const leftStyles = {
    ...styles,
    sectionTitle: styles.leftSectionTitle,
    text: styles.leftText,
    subheading: styles.leftSubheading,
    itemContainer: styles.leftItemContainer,
    bulletContainer: styles.leftBulletContainer,
    bulletPoint: styles.leftBulletPoint,
    bulletText: styles.leftBulletText,
    skillBadge: styles.leftSkillBadge,
    skillsRow: styles.leftSkillsRow,
    skillsContainer: styles.leftSkillsRow,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.leftColumn}>
          {headerBlock && renderPDFBlock(headerBlock, styles)}
          {autoLeft.map((block) => renderPDFBlock(block, leftStyles))}
        </View>
        <View style={styles.rightColumn}>
          {autoRight.map((block) => renderPDFBlock(block, styles))}
        </View>
      </Page>
    </Document>
  );
}
