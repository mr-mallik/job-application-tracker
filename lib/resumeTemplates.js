import fs from 'fs'
import path from 'path'

/**
 * Resume template renderer
 * Converts structured block data into HTML using templates
 */

// Template configurations
export const RESUME_TEMPLATES = {
  harvard: {
    id: 'harvard',
    name: 'Harvard Professional',
    description: 'Classic two-column design inspired by Harvard Business School',
    path: 'templates/resume/harvard.html'
  }
  // Future templates can be added here
}

/**
 * Render resume using a specific template
 * @param {Object} resumeData - Structured resume data
 * @param {string} templateId - Template ID (e.g., 'harvard')
 * @returns {string} - HTML content
 */
export function renderResumeTemplate(resumeData, templateId = 'harvard') {
  const template = RESUME_TEMPLATES[templateId]
  if (!template) {
    throw new Error(`Template ${templateId} not found`)
  }

  // Load template HTML
  const templatePath = path.join(process.cwd(), template.path)
  let html = fs.readFileSync(templatePath, 'utf-8')

  // Replace placeholders with actual data
  const data = {
    name: resumeData.name || '',
    subtitle: resumeData.subtitle || resumeData.designation || '',
    email: resumeData.email || '',
    phone: resumeData.phone || '',
    linkedin: resumeData.linkedin ? 'LinkedIn' : '',
    location: resumeData.location || '',
    contact: buildContactLine(resumeData),
    summary: resumeData.summary || '',
    experienceHtml: buildExperienceHtml(resumeData.experiences || []),
    educationHtml: buildEducationHtml(resumeData.education || []),
    skillsHtml: buildSkillsHtml(resumeData.skills || {}),
    projectsHtml: buildProjectsHtml(resumeData.projects || []),
    coursesHtml: buildCoursesHtml(resumeData.courses || []),
    achievementsHtml: buildAchievementsHtml(resumeData.achievements || []),
    interestsHtml: buildInterestsHtml(resumeData.interests || [])
  }

  // Replace all placeholders
  html = html.replace(/Alexander Taylor/g, data.name)
  html = html.replace(/Senior Software Engineer \| Software Development \| Cloud Technologies \| Team Leadership/g, data.subtitle)
  html = html.replace(/a\.taylor@enhancv\.com/g, data.email)
  
  // Replace contact line
  const contactRegex = /a\.taylor@enhancv\.com\s*&nbsp;•&nbsp;\s*LinkedIn\s*&nbsp;•&nbsp;\s*San Diego, California/
  html = html.replace(contactRegex, data.contact)

  // Replace summary
  const summaryRegex = /<div class="summary">\s*[\s\S]*?<\/div>/
  html = html.replace(summaryRegex, `<div class="summary">\n        ${data.summary}\n    </div>`)

  // Replace experience section
  const experienceRegex = /<div class="section-title">Experience<\/div>\s*<div class="divider"><\/div>\s*[\s\S]*?(?=<\/div>\s*<!-- ================= PAGE 2)/
  html = html.replace(experienceRegex, `<div class="section-title">Experience</div>\n    <div class="divider"></div>\n\n${data.experienceHtml}`)

  // Replace education section
  const educationRegex = /<div class="section-title">Education<\/div>\s*<div class="divider"><\/div>\s*[\s\S]*?(?=<div class="section-title">Key Achievements)/
  html = html.replace(educationRegex, `<div class="section-title">Education</div>\n    <div class="divider"></div>\n${data.educationHtml}\n\n    `)

  // Replace skills section
  const skillsRegex = /<div class="section-title">Skills<\/div>\s*<div class="divider"><\/div>\s*<div class="skills">\s*[\s\S]*?<\/div>/
  html = html.replace(skillsRegex, `<div class="section-title">Skills</div>\n    <div class="divider"></div>\n    <div class="skills">\n        ${data.skillsHtml}\n    </div>`)

  // Replace training/courses section
  const coursesRegex = /<div class="section-title">Training \/ Courses<\/div>\s*<div class="divider"><\/div>\s*<ul>[\s\S]*?<\/ul>/
  if (data.coursesHtml) {
    html = html.replace(coursesRegex, `<div class="section-title">Training / Courses</div>\n    <div class="divider"></div>\n    <ul>\n${data.coursesHtml}    </ul>`)
  } else {
    html = html.replace(coursesRegex, '')
  }

  // Replace achievements section
  const achievementsRegex = /<div class="section-title">Key Achievements<\/div>\s*<div class="divider"><\/div>\s*<div class="achievements">[\s\S]*?<\/div>/
  if (data.achievementsHtml) {
    html = html.replace(achievementsRegex, `<div class="section-title">Key Achievements</div>\n    <div class="divider"></div>\n    <div class="achievements">\n${data.achievementsHtml}    </div>`)
  } else {
    html = html.replace(achievementsRegex, '')
  }

  return html
}

