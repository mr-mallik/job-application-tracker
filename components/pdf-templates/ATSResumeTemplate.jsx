import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';
import { renderContactLine, renderPDFBlock } from '@/lib/pdfHelpers';
import { BLOCK_TYPES } from '@/lib/blockSchema';

// ATS-Friendly Resume Template - Clean, simple, machine-readable
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1,
  },
  header: {
    marginBottom: 15,
    textAlign: 'center',
  },
  name: {
    letterSpacing: 0.5,
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 15,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  designation: {
    marginTop: 6,
    fontSize: 10,
    color: '#374151',
    marginBottom: 2,
    textAlign: 'center',
  },
  contactRow: {
    fontSize: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 2,
  },
  contact: {
    fontSize: 10,
    color: '#6B7280',
    marginRight: 4,
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    letterSpacing: 0.7,
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 2,
    paddingBottom: 8,
    borderBottom: '1 solid #E5E7EB',
  },
  itemContainer: {
    marginBottom: 10,
  },
  subheading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginTop: 8,
  },
  text: {
    fontSize: 10,
    color: '#374151',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bulletPoint: {
    width: 15,
    fontSize: 10,
    color: '#374151',
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: '#374151',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skill: {
    fontSize: 10,
    marginRight: 8,
    marginBottom: 4,
  },
});

export default function ATSResumeTemplate({ data, blocks }) {
  // ── New block-based rendering ────────────────────────────────────────────
  if (blocks && blocks.length > 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {blocks.map((block) => renderPDFBlock(block, styles))}
        </Page>
      </Document>
    );
  }

  // ── Legacy data-based rendering (backward compat) ────────────────────────
  const { header, sections } = data || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        {header && (
          <View style={styles.header}>
            {header.name && <Text style={styles.name}>{header.name}</Text>}
            {header.designation && <Text style={styles.designation}>{header.designation}</Text>}
            {header.contact && header.contact.length > 0 && (
              <View style={styles.contactRow}>
                {header.contact.map((contact, idx) =>
                  renderContactLine(contact, idx, header.contact.length, styles)
                )}
              </View>
            )}
          </View>
        )}

        {/* Content Sections */}
        {sections &&
          sections.map((section, sIdx) => (
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
      </Page>
    </Document>
  );
}
