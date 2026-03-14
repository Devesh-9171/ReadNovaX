const AppError = require('../utils/AppError');

module.exports = function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};