function buildContactLine(data) {
  const parts = []
  if (data.email) parts.push(data.email)
  if (data.linkedin) parts.push('LinkedIn')
  if (data.phone) parts.push(data.phone)
  if (data.location) parts.push(data.location)
  return parts.join(' &nbsp;•&nbsp; ')
}

function buildExperienceHtml(experiences) {
  if (!experiences || experiences.length === 0) return ''
  
  return experiences.map((exp, idx) => {
    const bullets = exp.achievements ? exp.achievements.split('\n').filter(b => b.trim()).map(b => {
      const clean = b.trim().replace(/^[-•*]\s*/, '')
      return `            <li>${clean}</li>`
    }).join('\n') : ''

    // Check if this is the last experience on page 1 (index 1 or 2 depending on content)
    const isPageBreak = idx === 1 // Typically break after 2nd experience

    return `    <div class="job">
        <div class="job-header">
            <span>${exp.company || ''}</span>
            <span>${exp.location || ''}</span>
        </div>
        <div class="job-sub">
            <span>${exp.title || ''}</span>
            <span>${exp.startDate || ''} – ${exp.endDate || ''}</span>
        </div>
        <ul>
${bullets}
        </ul>
    </div>${isPageBreak ? '\n\n</div>\n\n<!-- ================= PAGE 2 ================= -->\n<div class="page">\n' : '\n'}`
  }).join('')
}

function buildEducationHtml(education) {
  if (!education || education.length === 0) return '    <p class="text-muted-foreground">No education added</p>'
  
  return education.map(edu => {
    const dateRange = `${edu.startDate || ''} – ${edu.endDate || ''}`
    return `    <div class="education-row">
        <span><strong>${edu.institution || ''}</strong> — ${edu.degree || ''}${edu.grade ? ` (${edu.grade})` : ''}</span>
        <span>${dateRange}</span>
    </div>`
  }).join('\n')
}

function buildSkillsHtml(skills) {
  const allSkills = []
  if (skills.technical) allSkills.push(skills.technical)
  if (skills.relevant) allSkills.push(skills.relevant)
  if (skills.other) allSkills.push(skills.other)
  
  return allSkills.join(' · ') || 'Not specified'
}

function buildProjectsHtml(projects) {
  if (!projects || projects.length === 0) return ''
  return projects.map(proj => `**${proj.title}${proj.url ? ' | ' + proj.url : ''}**\n${proj.description}`).join('\n\n')
}

function buildCoursesHtml(courses) {
  if (!courses || courses.length === 0) return ''
  return courses.map(course => `        <li><strong>${course.title}</strong> — ${course.provider || 'Online'}</li>`).join('\n')
}

function buildAchievementsHtml(achievements) {
  if (!achievements || achievements.length === 0) return ''
  
  return achievements.slice(0, 3).map(achievement => {
    return `        <div class="achievement">
            <strong>${achievement.title || ''}</strong><br>
            ${achievement.description || ''}
        </div>`
  }).join('\n')
}

function buildInterestsHtml(interests) {
  if (!interests || interests.length === 0) return ''
  return interests.map(int => `**${int.title}**\n${int.description}`).join('\n\n')
}
