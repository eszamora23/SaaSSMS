/**
 * HTTP Server with Socket.IO
 * Main entry point for the API server
 */

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
const { connectDB } = require('./db/connection');
const config = require('./config');
const logger = require('./utils/logger');
const { setupWebhookListeners } = require('./services/webhookService');
const { reminderQueue } = require('./queues');

const PORT = config.port || 4000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Make io available to the app
app.set('io', io);

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Setup webhook event listeners
    setupWebhookListeners();

    // Schedule recurring jobs
    await scheduleRecurringJobs();

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`Server started`, {
        port: PORT,
        env: config.env,
        nodeVersion: process.version,
      });

      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   SaaS SMS Calendar API Server                           ║
║                                                           ║
║   Environment: ${config.env.padEnd(43)}║
║   Port:        ${PORT.toString().padEnd(43)}║
║   MongoDB:     Connected                                  ║
║   Socket.IO:   Enabled                                    ║
║                                                           ║
║   API:         http://localhost:${PORT}/api/v1${' '.repeat(18)}║
║   Health:      http://localhost:${PORT}/health${' '.repeat(20)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

/**
 * Schedule recurring background jobs
 */
const scheduleRecurringJobs = async () => {
  try {
    // Schedule appointment reminders
    // Run every hour to check for upcoming appointments
    await reminderQueue.add(
      { reminderWindow: 24 }, // 24 hours ahead
      {
        repeat: {
          cron: '0 * * * *', // Every hour
        },
        jobId: 'reminder-24h',
      }
    );

    // Also schedule 1-hour reminders
    await reminderQueue.add(
      { reminderWindow: 1 },
      {
        repeat: {
          cron: '*/15 * * * *', // Every 15 minutes
        },
        jobId: 'reminder-1h',
      }
    );

    logger.info('Recurring jobs scheduled');
  } catch (error) {
    logger.warn('Could not schedule recurring jobs (Redis may be unavailable)', {
      error: error.message,
    });
  }
};

/**
 * Graceful shutdown
 */
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close Socket.IO
  io.close(() => {
    logger.info('Socket.IO closed');
  });

  // Close database connection
  const mongoose = require('mongoose');
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');

  // Close Redis connections
  const { smsQueue, reminderQueue, webhookQueue, cleanupQueue } = require('./queues');
  await Promise.all([
    smsQueue.close(),
    reminderQueue.close(),
    webhookQueue.close(),
    cleanupQueue.close(),
  ]);
  logger.info('Bull queues closed');

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

// Start the server
startServer();
 
