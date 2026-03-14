const dotenv = require('dotenv');

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function required(name, fallback = '') {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 5000),
  mongoUri: required(
    'MONGO_URI',
    process.env.NODE_ENV === 'test' ? 'mongodb://localhost:27017/narrativax-test' : 'mongodb://localhost:27017/narrativax'
  ),
  jwtSecret: required('JWT_SECRET', process.env.NODE_ENV === 'development' ? 'dev-only-change-me' : ''),
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((url) => url.trim()),
  cacheTtlSeconds: toNumber(process.env.CACHE_TTL_SECONDS, 60),
  rateLimitWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  rateLimitMaxRequests: toNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 300)
};

module.exports = config;
