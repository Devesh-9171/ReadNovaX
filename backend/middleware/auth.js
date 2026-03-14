const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const config = require('../config');

function auth(requiredRole = null) {
  return (req, _res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.substring(7) : null;

    if (!token) return next(new AppError('Unauthorized', 401));

    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = payload;
      if (requiredRole && payload.role !== requiredRole) {
        return next(new AppError('Forbidden', 403));
      }
      next();
    } catch (_error) {
      next(new AppError('Invalid token', 401));
    }
  };
}

module.exports = auth;
