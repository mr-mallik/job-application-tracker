import React from 'react'
import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'

// Modern Resume Template - Visual design with accent colors
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '2 solid #2563EB',
  },
  name: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  designation: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
  },
  contact: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  link: {
    color: '#2563EB',
    textDecoration: 'none',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#2563EB',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemContainer: {
    marginBottom: 12,
  },
  subheading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
    color: '#4B5563',
  },
  bullet: {
    fontSize: 10,
    marginBottom: 4,
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
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  skillBadge: {
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    borderRadius: 3,
  },
})

export default function ModernResumeTemplate({ data }) {
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
              const urlMatch = contact.match(/(https?:\/\/[^\s]+)/)
              if (urlMatch) {
                const parts = contact.split(urlMatch[1])
                return (
                  <Text key={idx} style={styles.contact}>
                    {parts[0]}
                    <Link src={urlMatch[1]} style={styles.link}>
                      {urlMatch[1].replace(/https?:\/\//, '')}
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
        {sections && sections.map((section, sIdx) => {
          // Special handling for Skills section
          const isSkillsSection = section.title.toLowerCase().includes('skill')
          
          return (
            <View key={sIdx} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              {isSkillsSection && section.items ? (
                <View style={styles.skillsRow}>
                  {section.items
                    .filter(item => item && (item.type === 'text' || item.type === 'skill'))
                    .map((item, iIdx) => {
                      // Split comma-separated skills
                      if (!item.content) return null
                      const skills = item.content.split(',').map(s => s.trim()).filter(Boolean)
                      return skills.map((skill, sIdx) => (
                        <Text key={`${iIdx}-${sIdx}`} style={styles.skillBadge}>
                          {skill}
                        </Text>
                      ))
                    })}
                </View>
              ) : (
                section.items && section.items.map((item, iIdx) => {
                  if (!item || !item.content) return null
                  
                  if (item.type === 'subheading') {
                    return (
                      <View key={iIdx} style={styles.itemContainer}>
                        <Text style={styles.subheading}>{item.content}</Text>
                      </View>
                    )
                  }
                  
                  if (item.type === 'bullet') {
                    return (
                      <View key={iIdx} style={styles.bulletContainer}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={[styles.bullet, styles.bulletText]}>{item.content}</Text>
                      </View>
                    )
                  }
                  
                  if (item.type === 'text') {
                    return <Text key={iIdx} style={styles.text}>{item.content}</Text>
                  }
                  
                  return null
                })
              )}
            </View>
          )
        })}
      </Page>
    </Document>
  )
}
