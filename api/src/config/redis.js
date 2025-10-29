/**
 * Redis Connection Configuration
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient = null;

/**
 * Connect to Redis
 */
const connectRedis = async () => {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn(`Retrying Redis connection (attempt ${times}), delay: ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Reconnect on READONLY error
          return true;
        }
        return false;
      },
      // Connection timeout
      connectTimeout: 10000,
      // Keep alive
      keepAlive: 30000,
    });

    // Event listeners
    redisClient.on('connect', () => {
      logger.info('Redis connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis connected and ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', {
        error: err.message,
        code: err.code,
      });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Test connection
    await redisClient.ping();
    logger.info('Redis connection successful');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await redisClient.quit();
      logger.info('Redis connection closed through app termination');
    });

    return redisClient;

  } catch (error) {
    logger.error('Redis connection failed:', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

/**
 * Disconnect from Redis
 */
const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};

/**
 * Check if Redis is connected
 */
const isRedisConnected = () => {
  return redisClient && redisClient.status === 'ready';
};

module.exports = {
  connectRedis,
  getRedisClient,
  disconnectRedis,
  isRedisConnected,
};
