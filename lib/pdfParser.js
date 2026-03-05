/**
 * Utility functions for parsing markdown content into structured data
 * for PDF generation with @react-pdf/renderer.
 *
 * Only parseResumeMarkdown and parseDocumentMarkdown are retained.
 * All markdown-to-blocks conversion functions have been removed — the
 * document system now works with blocks[] directly.
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
    // Continue parsing header until we hit the first section
    if (!currentSection && !line.startsWith('#')) {
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
