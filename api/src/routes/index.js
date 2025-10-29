/**
 * Main Routes
 */

const express = require('express');
const router = express.Router();

// Import route modules
const v1Routes = require('./v1');
const webhooksRoutes = require('./webhooks');
const publicRoutes = require('./public');

// Mount routes
router.use('/api/v1', v1Routes);
router.use('/webhooks', webhooksRoutes);
router.use('/public', publicRoutes);

// Root health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SaaS SMS Calendar API',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

module.exports = router;
