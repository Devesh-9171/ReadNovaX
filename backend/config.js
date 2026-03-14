const dotenv = require('dotenv');

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((url) => url.trim()),
  cacheTtlSeconds: toNumber(process.env.CACHE_TTL_SECONDS, 60),
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMaxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 300)
};

module.exports = config;
