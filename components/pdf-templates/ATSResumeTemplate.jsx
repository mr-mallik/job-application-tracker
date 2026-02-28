import React from 'react'
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'

// ATS-Friendly Resume Template - Clean, simple, machine-readable
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  designation: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 8,
  },
  contact: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1 solid #E5E7EB',
  },
  itemContainer: {
    marginBottom: 10,
  },
  subheading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
    color: '#374151',
  },
  bullet: {
    fontSize: 10,
    marginBottom: 3,
    marginLeft: 12,
    color: '#374151',
  },
  bulletText: {
    marginLeft: 5,
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
})

export default function ATSResumeTemplate({ data }) {
  const { header, sections } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        {header && (
          <View style={styles.header}>
            {header.name && <Text style={styles.name}>{header.name}</Text>}
            {header.designation && <Text style={styles.designation}>{header.designation}</Text>}
            {header.contact && header.contact.map((contact, idx) => {
              // Check if contact contains URL
              const urlMatch = contact.match(/(https?:\/\/[^\s]+)/)
              if (urlMatch) {
                const parts = contact.split(urlMatch[1])
                return (
                  <Text key={idx} style={styles.contact}>
                    {parts[0]}
                    <Link src={urlMatch[1]} style={styles.link}>
                      {urlMatch[1]}
                    </Link>
                    {parts[1]}
                  </Text>
                )
              }
              return <Text key={idx} style={styles.contact}>{contact}</Text>
            })}
          </View>
        )}

        {/* Content Sections */}
        {sections && sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            
            {section.items && section.items.map((item, iIdx) => {
              if (item.type === 'subheading') {
                return (
                  <View key={iIdx} style={styles.itemContainer}>
                    <Text style={styles.subheading}>{item.content}</Text>
                  </View>
                )
              }
              
              if (item.type === 'bullet') {
                return (
                  <View key={iIdx} style={{ flexDirection: 'row', marginBottom: 3 }}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={[styles.bullet, styles.bulletText]}>{item.content}</Text>
                  </View>
                )
              }
              
              if (item.type === 'text') {
                return <Text key={iIdx} style={styles.text}>{item.content}</Text>
              }
              
              return null
            })}
          </View>
        ))}
      </Page>
    </Document>
  )
}
