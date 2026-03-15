export function buildMeta({ title, description, image, path = '' }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://read-nova-x-frontend.vercel.app';
  const url = `${site}${path}`;
  return { title, description, image, url };
}
