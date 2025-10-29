/**
 * Token Generation Utilities
 * JWT tokens, random tokens, hashing
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-change-this';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-this';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

const signJWT = promisify(jwt.sign);
const verifyJWT = promisify(jwt.verify);

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = async (payload) => {
  const token = await signJWT(
    {
      userId: payload.userId,
      orgId: payload.orgId,
      role: payload.role,
      type: 'access',
    },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );

  return token;
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = async (payload) => {
  const token = await signJWT(
    {
      userId: payload.userId,
      orgId: payload.orgId,
      type: 'refresh',
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );

  return token;
};

/**
 * Generate token pair (access + refresh)
 */
const generateTokenPair = async (user) => {
  const payload = {
    userId: user._id.toString(),
    orgId: user.orgId._id ? user.orgId._id.toString() : user.orgId.toString(),
    role: user.role,
  };

  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
const verifyAccessToken = async (token) => {
  try {
    const decoded = await verifyJWT(token, JWT_ACCESS_SECRET);
    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (token) => {
  try {
    const decoded = await verifyJWT(token, JWT_REFRESH_SECRET);
    return decoded;
  } catch (error) {
    throw error;
  }
};

/**
 * Generate random token (email verification, password reset)
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash token for storage (SHA256)
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate reschedule/cancel token for appointments
 */
const generateAppointmentToken = async (appointmentId, expiresIn = '30d') => {
  const token = await signJWT(
    {
      appointmentId: appointmentId.toString(),
      type: 'appointment',
    },
    JWT_ACCESS_SECRET,
    { expiresIn }
  );

  return token;
};

/**
 * Verify appointment token
 */
const verifyAppointmentToken = async (token) => {
  try {
    const decoded = await verifyJWT(token, JWT_ACCESS_SECRET);

    if (decoded.type !== 'appointment') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
  generateAppointmentToken,
  verifyAppointmentToken,
};
