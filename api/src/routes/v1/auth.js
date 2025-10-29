/**
 * Auth Routes
 * /api/v1/auth
 */

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const { authenticate, optionalAuth } = require('../../middleware/authenticate');
const { validateRequest } = require('../../middleware/validateRequest');
const rateLimiter = require('../../middleware/rateLimiter');
const { z } = require('zod');

// Validation schemas
const registerSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    organizationName: z.string().min(2),
    subdomain: z.string().min(2).max(63).regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      'Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen'),
    country: z.string().optional(),
    timezone: z.string().optional(),
  }),
};

const checkSubdomainSchema = {
  query: z.object({
    subdomain: z.string().min(2).max(63),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string(),
    mfaCode: z.string().optional(),
  }),
};

const verifyEmailSchema = {
  body: z.object({
    token: z.string(),
  }),
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string(),
  }),
};

const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email(),
  }),
};

const resetPasswordSchema = {
  body: z.object({
    token: z.string(),
    newPassword: z.string().min(8),
  }),
};

// Routes
// Subdomain availability check - defined inline to avoid module loading issues
router.get(
  '/check-subdomain',
  validateRequest(checkSubdomainSchema),
  async (req, res, next) => {
    // Import at runtime to avoid circular dependency
    const authService = require('../../services/authService');
    const { successResponse } = require('../../utils/response');

    try {
      const { subdomain } = req.query;
      const isAvailable = await authService.checkSubdomainAvailability(subdomain);

      res.json(
        successResponse('Subdomain availability checked', {
          subdomain,
          available: isAvailable,
        })
      );
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/register',
  rateLimiter.register,
  validateRequest(registerSchema),
  authController.register
);

router.post(
  '/verify-email',
  validateRequest(verifyEmailSchema),
  authController.verifyEmail
);

router.post(
  '/login',
  rateLimiter.auth,
  validateRequest(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  validateRequest(refreshSchema),
  authController.refresh
);

router.post('/logout', authenticate, authController.logout);

router.post(
  '/forgot-password',
  rateLimiter.passwordReset,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  rateLimiter.passwordReset,
  validateRequest(resetPasswordSchema),
  authController.resetPassword
);

router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
