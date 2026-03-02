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
    console.warn('⚠️ No markdown provided');
    return { header: null, sections: [] };
  }

  const lines = markdown.split('\n');

  const sections = [];
  let currentSection = null;
  let header = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Parse header (first few lines before first # heading)
    if (!header && !line.startsWith('#')) {
      if (!header) {
        header = { name: '', designation: '', contact: [] };
      }

      // First non-empty line is name
      if (!header.name) {
        header.name = line;
      }
      // Second line is designation/title
      else if (!header.designation) {
        header.designation = line;
      }
      // Subsequent lines are contact info
      else {
        header.contact.push(line);
      }
      continue;
    }

    // Main section headings (# Heading)
    if (line.startsWith('# ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace(/^#\s+/, ''),
        items: [],
      };
      continue;
    }

    // Subsection headings (## or **)
    if (line.startsWith('## ') || (line.includes('**') && line.split('**').length >= 3)) {
      if (currentSection) {
        const subheading = line.startsWith('## ')
          ? line.replace(/^##\s+/, '')
          : line.replace(/\*\*/g, '');

        // Only add if subheading has content
        if (subheading && subheading.trim()) {
          currentSection.items.push({
            type: 'subheading',
            content: subheading.trim(),
          });
        }
      }
      continue;
    }

    // Bullet points
    if (line.startsWith('- ') || line.startsWith('• ')) {
      if (currentSection) {
        const bulletContent = line.replace(/^[-•]\s+/, '');
        // Only add if bullet has content
        if (bulletContent && bulletContent.trim()) {
          currentSection.items.push({
            type: 'bullet',
            content: bulletContent.trim(),
          });
        }
      }
      continue;
    }

    // Regular paragraph text
    if (currentSection && line.trim()) {
      currentSection.items.push({
        type: 'text',
        content: line.trim(),
      });
    }
  }

  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return { header, sections };
}

/**
 * Parse cover letter/supporting statement markdown
 * @param {string} markdown - Raw markdown content
 * @returns {Object} Structured document data
 */
