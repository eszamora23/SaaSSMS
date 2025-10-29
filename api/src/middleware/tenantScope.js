/**
 * Tenant Scoping Middleware
 * Ensures multi-tenant data isolation
 */

const { ForbiddenError, NotFoundError } = require('../utils/errors');
const { Organization } = require('../models');
const logger = require('../utils/logger');

/**
 * Automatically scope queries to user's organization
 * Adds orgId filter to req for easy access
 */
const tenantScope = (req, res, next) => {
  try {
    if (!req.user || !req.user.orgId) {
      throw new ForbiddenError('Organization context missing');
    }

    const orgId = req.user.orgId;

    // Attach orgId to request for easy access in controllers/services
    req.orgId = orgId;

    logger.debug('Request scoped to organization', { orgId });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Subdomain extraction middleware (for public booking)
 * Extracts orgSlug from subdomain and finds organization
 * Example: acme-medical.domain.com → finds org with slug "acme-medical"
 */
const extractSubdomain = async (req, res, next) => {
  try {
    const host = req.get('host'); // e.g., "acme-medical.domain.com" or "localhost:3000"

    // Skip if no host
    if (!host) {
      return next();
    }

    // Extract subdomain (first part before first dot)
    const parts = host.split('.');
    const subdomain = parts[0];

    // Skip if localhost or main domain
    const skipSubdomains = ['localhost', 'localhost:3000', 'app', 'www', 'api', 'admin'];
    if (skipSubdomains.includes(subdomain) || !subdomain) {
      return next();
    }

    // Remove port if present (e.g., localhost:3000 -> localhost)
    const cleanSubdomain = subdomain.split(':')[0];

    logger.debug('Extracting subdomain', { subdomain: cleanSubdomain, host });

    // Find organization by slug
    const org = await Organization.findOne({
      slug: cleanSubdomain,
      status: 'active',
    });

    if (!org) {
      logger.warn('Organization not found for subdomain', { subdomain: cleanSubdomain });
      return res.status(404).json({
        success: false,
        error: {
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found',
        },
      });
    }

    // Attach organization to request
    req.organization = org;
    req.orgId = org._id;

    logger.debug('Organization found for subdomain', {
      subdomain: cleanSubdomain,
      orgId: org._id,
      orgName: org.name,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate that resource belongs to user's organization
 * Use this when accessing resources by ID from params
 */
const validateTenantResource = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const orgId = req.orgId;

      if (!resourceId || !orgId) {
        throw new ForbiddenError('Missing resource ID or organization context');
      }

      // Find resource
      const resource = await Model.findById(resourceId);

      if (!resource) {
        throw new NotFoundError('Resource not found');
      }

      // Check if belongs to user's org
      if (resource.orgId.toString() !== orgId.toString()) {
        logger.warn('Attempted cross-tenant access', {
          userId: req.user?.id,
          userOrgId: orgId,
          resourceOrgId: resource.orgId,
          resourceId,
          model: Model.modelName,
        });

        throw new ForbiddenError('Access denied to this resource');
      }

      // Attach resource to request for use in controller
      req.resource = resource;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  tenantScope,
  extractSubdomain,
  validateTenantResource,
};
