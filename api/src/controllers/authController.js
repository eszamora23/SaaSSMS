/**
 * Authentication Controller
 * Handles authentication endpoints
 */

const authService = require('../services/authService');
const { generateTokenPair } = require('../utils/tokenGenerator');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Check subdomain availability
 * GET /api/v1/auth/check-subdomain?subdomain=myorg
 */
const checkSubdomain = asyncHandler(async (req, res) => {
  const { subdomain } = req.query;

  const isAvailable = await authService.checkSubdomainAvailability(subdomain);

  res.json(
    successResponse('Subdomain availability checked', {
      subdomain,
      available: isAvailable,
    })
  );
});

/**
 * Register new organization
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, organizationName, subdomain, country, timezone } = req.body;

  const result = await authService.registerOrganization({
    email,
    password,
    organizationName,
    subdomain,
    country,
    timezone,
  });

  res.status(201).json(
    successResponse('Organization registered successfully', {
      organization: {
        id: result.organization._id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
      user: {
        id: result.user._id,
        email: result.user.email,
        role: result.user.role,
      },
      verificationToken: result.verificationToken, // In production, only send via email
    })
  );
});

/**
 * Verify email address
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const user = await authService.verifyEmail(token);

  res.json(
    successResponse('Email verified successfully', {
      user: {
        id: user._id,
        email: user.email,
        status: user.status,
      },
    })
  );
});

/**
 * Login
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password, mfaCode } = req.body;

  const user = await authService.login({ email, password, mfaCode });

  // Generate tokens
  const tokens = await generateTokenPair(user);

  res.json(
    successResponse('Login successful', {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        organization: {
          id: user.orgId._id,
          name: user.orgId.name,
          slug: user.orgId.slug,
        },
      },
      ...tokens,
    })
  );
});

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const tokens = await authService.refreshTokens(refreshToken);

  res.json(successResponse('Tokens refreshed', tokens));
});

/**
 * Logout
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // For now, just return success
  // In production with Redis, you'd invalidate the token
  res.json(successResponse('Logged out successfully'));
});

/**
 * Request password reset
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.requestPasswordReset(email);

  res.json(
    successResponse(result.message, {
      resetToken: result.resetToken, // In production, only send via email
    })
  );
});

/**
 * Reset password
 * POST /api/v1/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  await authService.resetPassword(token, newPassword);

  res.json(successResponse('Password reset successful'));
});

/**
 * Get current user
 * GET /api/v1/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  // User is already attached by authenticate middleware
  res.json(
    successResponse('User retrieved', {
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        organization: req.user.organization,
      },
    })
  );
});

module.exports = {
  checkSubdomain,
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
