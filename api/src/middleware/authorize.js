/**
 * Authorization Middleware
 * Role-based access control (RBAC)
 */

const { ForbiddenError } = require('../utils/errors');

/**
 * Check if user has required role
 * @param {Array<string>} allowedRoles - e.g., ['admin', 'worker']
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // User must be authenticated first
      if (!req.user) {
        throw new ForbiddenError('Authentication required');
      }

      // Check if user's role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can access resource (e.g., worker can only see assigned threads)
 * @param {Function} checkFunction - Custom function returning boolean
 */
const authorizeResource = (checkFunction) => {
  return async (req, res, next) => {
    try {
      const canAccess = await checkFunction(req);

      if (!canAccess) {
        throw new ForbiddenError('You do not have permission to access this resource');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check API key has required scope
 * @param {string} requiredScope - e.g., 'customers:read'
 */
const authorizeScope = (requiredScope) => {
  return (req, res, next) => {
    try {
      if (!req.apiKey) {
        // Not using API key, skip scope check (JWT auth handles this differently)
        return next();
      }

      if (!req.apiKey.scopes) {
        throw new ForbiddenError('API key has no scopes');
      }

      // Check if has full access
      if (req.apiKey.scopes.includes('*')) {
        return next();
      }

      // Check exact match
      if (req.apiKey.scopes.includes(requiredScope)) {
        return next();
      }

      // Check wildcard (e.g., customers:* matches customers:read)
      const [resource] = requiredScope.split(':');
      if (req.apiKey.scopes.includes(`${resource}:*`)) {
        return next();
      }

      throw new ForbiddenError(
        `API key missing required scope: ${requiredScope}`
      );
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Ensure user is admin
 */
const requireAdmin = authorize(['admin']);

/**
 * Allow admins or workers
 */
const requireWorkerOrAdmin = authorize(['admin', 'worker']);

module.exports = {
  authorize,
  authorizeResource,
  authorizeScope,
  requireAdmin,
  requireWorkerOrAdmin,
};
