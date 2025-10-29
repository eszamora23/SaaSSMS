/**
 * Express Application Setup
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const bodyParser = require('body-parser');
const corsMiddleware = require('./middleware/cors');
const { addRequestId, requestLogger, detailedLogger } = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const config = require('./config');
const logger = require('./utils/logger');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(corsMiddleware);

// Compression
app.use(compression());

// Request parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and logging
app.use(addRequestId);
app.use(requestLogger);

if (config.env === 'development') {
  app.use(detailedLogger);
}

// Trust proxy (for accurate IP addresses behind load balancers)
app.set('trust proxy', 1);

// API Routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

logger.info('Express application configured');

module.exports = app;
