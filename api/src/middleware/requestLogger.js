/**
 * Request Logger Middleware
 * Logs all HTTP requests
 */

const morgan = require('morgan');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Add request ID to each request
 */
const addRequestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

/**
 * Morgan logger configuration
 */
const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: logger.stream,
    skip: (req) => {
      // Skip logging health checks in production
      return process.env.NODE_ENV === 'production' && req.path === '/health';
    },
  }
);

/**
 * Detailed request logger for debugging
 */
const detailedLogger = (req, res, next) => {
  const start = Date.now();

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.id,
      orgId: req.user?.orgId,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

module.exports = {
  addRequestId,
  requestLogger,
  detailedLogger,
};
