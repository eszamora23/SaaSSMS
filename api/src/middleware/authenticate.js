/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

const { verifyAccessToken } = require('../utils/tokenGenerator');
const { UnauthorizedError } = require('../utils/errors');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Authenticate request using JWT token
 * Expects: Authorization: Bearer <token>
 * Attaches user object to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = await verifyAccessToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }

    // Extract user info from token
    const { userId, orgId, role } = decoded;

    if (!userId || !orgId) {
      throw new UnauthorizedError('Invalid token payload');
    }

    // Optional: Verify user still exists and is active
    const user = await User.findById(userId)
      .select('-passwordHash')
      .populate('orgId', 'name slug status');

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedError('User account is not active');
    }

    if (user.orgId._id.toString() !== orgId) {
      throw new UnauthorizedError('Token organization mismatch');
    }

    if (user.orgId.status !== 'active') {
      throw new UnauthorizedError('Organization is not active');
    }

    // Attach to request
    req.user = {
      id: userId,
      orgId: orgId,
      role: role,
      email: user.email,
      profile: user.profile,
      organization: {
        id: user.orgId._id,
        name: user.orgId.name,
        slug: user.orgId.slug,
      },
    };

    // Also attach full user document for convenience
    req.userDoc = user;

    logger.debug('User authenticated', {
      userId,
      orgId,
      role,
      email: user.email,
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for endpoints that work with or without auth
 */
const optionalAuth = async (req, res, next) => {
  try {
    await authenticate(req, res, () => {});
    next();
  } catch (error) {
    // Ignore auth errors, continue without user
    req.user = null;
    req.userDoc = null;
    next();
  }
};

/**
 * API Key authentication
 * Expects: Authorization: Bearer sk_live_...
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No API key provided');
    }

    const apiKey = authHeader.split(' ')[1];

    // Verify API key
    const { ApiKey } = require('../models');
    const apiKeyDoc = await ApiKey.verifyKey(apiKey);

    if (!apiKeyDoc) {
      throw new UnauthorizedError('Invalid or expired API key');
    }

    // Attach to request
    req.apiKey = {
      id: apiKeyDoc._id,
      orgId: apiKeyDoc.orgId._id,
      name: apiKeyDoc.name,
      scopes: apiKeyDoc.scopes,
    };

    req.user = {
      id: null, // API keys don't have user
      orgId: apiKeyDoc.orgId._id.toString(),
      role: 'api',
      type: 'api_key',
      organization: {
        id: apiKeyDoc.orgId._id,
        name: apiKeyDoc.orgId.name,
        slug: apiKeyDoc.orgId.slug,
      },
    };

    // Update last used IP
    apiKeyDoc.lastUsedIp = req.ip;
    await apiKeyDoc.save();

    logger.info('API key authenticated', {
      apiKeyId: apiKeyDoc._id,
      orgId: apiKeyDoc.orgId._id,
      name: apiKeyDoc.name,
    });

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authenticateApiKey,
};
