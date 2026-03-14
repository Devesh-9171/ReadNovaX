const NodeCache = require('node-cache');
const config = require('../config');

const cache = new NodeCache({ stdTTL: config.cacheTtlSeconds, checkperiod: Math.max(30, config.cacheTtlSeconds) });

function cacheKey(parts) {
  return parts.join(':');
}

module.exports = { cache, cacheKey };
