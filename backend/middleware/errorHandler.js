const AppError = require('../utils/AppError');
const config = require('../config');

module.exports = function errorHandler(err, _req, res, _next) {
  const isAppError = err instanceof AppError;
  const status = err.status || 500;

  if (!isAppError) {
    console.error(err);
  }

  res.status(status).json({
    message: err.message || 'Internal server error',
    ...(err.details ? { details: err.details } : {}),
    ...(config.nodeEnv !== 'production' && !isAppError ? { stack: err.stack } : {})
  });
};
