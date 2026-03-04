/**
 * Block Schema — canonical data model for document blocks.
 *
 * This is the single source of truth for block types, their required data
 * fields, default factories, and validation. Both the block editor (HTML
 * canvas) and the @react-pdf/renderer templates consume this schema.
 *
 * Never create blocks manually — always use the factory functions so IDs
 * are correctly generated and required fields are always present.
 */

import { v4 as uuidv4 } from 'uuid';

// ─── Block type constants ──────────────────────────────────────────────────

export const BLOCK_TYPES = {
  // Resume blocks
  DOC_HEADER: 'doc-header',
  SECTION_TITLE: 'section-title',
  SUBHEADING: 'subheading',
  TEXT: 'text',
  BULLET: 'bullet',
  SKILL_GROUP: 'skill-group',
  SPACER: 'spacer',

  // Cover letter / supporting statement blocks
  CL_HEADER: 'cl-header',
  CL_DATE: 'cl-date',
  CL_RECIPIENT: 'cl-recipient',
  CL_SALUTATION: 'cl-salutation',
  CL_CLOSING: 'cl-closing',
};

/** Block types that are valid in resume documents */
export const RESUME_BLOCK_TYPES = new Set([
  BLOCK_TYPES.DOC_HEADER,
  BLOCK_TYPES.SECTION_TITLE,
  BLOCK_TYPES.SUBHEADING,
  BLOCK_TYPES.TEXT,
  BLOCK_TYPES.BULLET,
  BLOCK_TYPES.SKILL_GROUP,
  BLOCK_TYPES.SPACER,
]);

/** Block types that are valid in cover letter / supporting statement documents */
export const LETTER_BLOCK_TYPES = new Set([
  BLOCK_TYPES.CL_HEADER,
  BLOCK_TYPES.CL_DATE,
  BLOCK_TYPES.CL_RECIPIENT,
  BLOCK_TYPES.CL_SALUTATION,
  BLOCK_TYPES.TEXT,
  BLOCK_TYPES.BULLET,
  BLOCK_TYPES.CL_CLOSING,
]);

/** All valid document types */
export const DOCUMENT_TYPES = {
  RESUME: 'resume',
  COVER_LETTER: 'coverLetter',
  SUPPORTING_STATEMENT: 'supportingStatement',
};

/** Current schema version — increment when block data shape changes */
export const SCHEMA_VERSION = 1;

// ─── Human-readable labels ────────────────────────────────────────────────

export const BLOCK_TYPE_LABELS = {
  [BLOCK_TYPES.DOC_HEADER]: 'Document Header',
  [BLOCK_TYPES.SECTION_TITLE]: 'Section Title',
  [BLOCK_TYPES.SUBHEADING]: 'Role / Subheading',
  [BLOCK_TYPES.TEXT]: 'Paragraph',
  [BLOCK_TYPES.BULLET]: 'Bullet Point',
  [BLOCK_TYPES.SKILL_GROUP]: 'Skill Group',
  [BLOCK_TYPES.SPACER]: 'Spacer',
  [BLOCK_TYPES.CL_HEADER]: 'Sender Info',
  [BLOCK_TYPES.CL_DATE]: 'Date',
  [BLOCK_TYPES.CL_RECIPIENT]: 'Recipient',
  [BLOCK_TYPES.CL_SALUTATION]: 'Salutation',
  [BLOCK_TYPES.CL_CLOSING]: 'Closing',
};

// ─── Block factories (always use these to create new blocks) ──────────────

export function createBlock(type, data = {}) {
  return { id: uuidv4(), type, data };
}

export const createDocHeaderBlock = (data = {}) =>
  createBlock(BLOCK_TYPES.DOC_HEADER, {
    name: '',
    designation: '',
    contact: [],
    ...data,
  });

export const createSectionTitleBlock = (title = '') =>
  createBlock(BLOCK_TYPES.SECTION_TITLE, { title });

export const createSubheadingBlock = (data = {}) =>
  createBlock(BLOCK_TYPES.SUBHEADING, {
    primary: '',
    secondary: '',
    location: '',
    dateRange: '',
    ...data,
  });

