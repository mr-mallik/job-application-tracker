/**
 * Slate.js utility functions for block-based rich text editing.
 *
 * Slate value format used in this app (single-paragraph per block):
 *
 *   [
 *     {
 *       type: 'paragraph',
 *       children: [
 *         { text: 'Hello ' },
 *         { text: 'world', bold: true },
 *         { type: 'link', url: 'https://...', children: [{ text: 'click here' }] }
 *       ]
 *     }
 *   ]
 *
 * Leaf marks: bold, italic, underline
 * Inline elements: link (type:'link', url: string)
 */

export const SLATE_ELEM = {
  PARAGRAPH: 'paragraph',
  LINK: 'link',
};

// ─── Value creation & validation ──────────────────────────────────────────

/** Create a minimal Slate value from a plain text string */
export function slateFromText(text = '') {
  return [{ type: SLATE_ELEM.PARAGRAPH, children: [{ text: text || '' }] }];
}

/** Return true if value looks like a Slate document */
export function isSlateValue(value) {
  return Array.isArray(value) && value.length > 0 && value[0]?.type !== undefined;
}

/** Coerce anything (string, null, Slate array) to a valid Slate value */
export function ensureSlate(value) {
  if (isSlateValue(value)) return value;
  if (typeof value === 'string') return slateFromText(value);
  return slateFromText('');
}

// ─── Serialisation ────────────────────────────────────────────────────────

/** Extract plain text from a Slate value (for AI, search, PDF fallback) */
export function slateToText(value) {
  if (!isSlateValue(value)) {
    return typeof value === 'string' ? value : '';
  }
  return value.map(_nodeText).join('\n');
}

function _nodeText(node) {
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.children)) return node.children.map(_nodeText).join('');
  return '';
}

/**
 * Serialize a Slate value to an array of @react-pdf/renderer Text / Link elements.
 * The caller provides the PDF component references to avoid importing @react-pdf here
 * (it can't run server-side).
 *
 * Usage inside renderPDFBlock:
 *   const spans = slateToPdfSpans(data.slateContent, styles.text, styles.link, Text, Link);
 *   return <Text style={styles.text}>{spans}</Text>
 */
export function slateToPdfSpans(value, baseStyle, linkStyle, TextComp, LinkComp) {
  if (!isSlateValue(value)) return null;

  const spans = [];

  value.forEach((para, pIdx) => {
    if (pIdx > 0) {
      // paragraph break as newline
      spans.push(
        <TextComp key={`br-${pIdx}`} style={baseStyle}>
          {'\n'}
        </TextComp>
      );
    }
    if (!Array.isArray(para.children)) return;

    para.children.forEach((child, cIdx) => {
      const key = `p${pIdx}c${cIdx}`;

      if (child.type === SLATE_ELEM.LINK) {
        const txt = Array.isArray(child.children) ? child.children.map(_nodeText).join('') : '';
        if (txt) {
          spans.push(
            <LinkComp key={key} src={child.url || '#'} style={{ ...baseStyle, ...linkStyle }}>
              {txt}
            </LinkComp>
          );
        }
        return;
      }

      // Regular leaf
      const style = {
        ...baseStyle,
        ...(child.bold ? { fontFamily: 'Helvetica-Bold' } : {}),
        ...(child.italic ? { fontStyle: 'italic' } : {}),
        ...(child.underline ? { textDecoration: 'underline' } : {}),
      };
      spans.push(
        <TextComp key={key} style={style}>
          {child.text || ''}
        </TextComp>
      );
    });
  });

  return spans;
}

// ─── Slate editor helpers (used in RichTextEditor component) ──────────────

/** Check if a given format mark is active on the current selection */
export function isMarkActive(editor, format) {
  const marks = editor.getMarks?.() ?? {};
  return marks[format] === true;
}

/** Toggle a mark on / off */
export function toggleMark(editor, format) {
  if (isMarkActive(editor, format)) {
    editor.removeMark(format);
  } else {
    editor.addMark(format, true);
  }
}

/** Check if a link element wraps the current selection */
export function isLinkActive(editor) {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Array.from(
    editor.nodes({ at: selection, match: (n) => n.type === SLATE_ELEM.LINK })
  );
  return !!match;
}

/** Unwrap any link wrapping the current selection */
export function unwrapLink(editor) {
  editor.unwrapNodes({ match: (n) => n.type === SLATE_ELEM.LINK });
}

/** Wrap current selection in a link with the given url */
export function wrapLink(editor, url) {
  if (isLinkActive(editor)) unwrapLink(editor);

  const { selection } = editor;
  const isCollapsed = selection && editor.isCollapsed(selection);

  const link = {
    type: SLATE_ELEM.LINK,
    url,
    children: isCollapsed ? [{ text: url }] : [],
  };

  if (isCollapsed) {
    editor.insertNodes(link);
  } else {
    editor.wrapNodes(link, { split: true });
    editor.collapse({ edge: 'end' });
  }
}
