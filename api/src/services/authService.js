/**
 * Authentication Service
 * Handles user registration, login, and token management
 */

const { Organization, User, AuditLog } = require('../models');
const {
  generateTokenPair,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
} = require('../utils/tokenGenerator');
const {
  UnauthorizedError,
  ValidationError,
  ConflictError,
  NotFoundError,
} = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Check if subdomain (slug) is available
 */
const checkSubdomainAvailability = async (subdomain) => {
  const slugify = require('slugify');

  // Normalize subdomain
  const normalizedSlug = slugify(subdomain, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });

  // Check if it exists
  const existing = await Organization.findOne({ slug: normalizedSlug });

  return !existing;
};

/**
 * Register new organization and admin user
 */
const registerOrganization = async (data) => {
  const { email, password, organizationName, subdomain, country, timezone } = data;

  // Check if email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  try {
    // Use provided subdomain (already validated by route schema)
    const slugify = require('slugify');
    const slug = slugify(subdomain, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Check if subdomain is already taken
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      throw new ConflictError('Subdomain already taken');
    }

    // Create organization
    const organization = await Organization.create({
      name: organizationName,
      slug,
      email: email.toLowerCase(),
      country: country || 'US',
      timezone: timezone || 'America/New_York',
      status: 'pending', // Will be activated after email verification (or immediately if disabled)
    });

    logger.info('Organization created', {
      orgId: organization._id,
      orgSlug: organization.slug,
      name: organizationName,
    });

    // Check if email verification is required (default is false)
    const emailVerificationRequired = organization.settings?.emailVerificationRequired ?? false;

    // Create admin user
    const user = await User.create({
      orgId: organization._id,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      profile: {
        firstName: organizationName.split(' ')[0] || 'Admin',
        lastName: organizationName.split(' ')[1] || 'User',
      },
      role: 'admin',
      status: emailVerificationRequired ? 'invited' : 'active', // Auto-activate if verification disabled
    });

    logger.info('Admin user created', {
      userId: user._id,
      orgId: organization._id,
      email: user.email,
    });

    let verificationToken = null;

    if (emailVerificationRequired) {
      // Generate email verification token only if required
      verificationToken = generateRandomToken();
      const hashedToken = hashToken(verificationToken);

      user.auth.emailVerificationToken = hashedToken;
      user.auth.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await user.save();

      // TODO: Send verification email (implement email service)
      logger.info('Email verification token generated', {
        userId: user._id,
        email: user.email,
      });
    } else {
      // Auto-activate organization and user
      organization.status = 'active';
      await organization.save();

      logger.info('Organization and user auto-activated (email verification disabled)', {
        userId: user._id,
        orgId: organization._id,
        email: user.email,
      });
    }

    // Log audit
    await AuditLog.log({
      orgId: organization._id,
      actor: { userId: user._id, email: user.email, role: 'admin', type: 'user' },
      action: 'create',
      entityType: 'organization',
      entityId: organization._id,
      metadata: { method: 'API' },
    });

    return {
      organization,
      user,
      verificationToken, // Return for testing (in production, only send via email)
    };
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    throw error;
  }
};

/**
 * Verify email address
 */
const verifyEmail = async (token) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    'auth.emailVerificationToken': hashedToken,
    'auth.emailVerificationExpires': { $gt: Date.now() },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired verification token');
  }

  // Activate user and organization
  user.status = 'active';
  user.auth.emailVerificationToken = undefined;
  user.auth.emailVerificationExpires = undefined;
  await user.save();

  const organization = await Organization.findById(user.orgId);
  if (organization && organization.status === 'pending') {
    organization.status = 'active';
    await organization.save();
  }

  logger.info('Email verified', {
    userId: user._id,
    email: user.email,
    orgId: user.orgId,
  });

  return user;
};

/**
 * Login user
 */
const login = async ({ email, password, mfaCode }) => {
  // Find user
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +auth.mfaSecret').populate('orgId');

  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check if user is active
  if (user.status !== 'active') {
    throw new UnauthorizedError('Account not activated. Please verify your email.');
  }

  // Check if organization is active
  if (user.orgId.status !== 'active') {
    throw new UnauthorizedError('Organization account is not active');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Check MFA if enabled
  if (user.auth.mfaEnabled) {
    if (!mfaCode) {
      throw new ValidationError('MFA code required');
    }

    // TODO: Verify TOTP code (implement MFA verification)
    // const isValidMFA = verifyTOTP(user.auth.mfaSecret, mfaCode);
    // if (!isValidMFA) {
    //   throw new UnauthorizedError('Invalid MFA code');
    // }
  }

  logger.info('User logged in', {
    userId: user._id,
    email: user.email,
    orgId: user.orgId._id,
  });

  // Log audit
  await AuditLog.log({
    orgId: user.orgId._id,
    actor: { userId: user._id, email: user.email, role: user.role, type: 'user' },
    action: 'login',
    entityType: 'user',
    entityId: user._id,
    metadata: { method: 'API' },
  });

  return user;
};

/**
 * Refresh access token
 */
const refreshTokens = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new token pair
    const tokens = await generateTokenPair(user);

    logger.debug('Tokens refreshed', {
      userId: user._id,
      orgId: user.orgId,
    });

    return tokens;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

/**
 * Request password reset
 */
const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Don't reveal if user exists (security best practice)
  if (!user) {
    logger.info('Password reset requested for non-existent email', { email });
    return { message: 'If account exists, password reset email will be sent' };
  }

  // Generate reset token
  const resetToken = generateRandomToken();
  const hashedToken = hashToken(resetToken);

  user.auth.passwordResetToken = hashedToken;
  user.auth.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // TODO: Send password reset email
  logger.info('Password reset token generated', {
    userId: user._id,
    email: user.email,
  });

  return {
    message: 'If account exists, password reset email will be sent',
    resetToken, // Return for testing (in production, only send via email)
  };
};

/**
 * Reset password
 */
const resetPassword = async (token, newPassword) => {
  const hashedToken = hashToken(token);

  const user = await User.findOne({
    'auth.passwordResetToken': hashedToken,
    'auth.passwordResetExpires': { $gt: Date.now() },
  });

  if (!user) {
    throw new ValidationError('Invalid or expired reset token');
  }

  // Update password
  user.passwordHash = newPassword; // Will be hashed by pre-save hook
  user.auth.passwordResetToken = undefined;
  user.auth.passwordResetExpires = undefined;
  await user.save();

  logger.info('Password reset successful', {
    userId: user._id,
    email: user.email,
  });

  // Log audit
  await AuditLog.log({
    orgId: user.orgId,
    actor: { userId: user._id, email: user.email, role: user.role, type: 'user' },
    action: 'update',
    entityType: 'user',
    entityId: user._id,
    metadata: { method: 'API', action: 'password_reset' },
  });

  return user;
};

module.exports = {
  checkSubdomainAvailability,
  registerOrganization,
  verifyEmail,
  login,
  refreshTokens,
  requestPasswordReset,
  resetPassword,
};
