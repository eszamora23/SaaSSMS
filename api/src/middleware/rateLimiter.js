/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request rates
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');
const { RateLimitError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Create Redis store for rate limiting
 * Falls back to memory store if Redis unavailable
 */
const createStore = (prefix) => {
  try {
    const redisClient = getRedisClient();
    return new RedisStore({
      client: redisClient,
      prefix: `rl:${prefix}:`,
    });
  } catch (error) {
    logger.warn('Redis not available for rate limiting, using memory store', {
      error: error.message,
    });
    // Will use default memory store
    return undefined;
  }
};

/**
 * Standard handler for rate limit exceeded
 */
const rateLimitHandler = (req, res, next, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  next(new RateLimitError(options.message, retryAfter));
};

/**
 * Global rate limiter (all API endpoints)
 */
const global = rateLimit({
  store: createStore('global'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  },
});

/**
 * Auth endpoints (stricter)
 */
const auth = rateLimit({
  store: createStore('auth'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login attempts, please try again later',
  handler: rateLimitHandler,
});

/**
 * Registration endpoint (very strict)
 */
const register = rateLimit({
  store: createStore('register'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 registrations per hour per IP
  message: 'Too many registration attempts, please try again later',
  handler: rateLimitHandler,
});

/**
 * API key based rate limiting (per organization)
 */
const apiKey = rateLimit({
  store: createStore('apikey'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour per API key
  keyGenerator: (req) => {
    // Use API key ID as the key
    return req.apiKey?.id || req.ip;
  },
  message: 'API rate limit exceeded',
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip if not using API key
    return !req.apiKey;
  },
});

/**
 * Public booking endpoints
 */
const publicBooking = rateLimit({
  store: createStore('booking'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 bookings per hour per IP (prevent abuse)
  message: 'Too many booking attempts, please try again later',
  handler: rateLimitHandler,
});

/**
 * SMS sending (prevent spam)
 */
const smsSending = rateLimit({
  store: createStore('sms'),
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 SMS per minute per user
  keyGenerator: (req) => {
    // Rate limit per user, not IP
    return req.user?.id || req.ip;
  },
  message: 'Too many SMS messages, please slow down',
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip for admins
    return req.user?.role === 'admin';
  },
});

/**
 * Password reset (prevent abuse)
 */
const passwordReset = rateLimit({
  store: createStore('password-reset'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 password reset requests per hour
  message: 'Too many password reset requests, please try again later',
  handler: rateLimitHandler,
});

/**
 * Custom rate limiter factory
 */
const createRateLimiter = (options) => {
  return rateLimit({
    store: createStore(options.prefix || 'custom'),
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: options.message || 'Too many requests',
    handler: rateLimitHandler,
    ...options,
  });
};

module.exports = {
  global,
  auth,
  register,
  apiKey,
  publicBooking,
  smsSending,
  passwordReset,
  createRateLimiter,
};
