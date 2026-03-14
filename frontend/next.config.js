/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60
  }
};

module.exports = nextConfig;
