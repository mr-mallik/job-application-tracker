import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Cover Letter / Supporting Statement Template
const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
  },
  name: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  contact: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  date: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 15,
    marginBottom: 20,
  },
  heading: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#1F2937',
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 12,
    textAlign: 'justify',
    color: '#374151',
  },
  bullet: {
    fontSize: 11,
    marginBottom: 6,
    marginLeft: 20,
    color: '#374151',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 15,
  },
  bulletText: {
    flex: 1,
  },
  signature: {
    marginTop: 30,
    fontSize: 11,
  },
  signatureName: {
    fontFamily: 'Helvetica-Bold',
  },
});

export default function CoverLetterTemplate({ data, userProfile }) {
  const { paragraphs } = data || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with contact info */}
        {userProfile && (
          <View style={styles.header}>
            {userProfile.name && <Text style={styles.name}>{userProfile.name}</Text>}
            {userProfile.email && <Text style={styles.contact}>{userProfile.email}</Text>}
            {userProfile.phone && <Text style={styles.contact}>{userProfile.phone}</Text>}
            {userProfile.location && <Text style={styles.contact}>{userProfile.location}</Text>}
          </View>
        )}

        {/* Date */}
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>

        {/* Content */}
        {paragraphs &&
          paragraphs.map((para, idx) => {
            if (!para || !para.content) return null;

            if (para.type === 'heading') {
              return (
                <Text key={idx} style={styles.heading}>
                  {para.content}
                </Text>
              );
            }

            if (para.type === 'bullet') {
              return (
                <View key={idx} style={styles.bulletContainer}>
                  <Text style={styles.bulletPoint}>•</Text>
                  <Text style={[styles.bullet, styles.bulletText]}>{para.content}</Text>
                </View>
              );
            }

            if (para.type === 'text') {
              return (
                <Text key={idx} style={styles.paragraph}>
                  {para.content}
                </Text>
              );
            }

            return null;
          })}

        {/* Signature */}
        {userProfile && userProfile.name && (
          <View style={styles.signature}>
            <Text>Sincerely,</Text>
            <Text style={styles.signatureName}>{userProfile.name}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
