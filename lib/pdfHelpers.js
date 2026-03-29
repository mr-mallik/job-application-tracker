import React from 'react';
import { Text, View, Link } from '@react-pdf/renderer';
import { BLOCK_TYPES } from './blockSchema';
import { slateToPdfSpans, isSlateValue, slateToText } from './slateUtils';

/**
 * Parse markdown bold syntax (**text**) and return array of Text components
 * @param {string} text - Text potentially containing **bold** markdown
 * @param {object} normalStyle - Regular text style (with fontFamily property)
 * @returns {Array<React.Element|string>} - Array of Text elements and strings
 */
function parseMarkdownBold(text, normalStyle) {
  const parts = [];
  let currentIndex = 0;

  // Determine bold font based on the normal font family
  const fontFamily = normalStyle?.fontFamily || 'Helvetica';
  const boldFontMap = {
    Helvetica: 'Helvetica-Bold',
    'Times-Roman': 'Times-Bold',
    Courier: 'Courier-Bold',
  };
  const boldFont = boldFontMap[fontFamily] || 'Helvetica-Bold';

  // Match **text** patterns
  const boldPattern = /\*\*([^*]+)\*\*/g;
  let match;

  while ((match = boldPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }

    // Add bold text
    parts.push(
      <Text key={`bold-${match.index}`} style={{ ...normalStyle, fontFamily: boldFont }}>
        {match[1]}
      </Text>
    );

    currentIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Shared helper for rendering contact lines in PDF templates
 * Handles both markdown link syntax [text](url) and plain URLs
 *
 * @param {string} contact - The contact string to render
 * @param {number} idx - Index for React key
 * @param {number} total - Total number of contacts (for separator logic)
 * @param {object} styles - Style object with 'contact' and 'link' properties
 * @param {boolean} showSeparator - Whether to show ' | ' separator between contacts
 * @param {function} formatUrl - Optional function to format URL display (e.g., strip protocol)
 * @returns {React.Element} Rendered Text element with parsed links
 */
export function renderContactLine(
  contact,
  idx,
  total,
  styles,
  showSeparator = true,
  formatUrl = (url) => url
) {
  // Parse markdown link syntax [text](url)
  const markdownLinkMatch = contact.match(/\[([^\]]+)\]\(([^)]+)\)/);

  if (markdownLinkMatch) {
    const [fullMatch, linkText, url] = markdownLinkMatch;
    const beforeLink = contact.substring(0, contact.indexOf(fullMatch));
    const afterLink = contact.substring(contact.indexOf(fullMatch) + fullMatch.length);

    return (
      <Text key={idx} style={styles.contact}>
        {beforeLink}
        <Link src={url} style={styles.link}>
          {linkText}
        </Link>
        {afterLink}
        {showSeparator && idx < total - 1 && ' | '}
      </Text>
    );
  }

  // Check if contact contains plain URL
  const urlMatch = contact.match(/(https?:\/\/[^\s]+)/);

  if (urlMatch) {
    const parts = contact.split(urlMatch[1]);
    return (
      <Text key={idx} style={styles.contact}>
        {parts[0]}
        <Link src={urlMatch[1]} style={styles.link}>
          {formatUrl(urlMatch[1])}
        </Link>
        {parts[1]}
        {showSeparator && idx < total - 1 && ' | '}
      </Text>
    );
  }

  // Plain text contact
  return (
    <Text key={idx} style={styles.contact}>
      {contact}
      {showSeparator && idx < total - 1 && ' | '}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// renderPDFBlock — shared block-to-PDF renderer used by all PDF templates.
// Each template passes its own StyleSheet `styles` object so visual theming
// stays in the template while structural rendering stays here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a single block to @react-pdf/renderer elements.
 *
 * @param {Object} block - Block object { id, type, data }
 * @param {Object} styles - StyleSheet.create() output from the calling template
 * @param {Object} options - Optional overrides: { variant: 'left'|'right'|'default' }
 * @returns {React.Element|null}
 */
export function renderPDFBlock(block, styles, options = {}) {
  if (!block?.type || !block?.data) return null;
  const { id, type, data } = block;
  const { variant = 'default' } = options;

  switch (type) {
    case BLOCK_TYPES.DOC_HEADER:
      return (
        <View key={id} style={styles.header || {}}>
          {data.name ? <Text style={styles.name}>{data.name}</Text> : null}
          {data.designation ? <Text style={styles.designation}>{data.designation}</Text> : null}
          {/* Legacy contact array */}
          {data.contact?.length > 0 ? (
            <View style={styles.contactRow}>
              {data.contact.map((c, idx) => renderContactLine(c, idx, data.contact.length, styles))}
            </View>
          ) : null}
          {/* Structured links (new) */}
          {data.links?.length > 0 ? (
            <View style={styles.contactRow || {}}>
              {data.links.map((lnk, idx) => (
                <Text key={idx} style={styles.contact || {}}>
                  <Link src={lnk.url} style={styles.link || {}}>
                    {lnk.label || lnk.url}
                  </Link>
                  {idx < data.links.length - 1 ? '  |  ' : ''}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      );

    case BLOCK_TYPES.SECTION_TITLE:
      return data.title ? (
        <Text key={id} style={styles.sectionTitle}>
          {data.title}
        </Text>
      ) : null;

    case BLOCK_TYPES.SUBHEADING:
      return (
        <View key={id} style={styles.itemContainer || {}}>
          {/* First row: primary (left) and dateRange (right) */}
          {(data.primary || data.dateRange) && (
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}
            >
              <Text style={styles.subheading}>{data.primary || ''}</Text>
              {data.dateRange && (
                <Text style={[styles.text || {}, { fontSize: 12, color: '#6B7280' }]}>
                  {data.dateRange}
                </Text>
              )}
            </View>
          )}
          {/* Second row: secondary (left) and location (right) */}
          {(data.secondary || data.location) && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[styles.text || {}, { fontSize: 12, color: '#6B7280', flex: 1 }]}>
                {data.secondary || ''}
              </Text>
              {data.location && (
                <Text
                  style={[
                    styles.text || {},
                    { fontSize: 12, color: '#6B7280', textAlign: 'right' },
                  ]}
                >
                  {data.location}
                </Text>
              )}
            </View>
          )}
        </View>
      );

    case BLOCK_TYPES.TEXT: {
      const textStyle = styles.text || styles.paragraph || {};
      const linkStyle = styles.link || {};
      if (isSlateValue(data.slateContent)) {
        const spans = slateToPdfSpans(data.slateContent, textStyle, linkStyle, Text, Link);
        return spans?.length > 0 ? (
          <Text key={id} style={textStyle}>
            {spans}
          </Text>
        ) : null;
      }
      // Parse markdown bold syntax (**text**) in plain text
      if (data.text) {
        const hasBold = data.text.includes('**');
        if (hasBold) {
          const parsedContent = parseMarkdownBold(data.text, textStyle);
          return (
            <Text key={id} style={textStyle}>
              {parsedContent}
            </Text>
          );
        }
        return (
          <Text key={id} style={textStyle}>
            {data.text}
          </Text>
        );
      }
      return null;
    }

    case BLOCK_TYPES.BULLET: {
      const bulletTextStyle = styles.bulletText || styles.bulletContent || {};
      const linkStyle = styles.link || {};
      const hasContent = isSlateValue(data.slateContent)
        ? slateToText(data.slateContent).trim() !== ''
        : !!data.text;
      if (!hasContent) return null;
      return (
        <View key={id} style={styles.bulletContainer || {}}>
          <Text style={styles.bulletPoint || {}}>•</Text>
          {isSlateValue(data.slateContent) ? (
            <Text style={bulletTextStyle}>
              {slateToPdfSpans(data.slateContent, bulletTextStyle, linkStyle, Text, Link)}
            </Text>
          ) : (
            <Text style={bulletTextStyle}>
              {data.text?.includes('**')
                ? parseMarkdownBold(data.text, bulletTextStyle)
                : data.text}
            </Text>
          )}
        </View>
      );
    }

    case BLOCK_TYPES.SKILL_GROUP: {
      if (!data.skills?.length) return null;
      // Check if template has skillBadge styles (modern) vs plain text (ats)
      if (styles.skillBadge) {
        return (
          <View key={id} style={styles.skillsRow || styles.skillsContainer || {}}>
            {data.label ? <Text style={styles.text || {}}>{data.label}: </Text> : null}
            {data.skills.map((skill, i) => (
              <Text key={i} style={styles.skill}>
                {skill}
              </Text>
            ))}
          </View>
        );
      }
      // ATS template: label : skills layout matching DocumentCanvas
      return (
        <View key={id} style={styles.skillsContainer || {}}>
          <Text style={styles.skillLabelInline || { fontFamily: 'Helvetica-Bold' }}>
            {data.label || 'Category'} :
          </Text>
          <Text style={styles.skillTags || {}}>{data.skills.join(', ')}</Text>
        </View>
      );
    }

    case BLOCK_TYPES.SPACER:
      return (
        <View
          key={id}
          style={{
            marginBottom: data.size === 'lg' ? 20 : data.size === 'md' ? 12 : 6,
          }}
        />
      );

    // Cover letter blocks
    case BLOCK_TYPES.CL_HEADER:
      return (
        <View key={id} style={styles.header || {}}>
          {data.name ? <Text style={styles.name}>{data.name}</Text> : null}
          {data.email ? (
            <Text style={styles.contact || styles.text || {}}>{data.email}</Text>
          ) : null}
          {data.phone ? (
            <Text style={styles.contact || styles.text || {}}>{data.phone}</Text>
          ) : null}
          {data.location ? (
            <Text style={styles.contact || styles.text || {}}>{data.location}</Text>
          ) : null}
        </View>
      );

    case BLOCK_TYPES.CL_DATE:
      return data.date ? (
        <Text key={id} style={styles.date || styles.text || {}}>
          {formatDisplayDate(data.date)}
        </Text>
      ) : null;

    case BLOCK_TYPES.CL_RECIPIENT:
      return (
        <View key={id} style={styles.recipient || {}}>
          {data.name ? <Text style={styles.text || {}}>{data.name}</Text> : null}
          {data.company ? <Text style={styles.text || {}}>{data.company}</Text> : null}
          {data.address ? <Text style={styles.text || {}}>{data.address}</Text> : null}
        </View>
      );

    case BLOCK_TYPES.CL_SALUTATION:
      return data.text ? (
        <Text key={id} style={styles.paragraph || styles.text || {}}>
          {data.text}
        </Text>
      ) : null;

    case BLOCK_TYPES.CL_CLOSING:
      return (
        <View key={id} style={styles.signature || {}}>
          {data.text ? (
            <Text style={styles.paragraph || styles.text || {}}>{data.text}</Text>
          ) : null}
          {data.name ? (
            <Text style={styles.signatureName || styles.subheading || {}}>{data.name}</Text>
          ) : null}
        </View>
      );

    default:
      return null;
  }
}

/** Format an ISO date string for display in PDFs */
function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}
