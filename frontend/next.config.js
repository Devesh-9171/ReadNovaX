const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://readnovax.in').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: SITE_URL
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60
  }
};

module.exports = nextConfig;
