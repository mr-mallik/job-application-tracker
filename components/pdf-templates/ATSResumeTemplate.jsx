import React from 'react';
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer';

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

export default function ATSResumeTemplate({ data }) {
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
                {header.contact.map((contact, idx) => {
                  // Parse markdown link syntax [text](url)
                  const markdownLinkMatch = contact.match(/\[([^\]]+)\]\(([^)]+)\)/);
                  if (markdownLinkMatch) {
                    const [fullMatch, linkText, url] = markdownLinkMatch;
                    const beforeLink = contact.substring(0, contact.indexOf(fullMatch));
                    const afterLink = contact.substring(
                      contact.indexOf(fullMatch) + fullMatch.length
                    );
                    return (
                      <Text key={idx} style={styles.contact}>
                        {beforeLink}
                        <Link src={url} style={styles.link}>
                          {linkText}
                        </Link>
                        {afterLink}
                        {idx < header.contact.length - 1 && ' | '}
                      </Text>
                    );
                  }
                  // Check if contact contains plain URL
                  const urlMatch = contact.match(/(https?:\/\/[^\s]+)/);
                  if (urlMatch) {
                    const parts = contact.split(urlMatch[1]);
                    return (
                      <Text key={idx} style={styles.contact}>
                        {parts[0]}
                        <Link src={urlMatch[1]} style={styles.link}>
                          {urlMatch[1]}
                        </Link>
                        {parts[1]}
                        {idx < header.contact.length - 1 && ' | '}
                      </Text>
                    );
                  }
                  return (
                    <Text key={idx} style={styles.contact}>
                      {contact}
                      {idx < header.contact.length - 1 && ' | '}
                    </Text>
                  );
                })}
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
