const ALLOWED_TAGS = new Set(['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'blockquote']);
const VOID_TAGS = new Set(['br']);

function normalizeHref(value) {
  const href = String(value || '').trim();
  if (!href) return '';

  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return href;
  }

  if (href.startsWith('/') || href.startsWith('#')) {
    return href;
  }

  return '';
}

function sanitizeOpeningTag(tagName, rawAttributes = '') {
  const normalizedTagName = String(tagName || '').toLowerCase();
  if (!ALLOWED_TAGS.has(normalizedTagName)) return '';
  if (normalizedTagName !== 'a') {
    return `<${normalizedTagName}>`;
  }

  const hrefMatch = rawAttributes.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const safeHref = normalizeHref(hrefMatch?.[1] || hrefMatch?.[2] || hrefMatch?.[3] || '');
  if (!safeHref) {
    return '<a>';
  }

  const isExternal = /^(https?:|mailto:|tel:)/i.test(safeHref);
  const attrs = [`href="${safeHref.replace(/"/g, '&quot;')}"`];

  if (isExternal) {
    attrs.push('target="_blank"', 'rel="noopener noreferrer"');
  }

  return `<a ${attrs.join(' ')}>`;
}

function sanitizeHtml(html) {
  const raw = String(html || '');
  if (!raw.trim()) return '';

  const stripped = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');

  return stripped.replace(/<\s*(\/)?\s*([a-z0-9]+)([^>]*)>/gi, (_match, closingSlash, tagName, attributes) => {
    const normalizedTagName = String(tagName || '').toLowerCase();
    if (!ALLOWED_TAGS.has(normalizedTagName)) {
      return '';
    }

    if (closingSlash) {
      return VOID_TAGS.has(normalizedTagName) ? '' : `</${normalizedTagName}>`;
    }

    return sanitizeOpeningTag(normalizedTagName, attributes);
  });
}

module.exports = { sanitizeHtml };
