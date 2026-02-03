/**
 * Block ↔ Markdown Converters
 * Provides bidirectional conversion between resume blocks and simplified markdown
 */

/**
 * Convert resume blocks to simplified markdown for editing
 * @param {Object} blocks - Structured resume blocks
 * @returns {string} - Markdown representation
 */
export function blocksToMarkdown(blocks) {
  if (!blocks) return ''
  
  let md = ''
  
  // Header section
  if (blocks.name) md += `# ${blocks.name}\n`
  if (blocks.subtitle) md += `${blocks.subtitle}\n`
  if (blocks.email || blocks.phone || blocks.location) {
    const contact = [blocks.email, blocks.phone, blocks.location].filter(Boolean).join(' • ')
    md += `${contact}\n`
  }
  md += '\n'
  
  // Summary
  if (blocks.summary) {
    md += `## Summary\n${blocks.summary}\n\n`
  }
  
  // Experience
  if (Array.isArray(blocks.experiences) && blocks.experiences.length > 0) {
    md += `## Experience\n\n`
    blocks.experiences.forEach(exp => {
      md += `### ${exp.title} | ${exp.company}\n`
      md += `*${exp.startDate} - ${exp.endDate}* • ${exp.location}\n\n`
      if (exp.achievements) {
        md += `${exp.achievements}\n\n`
      }
    })
  }
  
  // Education
  if (Array.isArray(blocks.education) && blocks.education.length > 0) {
    md += `## Education\n\n`
    blocks.education.forEach(edu => {
      md += `### ${edu.degree}`
      if (edu.grade) md += ` (${edu.grade})`
      md += `\n`
      md += `${edu.institution}, ${edu.location}\n`
      md += `*${edu.startDate} - ${edu.endDate}*\n\n`
    })
  }
  
  // Skills
  if (blocks.skills) {
    md += `## Skills\n\n`
    if (blocks.skills.technical) {
      md += `**Technical:** ${blocks.skills.technical}\n\n`
    }
    if (blocks.skills.relevant) {
      md += `**Relevant:** ${blocks.skills.relevant}\n\n`
    }
    if (blocks.skills.other) {
      md += `**Other:** ${blocks.skills.other}\n\n`
    }
  }
  
  // Courses
  if (Array.isArray(blocks.courses) && blocks.courses.length > 0) {
    md += `## Training / Courses\n\n`
    blocks.courses.forEach(course => {
      md += `- **${course.title}** — ${course.provider || 'Online'}\n`
    })
    md += '\n'
  }
  
  // Achievements
  if (Array.isArray(blocks.achievements) && blocks.achievements.length > 0) {
    md += `## Key Achievements\n\n`
    blocks.achievements.forEach(ach => {
      md += `**${ach.title}**\n${ach.description}\n\n`
    })
  }
  
  return md.trim()
}

/**
 * Parse markdown to resume blocks
 * @param {string} markdown - Markdown text
 * @returns {Object} - Structured blocks
 */
