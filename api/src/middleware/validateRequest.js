/**
 * Request Validation Middleware
 * Validates request using Zod schemas
 */

const { ValidationError } = require('../utils/errors');

/**
 * Validate request using Zod schema
 * @param {Object} schema - Zod schema object with body, params, query
 */
const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      // Validate body
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }

      // Validate params
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }

      // Validate query
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }

      next();
    } catch (error) {
      // Zod validation error
      if (error.errors) {
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        return next(new ValidationError('Validation failed', details));
      }

      next(error);
    }
  };
};

/**
 * Sanitize request data (remove unwanted fields)
 */
const sanitizeRequest = (allowedFields) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const sanitized = {};

      for (const field of allowedFields) {
        if (req.body.hasOwnProperty(field)) {
          sanitized[field] = req.body[field];
        }
      }

      req.body = sanitized;
    }

    next();
  };
};

module.exports = {
  validateRequest,
  sanitizeRequest,
};
