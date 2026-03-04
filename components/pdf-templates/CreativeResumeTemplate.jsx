import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { renderContactLine, renderPDFBlock } from '@/lib/pdfHelpers';
import { BLOCK_TYPES } from '@/lib/blockSchema';

// Creative Resume Template - Two-column layout with visual elements
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  leftColumn: {
    width: '35%',
    backgroundColor: '#1E3A8A',
    padding: 30,
    color: '#FFFFFF',
  },
  rightColumn: {
    width: '65%',
    padding: 30,
  },
  header: {
    marginBottom: 25,
    textAlign: 'center',
  },
  name: {
    textTransform: 'uppercase',
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  designation: {
    fontSize: 12,
    color: '#93C5FD',
    marginBottom: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  contact: {
    fontSize: 9,
    color: '#DBEAFE',
    marginBottom: 4,
  },
  link: {
    color: '#93C5FD',
    textDecoration: 'none',
  },
  leftSection: {
    marginBottom: 20,
  },
  leftSectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1 solid #3B82F6',
  },
  leftText: {
    fontSize: 9,
    marginBottom: 3,
    color: '#E0E7FF',
    lineHeight: 1.4,
  },
  skillItem: {
    fontSize: 9,
    marginBottom: 4,
    color: '#E0E7FF',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1E3A8A',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '2 solid #DBEAFE',
  },
  itemContainer: {
    marginBottom: 14,
  },
  subheading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
    color: '#4B5563',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletPoint: {
    width: 15,
    color: '#2563EB',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#4B5563',
  },
});

export default function CreativeResumeTemplate({ data, blocks }) {
  // ── New block-based rendering ────────────────────────────────────────────
  // Creative template: blocks with column:'left' go to the sidebar.
  if (blocks && blocks.length > 0) {
    const leftBlocks = blocks.filter((b) => b.data?.column === 'left');
    const rightBlocks = blocks.filter((b) => b.data?.column !== 'left');
    // If no explicit column assignments, auto-route by type/section context
    const hasExplicitColumns = blocks.some((b) => b.data?.column);
    const headerBlock = blocks.find((b) => b.type === 'doc-header');
    const nonHeaderBlocks = blocks.filter((b) => b.type !== 'doc-header');

    // Auto-split: section-title + items for skill/education/cert → left; rest → right
    const autoLeft = [];
    const autoRight = [];
    let currentTarget = autoRight;
    for (const block of nonHeaderBlocks) {
      if (block.type === 'section-title') {
        const title = (block.data?.title || '').toLowerCase();
        currentTarget =
          title.includes('skill') || title.includes('education') || title.includes('certification')
            ? autoLeft
            : autoRight;
      }
      currentTarget.push(block);
    }

    const finalLeft = hasExplicitColumns ? leftBlocks : autoLeft;
    const finalRight = hasExplicitColumns ? rightBlocks : autoRight;

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.leftColumn}>
            {headerBlock && renderPDFBlock(headerBlock, styles)}
            {finalLeft.map((block) => renderPDFBlock(block, styles, { variant: 'left' }))}
          </View>
          <View style={styles.rightColumn}>
            {finalRight.map((block) => renderPDFBlock(block, styles))}
          </View>
        </Page>
      </Document>
    );
  }

  // ── Legacy data-based rendering (backward compat) ────────────────────────
  const { header, sections } = data || {};

  // Split sections into left (Skills, Education, Certifications) and right (Experience, Summary, Projects)
  const leftSections = (sections || []).filter(
    (s) =>
      s &&
      s.title &&
      (s.title.toLowerCase().includes('skill') ||
        s.title.toLowerCase().includes('education') ||
        s.title.toLowerCase().includes('certification'))
  );
  const rightSections = (sections || []).filter(
    (s) =>
      s &&
      s.title &&
      !s.title.toLowerCase().includes('skill') &&
      !s.title.toLowerCase().includes('education') &&
      !s.title.toLowerCase().includes('certification')
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Left Column - Header + Skills/Education */}
        <View style={styles.leftColumn}>
          {header && (
            <View style={styles.header}>
              {header.name && <Text style={styles.name}>{header.name}</Text>}
              {header.designation && <Text style={styles.designation}>{header.designation}</Text>}
              {header.contact &&
                header.contact.map((contact, idx) =>
                  renderContactLine(contact, idx, header.contact.length, styles, false, (url) =>
                    url.replace(/https?:\/\/(www\.)?/, '')
                  )
                )}
            </View>
          )}

          {/* Left Sections */}
          {leftSections.map((section, sIdx) => (
            <View key={sIdx} style={styles.leftSection}>
              <Text style={styles.leftSectionTitle}>{section.title || 'Section'}</Text>
              {section.items &&
                section.items.map((item, iIdx) => {
                  if (!item || !item.content) return null;

                  if (item.type === 'subheading') {
                    return (
                      <Text
                        key={iIdx}
                        style={[styles.leftText, { fontFamily: 'Helvetica-Bold', marginTop: 6 }]}
                      >
                        {item.content}
                      </Text>
                    );
                  }

                  if (item.type === 'text') {
                    // Check if it's a comma-separated list (skills)
                    if (item.content && item.content.includes(',')) {
                      const items = item.content.split(',').map((s) => s.trim());
                      return items.map((skill, skillIdx) => (
                        <Text key={`${iIdx}-${skillIdx}`} style={styles.skillItem}>
                          • {skill}
                        </Text>
                      ));
                    }
                    return (
                      <Text key={iIdx} style={styles.leftText}>
                        {item.content || ''}
                      </Text>
                    );
                  }

                  return null;
                })}
            </View>
          ))}
        </View>

        {/* Right Column - Experience, Summary, Projects */}
        <View style={styles.rightColumn}>
          {rightSections.map((section, sIdx) => (
            <View key={sIdx} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title || 'Section'}</Text>

              {section.items &&
                section.items.map((item, iIdx) => {
                  if (!item || !item.content) return null;

                  if (item.type === 'subheading') {
                    return (
                      <View key={iIdx} style={styles.itemContainer} wrap={false}>
                        <Text style={styles.subheading}>{item.content}</Text>
                      </View>
                    );
                  }

                  if (item.type === 'bullet') {
                    return (
                      <View key={iIdx} style={styles.bulletContainer}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.bulletText}>{item.content}</Text>
                      </View>
                    );
                  }

                  if (item.type === 'text') {
                    return (
                      <Text key={iIdx} style={styles.text}>
                        {item.content}
                      </Text>
                    );
                  }

                  return null;
                })}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
