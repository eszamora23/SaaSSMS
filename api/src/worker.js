/**
 * Background Worker
 * Processes Bull queue jobs
 */

require('dotenv').config();

const connectDB = require('./db/connection');
const config = require('./config');
const logger = require('./utils/logger');

// Import queues
const { smsQueue, reminderQueue, webhookQueue, cleanupQueue } = require('./queues');

// Import job processors
const processSMSJob = require('./queues/jobs/smsJob');
const processReminderJob = require('./queues/jobs/reminderJob');
const processWebhookJob = require('./queues/jobs/webhookJob');
const processCleanupJob = require('./queues/jobs/cleanupJob');

/**
 * Start background worker
 */
const startWorker = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Setup queue processors
    smsQueue.process(5, processSMSJob); // Process 5 SMS jobs concurrently
    reminderQueue.process(3, processReminderJob); // Process 3 reminder jobs concurrently
    webhookQueue.process(10, processWebhookJob); // Process 10 webhook jobs concurrently
    cleanupQueue.process(1, processCleanupJob); // Process 1 cleanup job at a time

    logger.info('Background worker started', {
      env: config.env,
      queues: ['sms', 'reminders', 'webhooks', 'cleanup'],
    });

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   SaaS SMS Calendar Background Worker                    ║
║                                                           ║
║   Environment: ${config.env.padEnd(43)}║
║   MongoDB:     Connected                                  ║
║   Redis:       Connected                                  ║
║                                                           ║
║   Processing Queues:                                      ║
║   - SMS (concurrency: 5)                                  ║
║   - Reminders (concurrency: 3)                            ║
║   - Webhooks (concurrency: 10)                            ║
║   - Cleanup (concurrency: 1)                              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Schedule cleanup job to run daily at 2 AM
    cleanupQueue.add(
      { type: 'all' },
      {
        repeat: {
          cron: '0 2 * * *', // 2 AM every day
        },
        jobId: 'daily-cleanup',
      }
    );

    logger.info('Cleanup job scheduled (daily at 2 AM)');

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start worker', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  // Close queues
  await Promise.all([
    smsQueue.close(),
    reminderQueue.close(),
    webhookQueue.close(),
    cleanupQueue.close(),
  ]);

  logger.info('Bull queues closed');

  // Close database connection
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  logger.info('Graceful shutdown complete');
  process.exit(0);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise,
  });
  process.exit(1);
});

// Start the worker
startWorker();
