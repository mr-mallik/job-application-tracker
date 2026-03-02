import React from 'react';
import { Text, Link } from '@react-pdf/renderer';

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
