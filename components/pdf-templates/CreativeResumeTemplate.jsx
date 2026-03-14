import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { renderPDFBlock } from '@/lib/pdfHelpers';
import { BLOCK_TYPES } from '@/lib/blockSchema';

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

// Creative Resume Template — Two-column layout with coloured sidebar
function makeStyles({
  sidebarColor = '#1E3A8A',
  accentColor = '#1E3A8A',
  pagePadding = 30,
  baseFontSize = 10,
  fontFamily = 'Helvetica',
} = {}) {
  const accentLight = lightenColor(accentColor, 30);
  const accentLighter = lightenColor(accentColor, 50);
  const boldFont = getBoldFont(fontFamily);

  return StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontSize: baseFontSize,
      fontFamily: fontFamily,
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
      fontFamily: boldFont,
      color: '#FFFFFF',
      marginBottom: 6,
      textAlign: 'center',
    },
    designation: {
      fontSize: baseFontSize + 2,
      color: accentLighter,
      marginBottom: 12,
      fontFamily: boldFont,
      textAlign: 'center',
    },
    contactRow: { flexDirection: 'column', alignItems: 'center', marginTop: 4 },
    contact: { fontSize: baseFontSize - 1, color: '#DBEAFE', marginBottom: 4 },
    link: { color: '#93C5FD', textDecoration: 'none' },
    sectionTitle: {
      fontSize: baseFontSize + 4,
      fontFamily: boldFont,
      color: accentColor,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottom: `2 solid ${accentLighter}`,
    },
    leftSectionTitle: {
      fontSize: baseFontSize + 2,
      fontFamily: boldFont,
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
      fontFamily: boldFont,
      color: accentLight,
      marginBottom: 3,
    },
    leftSubheading: {
      fontSize: baseFontSize,
      fontFamily: boldFont,
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
