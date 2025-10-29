/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized JSON response
 */

const logger = require('../utils/logger');
const {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
} = require('../utils/errors');

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
const errorHandler = (err, req, res, next) => {
  // Default error
  let statusCode = 500;
  let errorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.id, // Assuming request ID middleware adds this
    },
  };

  // Log all errors
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    userId: req.user?.id,
    orgId: req.user?.orgId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Custom application errors
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.details || [],
        requestId: req.id,
      },
    };
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    errorResponse = {
      error: {
        code: 'UNAUTHORIZED',
        message: err.message,
        requestId: req.id,
      },
    };
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    errorResponse = {
      error: {
        code: 'FORBIDDEN',
        message: err.message,
        requestId: req.id,
      },
    };
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorResponse = {
      error: {
        code: 'NOT_FOUND',
        message: err.message,
        requestId: req.id,
      },
    };
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    errorResponse = {
      error: {
        code: 'CONFLICT',
        message: err.message,
        requestId: req.id,
      },
    };
  } else if (err instanceof RateLimitError) {
    statusCode = 429;
    errorResponse = {
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: err.message,
        retryAfter: err.retryAfter,
        requestId: req.id,
      },
    };
    res.set('Retry-After', err.retryAfter || 60);
  } else if (err instanceof ExternalServiceError) {
    statusCode = 502;
    errorResponse = {
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'External service temporarily unavailable',
        service: err.service,
        requestId: req.id,
      },
    };
  }

  // Mongoose validation errors
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    const details = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));
    errorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
        requestId: req.id,
      },
    };
  }

  // Mongoose CastError (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid ${err.path}: ${err.value}`,
        requestId: req.id,
      },
    };
  }

  // Mongoose duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    const value = err.keyValue[field];
    errorResponse = {
      error: {
        code: 'CONFLICT',
        message: `${field} '${value}' already exists`,
        requestId: req.id,
      },
    };
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorResponse = {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
        requestId: req.id,
      },
    };
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorResponse = {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token expired',
        requestId: req.id,
      },
    };
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.error.message = 'Internal server error';
    // Don't include stack trace or details
  } else if (process.env.NODE_ENV !== 'production') {
    // Include stack trace in development
    errorResponse.error.stack = err.stack;
    errorResponse.error.name = err.name;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 * For routes that don't exist
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
