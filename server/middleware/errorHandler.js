// server/middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  console.error('[Application Error]:', err.stack || err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred',
    timestamp: new Date().toISOString()
  });
}

module.exports = errorHandler;
