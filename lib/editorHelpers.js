/**
 * Markdown Editor Keyboard Shortcuts
 */

export const EDITOR_SHORTCUTS = [
  { key: 'Ctrl+B', action: 'Bold', description: 'Make text bold' },
  { key: 'Ctrl+I', action: 'Italic', description: 'Make text italic' },
  { key: 'Ctrl+H', action: 'Heading', description: 'Insert heading' },
  { key: 'Ctrl+L', action: 'Link', description: 'Insert link' },
  { key: 'Ctrl+Shift+L', action: 'Bullet', description: 'Insert bullet list' },
  { key: 'Ctrl+S', action: 'Save', description: 'Save document' },
  { key: 'Ctrl+G', action: 'Generate', description: 'Generate from profile' },
  { key: 'Ctrl+R', action: 'Refresh Preview', description: 'Refresh PDF preview' },
];

/**
 * Handle keyboard shortcuts in markdown editor
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} handlers - Handler functions for each shortcut
 */
export function handleEditorShortcut(e, handlers) {
  const { ctrlKey, metaKey, shiftKey, key } = e;
  const modifier = ctrlKey || metaKey;

  if (!modifier) return false;

  const lowerKey = key.toLowerCase();

  // Prevent default for handled shortcuts
  const preventDefault = () => {
    e.preventDefault();
    return true;
  };

  // Bold (Ctrl+B)
  if (lowerKey === 'b' && handlers.bold) {
    handlers.bold();
    return preventDefault();
  }

  // Italic (Ctrl+I)
  if (lowerKey === 'i' && handlers.italic) {
    handlers.italic();
    return preventDefault();
  }

  // Heading (Ctrl+H)
  if (lowerKey === 'h' && handlers.heading) {
    handlers.heading();
    return preventDefault();
  }

  // Link (Ctrl+L)
  if (lowerKey === 'l' && !shiftKey && handlers.link) {
    handlers.link();
    return preventDefault();
  }

  // Bullet List (Ctrl+Shift+L)
  if (lowerKey === 'l' && shiftKey && handlers.bullet) {
    handlers.bullet();
    return preventDefault();
  }

  // Save (Ctrl+S)
  if (lowerKey === 's' && handlers.save) {
    handlers.save();
    return preventDefault();
  }

  // Generate (Ctrl+G)
  if (lowerKey === 'g' && handlers.generate) {
    handlers.generate();
    return preventDefault();
  }

  // Refresh Preview (Ctrl+R)
  if (lowerKey === 'r' && handlers.refresh) {
    handlers.refresh();
    return preventDefault();
  }

  return false;
}

/**
 * Get default markdown template for document type
 * @param {string} documentType - resume, coverLetter, supportingStatement
 * @returns {string} Default markdown template
 */
export function getDefaultTemplate(documentType) {
  switch (documentType) {
    case 'resume':
      return `# PROFESSIONAL SUMMARY
Brief overview of your experience and expertise (2-3 sentences)

# WORK EXPERIENCE

**Job Title | Company Name, Location | MM/YYYY - Present**
- Key achievement with quantifiable results (e.g., "Increased sales by 25%")
- Major responsibility or project you led
- Technical skills or tools you used
- Impact you made on the team or organization

**Previous Job Title | Previous Company | MM/YYYY - MM/YYYY**
- Achievement or responsibility from this role
- Notable project or initiative

# EDUCATION

**Degree Name** - University Name, Location | Graduation Date
GPA: X.X (if above 3.5)

# SKILLS

Technical: Skill 1, Skill 2, Skill 3, Skill 4
Languages: English (Native), Other Language (Proficiency)
Tools: Tool 1, Tool 2, Tool 3

# CERTIFICATIONS

**Certification Name** - Issuing Organization | Issue Date
`;

    case 'coverLetter':
      return `[Your Name]
[Your Address]
[City, State ZIP]
[Email] | [Phone]

[Date]

[Hiring Manager Name]
[Company Name]
[Company Address]

Dear [Hiring Manager/Hiring Team],

# Opening Paragraph
Express your interest in the position and briefly mention how you learned about it. State why you're excited about this opportunity.

# Body Paragraph 1 - Your Qualifications
Highlight your most relevant experience and skills that match the job requirements. Use specific examples and achievements.

# Body Paragraph 2 - Why This Company
Explain why you're interested in working for this specific company. Show that you've researched them and understand their mission/values.

# Closing Paragraph
Reiterate your interest, mention that your resume is attached, and express your desire for an interview. Thank them for their consideration.

Sincerely,
[Your Name]
`;

    case 'supportingStatement':
      return `# Supporting Statement for [Position Title]

## Introduction
Brief introduction explaining your interest in the role and your overall suitability.

## Relevant Experience
Detail your most relevant work experience, focusing on achievements and responsibilities that align with the job requirements.

- Key achievement or responsibility
- Another relevant accomplishment
- Specific example of impact

## Skills and Qualifications
Explain how your skills match the position requirements:

- Required skill or qualification
- Another key competency
- Technical or soft skill relevant to role

## Why This Organization
Explain your motivation for applying and what you can contribute to the organization.

## Conclusion
Summarize your key strengths and express enthusiasm for the opportunity.
`;

    default:
      return '';
  }
}
