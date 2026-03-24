const ALLOWED_TAGS = new Set(['P', 'BR', 'STRONG', 'EM', 'UL', 'OL', 'LI', 'A', 'H2', 'H3', 'BLOCKQUOTE']);

function normalizeHref(value) {
  const href = String(value || '').trim();
  if (!href) return '';

  if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
  if (href.startsWith('/') || href.startsWith('#')) return href;
  return '';
}

export function sanitizeRichHtml(html) {
  const raw = String(html || '').trim();
  if (!raw) return '';

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return raw
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
      .replace(/ on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }

  const template = document.createElement('template');
  template.innerHTML = raw;

  const walk = (node) => {
    Array.from(node.children).forEach((child) => {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        const fragment = document.createDocumentFragment();
        while (child.firstChild) {
          fragment.appendChild(child.firstChild);
        }
        child.replaceWith(fragment);
        walk(node);
        return;
      }

      Array.from(child.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        if (child.tagName === 'A' && name === 'href') {
          const safeHref = normalizeHref(attribute.value);
          if (safeHref) {
            child.setAttribute('href', safeHref);
            if (/^(https?:|mailto:|tel:)/i.test(safeHref)) {
              child.setAttribute('target', '_blank');
              child.setAttribute('rel', 'noopener noreferrer');
            } else {
              child.removeAttribute('target');
              child.removeAttribute('rel');
            }
          } else {
            child.removeAttribute('href');
            child.removeAttribute('target');
            child.removeAttribute('rel');
          }
          return;
        }

        child.removeAttribute(attribute.name);
      });

      walk(child);
    });
  };

  walk(template.content);
  return template.innerHTML;
}

export function plainTextToRichHtml(value) {
  const blocks = String(value || '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const isBulletList = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));

      if (isBulletList) {
        const items = lines.map((line) => `<li>${line.replace(/^[-*]\s+/, '')}</li>`).join('');
        return `<ul>${items}</ul>`;
      }

      return `<p>${lines.join('<br />')}</p>`;
    })
    .join('');
}
