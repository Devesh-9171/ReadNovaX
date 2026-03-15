/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'readnovax.onrender.com' }
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60
  }
};

module.exports = nextConfig;