export const createTextBlock = (text = '') => createBlock(BLOCK_TYPES.TEXT, { text });

export const createBulletBlock = (text = '') => createBlock(BLOCK_TYPES.BULLET, { text });

export const createSkillGroupBlock = (data = {}) =>
  createBlock(BLOCK_TYPES.SKILL_GROUP, {
    label: '',
    skills: [],
    ...data,
  });

export const createSpacerBlock = (size = 'sm') => createBlock(BLOCK_TYPES.SPACER, { size });

export const createClHeaderBlock = (data = {}) =>
  createBlock(BLOCK_TYPES.CL_HEADER, {
    name: '',
    email: '',
    phone: '',
    location: '',
    ...data,
  });

export const createClDateBlock = (date = '') => createBlock(BLOCK_TYPES.CL_DATE, { date });

export const createClRecipientBlock = (data = {}) =>
  createBlock(BLOCK_TYPES.CL_RECIPIENT, {
    name: '',
    company: '',
    address: '',
    ...data,
  });

export const createClSalutationBlock = (text = 'Dear Hiring Manager,') =>
  createBlock(BLOCK_TYPES.CL_SALUTATION, { text });

export const createClClosingBlock = (data = {}) =>
  createBlock(BLOCK_TYPES.CL_CLOSING, {
    text: 'Sincerely,',
    name: '',
    ...data,
  });

// ─── Required data fields per type (used for validation) ─────────────────

const REQUIRED_FIELDS = {
  [BLOCK_TYPES.DOC_HEADER]: ['name'],
  [BLOCK_TYPES.SECTION_TITLE]: ['title'],
  [BLOCK_TYPES.SUBHEADING]: ['primary'],
  [BLOCK_TYPES.TEXT]: ['text'],
  [BLOCK_TYPES.BULLET]: ['text'],
  [BLOCK_TYPES.SKILL_GROUP]: ['skills'],
  [BLOCK_TYPES.SPACER]: ['size'],
  [BLOCK_TYPES.CL_HEADER]: ['name'],
  [BLOCK_TYPES.CL_DATE]: ['date'],
  [BLOCK_TYPES.CL_RECIPIENT]: [],
  [BLOCK_TYPES.CL_SALUTATION]: ['text'],
  [BLOCK_TYPES.CL_CLOSING]: ['text'],
};

// ─── Validation ──────────────────────────────────────────────────────────

/**
 * Validate a single block object.
 * Returns { valid: true } or { valid: false, errors: string[] }
 */
