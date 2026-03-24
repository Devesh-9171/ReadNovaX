const AppError = require('../utils/AppError');
const { authMiddleware } = require('./authMiddleware');

function auth(requiredRole = null) {
  return (req, res, next) => {
    authMiddleware(req, res, (error) => {
      if (error) return next(error);
      if (requiredRole && req.user?.role !== requiredRole) {
        return next(new AppError('Forbidden', 403));
      }
      return next();
    });
  };
}

function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return next();
  }

  return authMiddleware(req, _res, (error) => {
    if (error) {
      req.user = null;
    }
    return next();
  });
}

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
