export async function getServerSideProps({ res }) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const content = `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.write(content);
  res.end();

  return { props: {} };
}

export default function Robots() {
  return null;
}
