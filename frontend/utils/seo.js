const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://readnovax.in').replace(/\/$/, '');

export function normalizePath(path = '') {
  if (!path) return '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export function buildCanonicalUrl(path = '') {
  const normalizedPath = normalizePath(path);
  return `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}` || SITE_URL;
}

export function buildLanguageAlternates(path, languages = ['en']) {
  const normalizedPath = normalizePath(path);
  const alternates = [];
  const seenLanguages = new Set();

  for (const language of languages) {
    if (seenLanguages.has(language)) continue;
    seenLanguages.add(language);
    const url = new URL(buildCanonicalUrl(normalizedPath));
    if (language === 'hi') {
      url.searchParams.set('lang', 'hi');
    }
    alternates.push({ hrefLang: language, href: url.toString() });
  }

  const xDefaultHref = alternates.find((alternate) => alternate.hrefLang === 'en')?.href || alternates[0]?.href;
  if (xDefaultHref) {
    alternates.push({ hrefLang: 'x-default', href: xDefaultHref });
  }

  return alternates;
}

export function buildMeta({ title, description, image, path = '' }) {
  const url = buildCanonicalUrl(path);
  return { title, description, image, url };
}

export { SITE_URL };