export function markdownToBlocks(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return createEmptyBlocks()
  }
  
  const lines = markdown.split('\n')
  const blocks = createEmptyBlocks()
  
  let currentSection = null
  let currentExperience = null
  let currentEducation = null
  let lineBuffer = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    if (!trimmed) {
      // Empty line - might signal end of subsection
      if (lineBuffer.length > 0 && currentExperience) {
        currentExperience.achievements = lineBuffer.join('\n')
        lineBuffer = []
      }
      continue
    }
    
    // H1 - Name
    if (trimmed.startsWith('# ')) {
      blocks.name = trimmed.substring(2).trim()
      continue
    }
    
    // H2 - Major sections
    if (trimmed.startsWith('## ')) {
      // Save previous section data
      if (currentExperience) {
        if (lineBuffer.length > 0) {
          currentExperience.achievements = lineBuffer.join('\n')
          lineBuffer = []
        }
        blocks.experiences.push(currentExperience)
        currentExperience = null
      }
      if (currentEducation) {
        blocks.education.push(currentEducation)
        currentEducation = null
      }
      
      currentSection = trimmed.substring(3).trim().toLowerCase()
      continue
    }
    
    // H3 - Subsections (Experience/Education entries)
    if (trimmed.startsWith('### ')) {
      // Save previous entry
      if (currentExperience) {
        if (lineBuffer.length > 0) {
          currentExperience.achievements = lineBuffer.join('\n')
          lineBuffer = []
        }
        blocks.experiences.push(currentExperience)
      }
      if (currentEducation) {
        blocks.education.push(currentEducation)
      }
      
      const heading = trimmed.substring(4).trim()
      
      if (currentSection === 'experience') {
        // Parse: Title | Company
        const parts = heading.split('|').map(p => p.trim())
        currentExperience = {
          title: parts[0] || '',
          company: parts[1] || '',
          location: '',
          startDate: '',
          endDate: '',
          achievements: ''
        }
      } else if (currentSection === 'education') {
        // Parse: Degree (Grade)
        const gradeMatch = heading.match(/^(.+?)\s*\(([^)]+)\)/)
        currentEducation = {
          degree: gradeMatch ? gradeMatch[1].trim() : heading,
          grade: gradeMatch ? gradeMatch[2].trim() : '',
          institution: '',
          location: '',
          startDate: '',
          endDate: ''
        }
      }
      continue
    }
    
    // Italic line (dates/location for experience/education)
    if (trimmed.startsWith('*') && trimmed.endsWith('*')) {
      const content = trimmed.slice(1, -1).trim()
      
      if (currentExperience) {
        // Parse: StartDate - EndDate • Location
        const parts = content.split('•').map(p => p.trim())
        if (parts[0]) {
          const dates = parts[0].split('-').map(d => d.trim())
          currentExperience.startDate = dates[0] || ''
          currentExperience.endDate = dates[1] || ''
        }
        if (parts[1]) {
          currentExperience.location = parts[1]
        }
      } else if (currentEducation) {
        // Parse: StartDate - EndDate
        const dates = content.split('-').map(d => d.trim())
        currentEducation.startDate = dates[0] || ''
        currentEducation.endDate = dates[1] || ''
      }
      continue
    }
    
    // Process content based on current section
    if (currentSection === 'summary') {
      if (!blocks.summary) blocks.summary = trimmed
      else blocks.summary += ' ' + trimmed
    } 
    else if (currentSection === 'experience' && currentExperience) {
      // Everything else in experience section is achievements
      lineBuffer.push(trimmed)
    }
    else if (currentSection === 'education' && currentEducation) {
      // Institution and location
      if (!currentEducation.institution) {
        const parts = trimmed.split(',').map(p => p.trim())
        currentEducation.institution = parts[0] || ''
        currentEducation.location = parts[1] || ''
      }
    }
    else if (currentSection === 'skills') {
      // Parse: **Label:** content
      const skillMatch = trimmed.match(/^\*\*([^:]+):\*\*\s*(.+)/)
      if (skillMatch) {
        const label = skillMatch[1].trim().toLowerCase()
        const value = skillMatch[2].trim()
        if (label === 'technical') blocks.skills.technical = value
        else if (label === 'relevant') blocks.skills.relevant = value
        else if (label === 'other') blocks.skills.other = value
      }
    }
    else if (currentSection === 'training / courses' || currentSection === 'courses') {
      // Parse: - **Title** — Provider
      const courseMatch = trimmed.match(/^-\s*\*\*([^*]+)\*\*\s*—\s*(.+)/)
      if (courseMatch) {
        blocks.courses.push({
          title: courseMatch[1].trim(),
          provider: courseMatch[2].trim()
        })
      }
    }
    else if (currentSection === 'key achievements' || currentSection === 'achievements') {
      // Parse: **Title** \n Description
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        blocks.achievements.push({
          title: trimmed.slice(2, -2).trim(),
          description: ''
        })
      } else if (blocks.achievements.length > 0) {
        if (Array.isArray(blocks.achievements) && blocks.achievements.length > 0) {
          const last = blocks.achievements[blocks.achievements.length - 1]
          last.description += (last.description ? ' ' : '') + trimmed
        }
      }
    }
    else if (!currentSection) {
      // Before first section - might be subtitle or contact
      if (!blocks.subtitle && blocks.name && !trimmed.includes('@') && !trimmed.includes('•')) {
        blocks.subtitle = trimmed
      } else if (trimmed.includes('@') || trimmed.includes('•')) {
        // Contact line
        const parts = trimmed.split('•').map(p => p.trim())
        parts.forEach(part => {
          if (part.includes('@')) blocks.email = part
          else if (part.match(/\d/)) blocks.phone = part
          else blocks.location = part
        })
      }
    }
  }
  
  // Save final entries
  if (currentExperience) {
    if (lineBuffer.length > 0) {
      currentExperience.achievements = lineBuffer.join('\n')
    }
    blocks.experiences.push(currentExperience)
  }
  if (currentEducation) {
    blocks.education.push(currentEducation)
  }
  
  return blocks
}

