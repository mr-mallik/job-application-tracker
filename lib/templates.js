/**
 * Template configurations and generators for resumes and cover letters
 */

import { profileToResumeMarkdown } from './pdfParser'

// Available resume templates
export const RESUME_TEMPLATES = {
  ats: {
    id: 'ats',
    name: 'ATS-Friendly',
    description: 'Clean, simple format optimized for Applicant Tracking Systems',
    component: 'ATSResumeTemplate',
  },
  modern: {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Contemporary design with accent colors and visual elements',
    component: 'ModernResumeTemplate',
  },
  creative: {
    id: 'creative',
    name: 'Creative Two-Column',
    description: 'Eye-catching two-column layout for creative roles',
    component: 'CreativeResumeTemplate',
  },
}

// Available cover letter templates
export const COVER_LETTER_TEMPLATES = {
  formal: {
    id: 'formal',
    name: 'Formal Business',
    description: 'Traditional business letter format',
    component: 'CoverLetterTemplate',
  },
  modern: {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Contemporary cover letter style',
    component: 'CoverLetterTemplate',
  },
}

/**
 * Generate default resume markdown from user profile
 * @param {Object} profile - User profile object
 * @param {string} templateId - Template ID (ats, modern, creative)
 * @returns {string} Markdown formatted resume
 */
export function generateResumeFromProfile(profile, templateId = 'ats') {
  return profileToResumeMarkdown(profile)
}

/**
 * Generate default cover letter markdown from user profile and job details
 * @param {Object} profile - User profile object
 * @param {Object} job - Job object with title, company, description
 * @returns {string} Markdown formatted cover letter
 */
export function generateCoverLetterTemplate(profile, job) {
  
  )
  
  
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  let markdown = ''

  // Optional: Add recipient info if available
  if (job?.hiringManager) {
    markdown += `${job.hiringManager}\n`
  }
  if (job?.company) {
    markdown += `${job.company}\n`
  }
  if (job?.companyAddress) {
    markdown += `${job.companyAddress}\n`
  }
  markdown += `\n${date}\n\n`

  // Salutation
  const salutation = job?.hiringManager 
    ? `Dear ${job.hiringManager},` 
    : 'Dear Hiring Manager,'
  markdown += `${salutation}\n\n`

  // Opening paragraph
  markdown += `I am writing to express my strong interest in the ${job?.title || '[Job Title]'} position at ${job?.company || '[Company Name]'}. `
  const headline = profile?.headline || profile?.designation
  if (headline) {
    markdown += `As a ${headline.toLowerCase()}, I am excited about the opportunity to contribute to your team.\n\n`
  } else {
    markdown += `With my background and skills, I am confident I would be a valuable addition to your team.\n\n`
  }

  // Body paragraph - highlight experience
  markdown += `# Why I'm a Great Fit\n\n`
  markdown += `Throughout my career, I have developed strong expertise in:\n\n`
  
  const experiences = profile?.experiences || []
  if (experiences.length > 0) {
    const exp = experiences[0]
    markdown += `- ${exp.title || exp.designation || 'Professional role'} at ${exp.company || 'previous organization'}\n`
  }
  
  // Handle both structured skills and string format
  let skillsList = []
  if (profile?.skills?.technical && Array.isArray(profile.skills.technical)) {
    skillsList = profile.skills.technical.slice(0, 3)
  } else if (profile?.skills?.relevant && typeof profile.skills.relevant === 'string') {
    skillsList = profile.skills.relevant.split(',').slice(0, 3).map(s => s.trim())
  }
  
  if (skillsList.length > 0) {
    const skillNames = skillsList.map(s => s.name || s).join(', ')
    markdown += `- Technical skills including ${skillNames}\n`
  }
  
  markdown += `\nI am particularly drawn to this opportunity because it aligns perfectly with my career goals and expertise.\n\n`

  // Closing paragraph
  markdown += `# Next Steps\n\n`
  markdown += `I would welcome the opportunity to discuss how my background and skills would benefit ${job?.company || 'your organization'}. `
  markdown += `Thank you for considering my application. I look forward to hearing from you.\n\n`

  markdown += `Sincerely,\n${profile?.name || '[Your Name]'}`

  
  
  )
  return markdown
}

/**
 * Generate default supporting statement template
 * @param {Object} profile - User profile object
 * @param {Object} job - Job object with requirements
 * @returns {string} Markdown formatted supporting statement
 */
export function generateSupportingStatementTemplate(profile, job) {
  let markdown = `# Supporting Statement\n\n`
  markdown += `## Position: ${job?.title || '[Job Title]'}\n`
  markdown += `## Company: ${job?.company || '[Company Name]'}\n\n`

  markdown += `# Introduction\n\n`
  markdown += `I am applying for the position of ${job?.title || '[Job Title]'} at ${job?.company || '[Company Name]'}. `
  if (profile?.summary) {
    markdown += `${profile.summary}\n\n`
  } else {
    markdown += `This role aligns perfectly with my career objectives and expertise.\n\n`
  }

  markdown += `# Key Qualifications\n\n`
  markdown += `I bring the following qualifications to this role:\n\n`
  
  const experiences = profile?.experiences || []
  if (experiences.length > 0) {
    markdown += `**Professional Experience**\n`
    const exp = experiences[0]
    markdown += `- ${exp.title || exp.designation || 'Current role'} at ${exp.company || 'company'}\n`
    if (exp.description) {
      const firstAchievement = exp.description.split('\n')[0]
      markdown += `- ${firstAchievement}\n`
    }
    markdown += `\n`
  }

  // Handle both structured skills and string format
  let technicalSkills = []
  if (profile?.skills?.technical && Array.isArray(profile.skills.technical)) {
    technicalSkills = profile.skills.technical.slice(0, 5)
  } else if (profile?.skills?.relevant && typeof profile.skills.relevant === 'string') {
    technicalSkills = profile.skills.relevant.split(',').slice(0, 5).map(s => s.trim())
  }
  
  if (technicalSkills.length > 0) {
    markdown += `**Technical Skills**\n`
    technicalSkills.forEach(skill => {
      const skillName = skill.name || skill
      const proficiency = skill.proficiency ? ` (${skill.proficiency})` : ''
      markdown += `- ${skillName}${proficiency}\n`
    })
    markdown += `\n`
  }

  markdown += `# Why This Role\n\n`
  markdown += `I am particularly interested in this opportunity because:\n\n`
  markdown += `- The role aligns with my career goals and expertise\n`
  markdown += `- I am passionate about the work ${job?.company || 'your organization'} does\n`
  markdown += `- I believe I can make significant contributions to your team\n\n`

  markdown += `# Conclusion\n\n`
  markdown += `I am confident that my skills and experience make me an excellent candidate for this position. `
  markdown += `I look forward to the opportunity to discuss my application further.\n`

  return markdown
}
