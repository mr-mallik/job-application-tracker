/**
 * Utility functions for parsing markdown content into structured data
 * for PDF generation with @react-pdf/renderer
 */

/**
 * Parse resume markdown content into structured sections
 * @param {string} markdown - Raw markdown content
 * @returns {Object} Structured resume data
 */
export function parseResumeMarkdown(markdown) {
  if (!markdown) {
    return { header: null, sections: [] }
  }

  const lines = markdown.split('\n')
  const sections = []
  let currentSection = null
  let header = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines
    if (!line) continue

    // Parse header (first few lines before first # heading)
    if (!header && !line.startsWith('#')) {
      if (!header) {
        header = { name: '', designation: '', contact: [] }
      }
      
      // First non-empty line is name
      if (!header.name) {
        header.name = line
      }
      // Second line is designation/title
      else if (!header.designation) {
        header.designation = line
      }
      // Subsequent lines are contact info
      else {
        header.contact.push(line)
      }
      continue
    }

    // Main section headings (# Heading)
    if (line.startsWith('# ')) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        title: line.replace(/^#\s+/, ''),
        items: []
      }
      continue
    }

    // Subsection headings (## or **)
    if (line.startsWith('## ') || (line.includes('**') && line.split('**').length >= 3)) {
      if (currentSection) {
        const subheading = line.startsWith('## ')
          ? line.replace(/^##\s+/, '')
          : line.replace(/\*\*/g, '')
        
        currentSection.items.push({
          type: 'subheading',
          content: subheading
        })
      }
      continue
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('• ')) {
      if (currentSection) {
        currentSection.items.push({
          type: 'bullet',
          content: line.replace(/^[-•]\s+/, '')
        })
      }
      continue
    }

    // Regular paragraph text
    if (currentSection) {
      currentSection.items.push({
        type: 'text',
        content: line
      })
    }
  }

  // Add last section
  if (currentSection) {
    sections.push(currentSection)
  }

  return { header, sections }
}

/**
 * Parse cover letter/supporting statement markdown
 * @param {string} markdown - Raw markdown content
 * @returns {Object} Structured document data
 */
export function parseDocumentMarkdown(markdown) {
  if (!markdown) {
    return { paragraphs: [] }
  }

  const lines = markdown.split('\n')
  const paragraphs = []
  let currentParagraph = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Heading
    if (trimmed.startsWith('#')) {
      if (currentParagraph.length > 0) {
        paragraphs.push({ type: 'text', content: currentParagraph.join(' ') })
        currentParagraph = []
      }
      paragraphs.push({
        type: 'heading',
        level: (trimmed.match(/^#+/) || [''])[0].length,
        content: trimmed.replace(/^#+\s+/, '')
      })
      continue
    }

    // Empty line signals paragraph break
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        paragraphs.push({ type: 'text', content: currentParagraph.join(' ') })
        currentParagraph = []
      }
      continue
    }

    // Bullet point
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (currentParagraph.length > 0) {
        paragraphs.push({ type: 'text', content: currentParagraph.join(' ') })
        currentParagraph = []
      }
      paragraphs.push({
        type: 'bullet',
        content: trimmed.replace(/^[-•]\s+/, '')
      })
      continue
    }

    // Accumulate paragraph text
    currentParagraph.push(trimmed)
  }

  // Add final paragraph
  if (currentParagraph.length > 0) {
    paragraphs.push({ type: 'text', content: currentParagraph.join(' ') })
  }

  return { paragraphs }
}

/**
 * Convert user profile data to resume markdown
 * @param {Object} profile - User profile object
 * @returns {string} Markdown formatted resume
 */
export function profileToResumeMarkdown(profile) {
  if (!profile) return ''

  let markdown = ''

  // Header
  if (profile.name) {
    markdown += `${profile.name}\n`
  }
  if (profile.headline) {
    markdown += `${profile.headline}\n`
  }
  if (profile.email || profile.phone || profile.location) {
    const contact = [profile.email, profile.phone, profile.location].filter(Boolean)
    markdown += `${contact.join(' | ')}\n`
  }
  if (profile.linkedin) {
    markdown += `LinkedIn: ${profile.linkedin}\n`
  }
  if (profile.portfolio) {
    markdown += `Portfolio: ${profile.portfolio}\n`
  }

  markdown += '\n'

  // Professional Summary
  if (profile.summary) {
    markdown += `# Professional Summary\n\n${profile.summary}\n\n`
  }

  // Work Experience
  if (profile.experiences && profile.experiences.length > 0) {
    markdown += `# Work Experience\n\n`
    for (const exp of profile.experiences) {
      const designation = exp.designation || 'Position'
      const company = exp.company || 'Company'
      const dates = `${exp.startDate || ''} - ${exp.endDate || 'Present'}`
      
      markdown += `**${designation} | ${company}**\n`
      markdown += `${exp.location || ''} | ${dates}\n`
      
      if (exp.description) {
        const bullets = exp.description.split('\n').filter(Boolean)
        for (const bullet of bullets) {
          markdown += `- ${bullet.trim()}\n`
        }
      }
      markdown += '\n'
    }
  }

  // Education
  if (profile.education && profile.education.length > 0) {
    markdown += `# Education\n\n`
    for (const edu of profile.education) {
      const degree = edu.degree || 'Degree'
      const institution = edu.institution || 'Institution'
      
      markdown += `**${degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}**\n`
      markdown += `${institution}`
      if (edu.location) markdown += ` | ${edu.location}`
      if (edu.graduationDate) markdown += ` | ${edu.graduationDate}`
      if (edu.gpa) markdown += ` | GPA: ${edu.gpa}`
      markdown += '\n\n'
    }
  }

  // Skills
  if (profile.skills) {
    const allSkills = []
    if (profile.skills.technical) allSkills.push(...profile.skills.technical)
    if (profile.skills.soft) allSkills.push(...profile.skills.soft)
    if (profile.skills.languages) allSkills.push(...profile.skills.languages)
    if (profile.skills.other) allSkills.push(...profile.skills.other)
    
    if (allSkills.length > 0) {
      markdown += `# Skills\n\n`
      const skillNames = allSkills.map(s => s.name || s).join(', ')
      markdown += `${skillNames}\n\n`
    }
  }

  // Projects
  if (profile.projects && profile.projects.length > 0) {
    markdown += `# Projects\n\n`
    for (const project of profile.projects) {
      markdown += `**${project.title || 'Project'}**\n`
      if (project.description) {
        markdown += `${project.description}\n`
      }
      if (project.url) {
        markdown += `URL: ${project.url}\n`
      }
      markdown += '\n'
    }
  }

  // Certifications
  if (profile.certifications && profile.certifications.length > 0) {
    markdown += `# Certifications\n\n`
    for (const cert of profile.certifications) {
      markdown += `**${cert.name || 'Certification'}** - ${cert.issuer || 'Issuer'}\n`
      if (cert.issueDate) {
        markdown += `Issued: ${cert.issueDate}${cert.expiryDate ? ` | Expires: ${cert.expiryDate}` : ''}\n`
      }
      if (cert.credentialId) {
        markdown += `Credential ID: ${cert.credentialId}\n`
      }
      markdown += '\n'
    }
  }

  return markdown.trim()
}