/**
 * Create empty block structure
 */
function createEmptyBlocks() {
  return {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    location: '',
    subtitle: '',
    summary: '',
    experiences: [],
    education: [],
    skills: {
      technical: '',
      relevant: '',
      other: ''
    },
    courses: [],
    achievements: []
  }
}

/**
 * Validate blocks structure
 * @param {Object} blocks - Blocks to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateBlocks(blocks) {
  const errors = []
  
  if (!blocks) {
    return { valid: false, errors: ['Blocks object is required'] }
  }
  
  // Required fields
  if (!blocks.name || blocks.name.trim() === '') {
    errors.push('Name is required')
  }
  
  if (!blocks.email || !blocks.email.includes('@')) {
    errors.push('Valid email is required')
  }
  
  // At least one experience or education
  if ((!blocks.experiences || blocks.experiences.length === 0) && 
      (!blocks.education || blocks.education.length === 0)) {
    errors.push('At least one experience or education entry is required')
  }
  
  // Validate experience entries
  if (blocks.experiences) {
    blocks.experiences.forEach((exp, i) => {
      if (!exp.title) errors.push(`Experience ${i + 1}: Title is required`)
      if (!exp.company) errors.push(`Experience ${i + 1}: Company is required`)
    })
  }
  
  // Validate education entries
  if (blocks.education) {
    blocks.education.forEach((edu, i) => {
      if (!edu.degree) errors.push(`Education ${i + 1}: Degree is required`)
      if (!edu.institution) errors.push(`Education ${i + 1}: Institution is required`)
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Copy user profile to resume blocks
 * @param {Object} userProfile - User profile data
 * @returns {Object} - Resume blocks
 */
export function profileToBlocks(userProfile) {
  // Handle achievements: if string, skip it; if array, use it
  let achievementsArray = []
  if (Array.isArray(userProfile.achievements)) {
    achievementsArray = userProfile.achievements
  }
  
  return {
    name: userProfile.name || '',
    email: userProfile.email || '',
    phone: userProfile.phone || '',
    linkedin: userProfile.linkedin || '',
    location: userProfile.location || '',
    subtitle: userProfile.designation || '',
    summary: userProfile.summary || '',
    experiences: Array.isArray(userProfile.experiences) ? userProfile.experiences.map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || '',
      endDate: exp.endDate || '',
      achievements: exp.description || exp.achievements || ''
    })) : [],
    education: Array.isArray(userProfile.education) ? userProfile.education : [],
    skills: {
      technical: userProfile.skills?.technical || '',
      relevant: userProfile.skills?.relevant || '',
      other: userProfile.skills?.other || ''
    },
    courses: userProfile.courses || [],
    achievements: achievementsArray
  }
}
