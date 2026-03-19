const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://readnovax.in').replace(/\/$/, '');

export function buildMeta({ title, description, image, path = '' }) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${SITE_URL}${normalizedPath === '/' ? '' : normalizedPath}` || SITE_URL;
  return { title, description, image, url };
}

export { SITE_URL };
