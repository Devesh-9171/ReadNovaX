import { buildSitemapXml, validateSitemapXml } from '../utils/sitemap';

export default function SiteMap() {
  return null;
}

export async function getServerSideProps({ res }) {
  const xml = await buildSitemapXml();

  validateSitemapXml(xml);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.write(xml);
  res.end();

  return { props: {} };
}