export function parseDocumentMarkdown(markdown) {
  if (!markdown) {
    return { paragraphs: [] };
  }

  const lines = markdown.split('\n');
  const paragraphs = [];
  let currentParagraph = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Heading
    if (trimmed.startsWith('#')) {
      if (currentParagraph.length > 0) {
        paragraphs.push({ type: 'text', content: currentParagraph.join(' ').trim() });
        currentParagraph = [];
      }
      const headingContent = trimmed.replace(/^#+\s+/, '').trim();
      if (headingContent) {
        paragraphs.push({
          type: 'heading',
          level: (trimmed.match(/^#+/) || [''])[0].length,
          content: headingContent,
        });
      }
      continue;
    }

    // Empty line signals paragraph break
    if (!trimmed) {
      if (currentParagraph.length > 0) {
        const content = currentParagraph.join(' ').trim();
        if (content) {
          paragraphs.push({ type: 'text', content });
        }
        currentParagraph = [];
      }
      continue;
    }

    // Bullet point
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (currentParagraph.length > 0) {
        const content = currentParagraph.join(' ').trim();
        if (content) {
          paragraphs.push({ type: 'text', content });
        }
        currentParagraph = [];
      }
      const bulletContent = trimmed.replace(/^[-•]\s+/, '').trim();
      if (bulletContent) {
        paragraphs.push({
          type: 'bullet',
          content: bulletContent,
        });
      }
      continue;
    }

    // Accumulate paragraph text
    currentParagraph.push(trimmed);
  }

  // Add final paragraph
  if (currentParagraph.length > 0) {
    const content = currentParagraph.join(' ').trim();
    if (content) {
      paragraphs.push({ type: 'text', content });
    }
  }

  return { paragraphs };
}

/**
 * Convert user profile data to resume markdown
 * @param {Object} profile - User profile object (supports both flat and nested structures)
 * @returns {string} Markdown formatted resume
 */
export function profileToResumeMarkdown(profile) {
  if (!profile) {
    console.error('❌ No profile provided');
    return '';
  }

  let markdown = '';

  // Header - handle both nested (profile.name) and flat (name) structures
  const name = profile.name;
  const headline = profile.headline || profile.designation;
  const email = profile.email;
  const phone = profile.phone;
  const location = profile.location;
  const linkedin = profile.linkedin;
  const portfolio = profile.portfolio;

  if (name) {
    markdown += `${name}\n`;
  }
  if (headline) {
    markdown += `${headline}\n`;
  }
  if (email || phone || location) {
    const contact = [email, phone, location].filter(Boolean);
    markdown += `${contact.join(' | ')}\n`;
  }
  if (linkedin) {
    markdown += `LinkedIn: ${linkedin}\n`;
  }
  if (portfolio) {
    markdown += `Portfolio: ${portfolio}\n`;
  }

  markdown += '\n';

  // Professional Summary
  if (profile.summary) {
    markdown += `# Professional Summary\n\n${profile.summary}\n\n`;
  }

  // Work Experience
  const experiences = profile.experiences || [];
  if (experiences.length > 0) {
    markdown += `# Work Experience\n\n`;
    for (const exp of experiences) {
      const title = exp.title || exp.designation || 'Position';
      const company = exp.company || 'Company';
      const dates = `${exp.startDate || ''} - ${exp.endDate || 'Present'}`;

      markdown += `**${title} | ${company}**\n`;
      markdown += `${exp.location || ''} | ${dates}\n`;

      if (exp.description) {
        const bullets = exp.description.split('\n').filter(Boolean);
        for (const bullet of bullets) {
          markdown += `- ${bullet.trim()}\n`;
        }
      }
      markdown += '\n';
    }
  }

  // Education - handle both single object and array
  const education = Array.isArray(profile.education)
    ? profile.education
    : profile.education
      ? [profile.education]
      : [];

  if (education.length > 0) {
    markdown += `# Education\n\n`;
    for (const edu of education) {
      const degree = edu.degree || 'Degree';
      const institution = edu.institution || 'Institution';

      markdown += `**${degree}${edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ''}**\n`;
      markdown += `${institution}`;
      if (edu.location) markdown += ` | ${edu.location}`;
      if (edu.graduationDate || edu.endDate) markdown += ` | ${edu.graduationDate || edu.endDate}`;
      if (edu.gpa || edu.grade) markdown += ` | GPA: ${edu.gpa || edu.grade}`;
      markdown += '\n\n';
    }
  }

  // Skills - handle both string format and structured arrays
  let allSkills = [];
  if (profile.skills) {
    // New structured format
    if (profile.skills.technical && Array.isArray(profile.skills.technical)) {
      allSkills.push(...profile.skills.technical);
    }
    if (profile.skills.soft && Array.isArray(profile.skills.soft)) {
      allSkills.push(...profile.skills.soft);
    }
    if (profile.skills.languages && Array.isArray(profile.skills.languages)) {
      allSkills.push(...profile.skills.languages);
    }
    if (profile.skills.other && Array.isArray(profile.skills.other)) {
      allSkills.push(...profile.skills.other);
    }

    // Legacy string format
    if (profile.skills.relevant && typeof profile.skills.relevant === 'string') {
      const relevantSkills = profile.skills.relevant
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      allSkills.push(...relevantSkills);
    }
    if (profile.skills.other && typeof profile.skills.other === 'string') {
      const otherSkills = profile.skills.other
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      allSkills.push(...otherSkills);
    }
  }

  if (allSkills.length > 0) {
    markdown += `# Skills\n\n`;
    const skillNames = allSkills.map((s) => s.name || s).join(', ');
    markdown += `${skillNames}\n\n`;
  }

  // Projects
  const projects = profile.projects || [];
  if (projects.length > 0) {
    markdown += `# Projects\n\n`;
    for (const project of projects) {
      markdown += `**${project.title || 'Project'}**\n`;
      if (project.description) {
        markdown += `${project.description}\n`;
      }
      if (project.url) {
        markdown += `URL: ${project.url}\n`;
      }
      markdown += '\n';
    }
  }

  // Certifications
  const certifications = profile.certifications || [];
  if (certifications.length > 0) {
    markdown += `# Certifications\n\n`;
    for (const cert of certifications) {
      markdown += `**${cert.name || 'Certification'}** - ${cert.issuer || 'Issuer'}\n`;
      if (cert.issueDate) {
        markdown += `Issued: ${cert.issueDate}${cert.expiryDate ? ` | Expires: ${cert.expiryDate}` : ''}\n`;
      }
      if (cert.credentialId) {
        markdown += `Credential ID: ${cert.credentialId}\n`;
      }
      markdown += '\n';
    }
  }

  // Achievements - if available
  if (profile.achievements) {
    markdown += `# Achievements\n\n`;
    const achievementsList = profile.achievements.split('\n').filter(Boolean);
    for (const achievement of achievementsList) {
      markdown += `- ${achievement.trim()}\n`;
    }
    markdown += '\n';
  }

  const finalMarkdown = markdown.trim();

  return finalMarkdown;
}