export function validateBlock(block) {
  const errors = [];

  if (!block || typeof block !== 'object') {
    return { valid: false, errors: ['Block must be an object'] };
  }

  if (!block.id || typeof block.id !== 'string') {
    errors.push('Block must have a string id');
  }

  if (!block.type || typeof block.type !== 'string') {
    errors.push('Block must have a string type');
  } else if (!REQUIRED_FIELDS.hasOwnProperty(block.type)) {
    errors.push(`Unknown block type: "${block.type}"`);
  } else {
    // Check required data fields
    const required = REQUIRED_FIELDS[block.type];
    if (!block.data || typeof block.data !== 'object') {
      errors.push(`Block type "${block.type}" must have a data object`);
    } else {
      for (const field of required) {
        if (block.data[field] === undefined || block.data[field] === null) {
          errors.push(`Block type "${block.type}" is missing required data field: "${field}"`);
        }
      }
    }
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

/**
 * Validate an array of blocks.
 * Returns { valid: true } or { valid: false, errors: string[] }
 */
export function validateBlockArray(blocks) {
  if (!Array.isArray(blocks)) {
    return { valid: false, errors: ['blocks must be an array'] };
  }

  const allErrors = [];

  for (let i = 0; i < blocks.length; i++) {
    const result = validateBlock(blocks[i]);
    if (!result.valid) {
      allErrors.push(...result.errors.map((e) => `Block[${i}]: ${e}`));
    }
  }

  return allErrors.length === 0 ? { valid: true } : { valid: false, errors: allErrors };
}

/**
 * Get the valid block types for a given document type.
 */
export function getAllowedBlockTypes(documentType) {
  if (documentType === DOCUMENT_TYPES.RESUME) return RESUME_BLOCK_TYPES;
  return LETTER_BLOCK_TYPES;
}

// ─── Default starter blocks per document type ─────────────────────────────

/**
 * Returns a minimal set of starter blocks for a new document of the given type.
 * Used when creating a document from scratch (no profile).
 */
export function getStarterBlocks(documentType, profile = null) {
  if (documentType === DOCUMENT_TYPES.RESUME) {
    return [
      createDocHeaderBlock({
        name: profile?.name || '',
        designation: profile?.headline || profile?.designation || '',
        contact: buildContactArray(profile),
      }),
      createSectionTitleBlock('PROFESSIONAL SUMMARY'),
      createTextBlock(profile?.summary || ''),
      createSectionTitleBlock('WORK EXPERIENCE'),
      createSectionTitleBlock('EDUCATION'),
      createSectionTitleBlock('SKILLS'),
    ];
  }

  if (
    documentType === DOCUMENT_TYPES.COVER_LETTER ||
    documentType === DOCUMENT_TYPES.SUPPORTING_STATEMENT
  ) {
    const today = new Date().toISOString().split('T')[0];
    return [
      createClHeaderBlock({
        name: profile?.name || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
      }),
      createClDateBlock(today),
      createClRecipientBlock(),
      createClSalutationBlock(),
      createTextBlock(''),
      createClClosingBlock({ name: profile?.name || '' }),
    ];
  }

  return [];
}

// ─── Helper: build contact array from profile ─────────────────────────────

function buildContactArray(profile) {
  if (!profile) return [];
  const parts = [];
  if (profile.email) parts.push(`[${profile.email}](mailto:${profile.email})`);
  if (profile.phone) parts.push(profile.phone);
  if (profile.location) parts.push(profile.location);
  if (profile.linkedin) {
    const url = profile.linkedin.startsWith('http')
      ? profile.linkedin
      : `https://${profile.linkedin}`;
    const display = profile.linkedin.replace(/https?:\/\/(www\.)?linkedin\.com\/in\//, '');
    parts.push(`[linkedin.com/in/${display}](${url})`);
  }
  if (profile.portfolio) {
    const url = profile.portfolio.startsWith('http')
      ? profile.portfolio
      : `https://${profile.portfolio}`;
    const display = profile.portfolio.replace(/https?:\/\/(www\.)?/, '');
    parts.push(`[${display}](${url})`);
  }
  return parts;
}

// ─── Utility: extract plain text from blocks (for search / preview) ───────

/**
 * Extract a short plaintext preview from a blocks array.
 * Returns up to maxChars characters of document text.
 */
export function blocksToPreview(blocks, maxChars = 150) {
  if (!Array.isArray(blocks)) return '';
  const parts = [];

  for (const block of blocks) {
    if (!block?.data) continue;
    switch (block.type) {
      case BLOCK_TYPES.DOC_HEADER:
        if (block.data.name) parts.push(block.data.name);
        if (block.data.designation) parts.push(block.data.designation);
        break;
      case BLOCK_TYPES.SECTION_TITLE:
        if (block.data.title) parts.push(block.data.title);
        break;
      case BLOCK_TYPES.SUBHEADING:
        if (block.data.primary) parts.push(block.data.primary);
        if (block.data.secondary) parts.push(block.data.secondary);
        break;
      case BLOCK_TYPES.TEXT:
      case BLOCK_TYPES.BULLET:
      case BLOCK_TYPES.CL_SALUTATION:
        if (block.data.text) parts.push(block.data.text);
        break;
      case BLOCK_TYPES.SKILL_GROUP:
        if (block.data.skills?.length) parts.push(block.data.skills.join(', '));
        break;
      case BLOCK_TYPES.CL_HEADER:
        if (block.data.name) parts.push(block.data.name);
        break;
      case BLOCK_TYPES.CL_CLOSING:
        if (block.data.text) parts.push(block.data.text);
        break;
    }
  }

  const full = parts.join(' ');
  return full.length > maxChars ? full.substring(0, maxChars) + '…' : full;
}
