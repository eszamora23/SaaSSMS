/**
 * Bull Queue Configuration
 * Background job processing
 */

const Queue = require('bull');
const config = require('../config');
const logger = require('../utils/logger');

// Queue options
const defaultOptions = {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis unavailable for queues, using fallback (jobs will be lost on restart)');
        return null; // Stop retrying
      }
      return Math.min(times * 1000, 3000);
    },
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500, // Keep last 500 failed jobs
  },
};

// Create queues
const smsQueue = new Queue('sms', defaultOptions);
const reminderQueue = new Queue('reminders', defaultOptions);
const webhookQueue = new Queue('webhooks', defaultOptions);
const cleanupQueue = new Queue('cleanup', defaultOptions);

// Queue event handlers
const errorCounts = {};
const setupQueueEventHandlers = (queue, queueName) => {
  errorCounts[queueName] = 0;

  queue.on('completed', (job, result) => {
    logger.debug(`${queueName} job completed`, {
      jobId: job.id,
      result,
    });
  });

  queue.on('failed', (job, err) => {
    logger.error(`${queueName} job failed`, {
      jobId: job.id,
      error: err.message,
      attempts: job.attemptsMade,
    });
  });

  queue.on('stalled', (job) => {
    logger.warn(`${queueName} job stalled`, {
      jobId: job.id,
    });
  });

  queue.on('error', (error) => {
    // Only log first few errors to avoid spam
    if (errorCounts[queueName] < 2) {
      logger.error(`${queueName} queue error`, {
        error: error.message,
      });
      errorCounts[queueName]++;

      if (errorCounts[queueName] === 2) {
        logger.warn(`${queueName} queue: suppressing further connection errors (Redis may be unavailable)`);
      }
    }
  });
};

// Setup event handlers for all queues
setupQueueEventHandlers(smsQueue, 'SMS');
setupQueueEventHandlers(reminderQueue, 'Reminder');
setupQueueEventHandlers(webhookQueue, 'Webhook');
setupQueueEventHandlers(cleanupQueue, 'Cleanup');

logger.info('Bull queues initialized');

module.exports = {
  smsQueue,
  reminderQueue,
  webhookQueue,
  cleanupQueue,
};
