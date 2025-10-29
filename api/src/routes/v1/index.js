/**
 * API v1 Routes
 * /api/v1
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const customersRoutes = require('./customers');
const appointmentsRoutes = require('./appointments');
const messagesRoutes = require('./messages');
const threadsRoutes = require('./threads');
const servicesRoutes = require('./services');
const usersRoutes = require('./users');
const numbersRoutes = require('./numbers');
const availabilityRoutes = require('./availability');
const webhookEndpointsRoutes = require('./webhook-endpoints');
const organizationRoutes = require('./organization');
const publicRoutes = require('./public');
const googleCalendarRoutes = require('./googleCalendar');

// Mount routes
router.use('/auth', authRoutes);
router.use('/customers', customersRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/messages', messagesRoutes);
router.use('/threads', threadsRoutes);
router.use('/services', servicesRoutes);
router.use('/users', usersRoutes);
router.use('/numbers', numbersRoutes);
router.use('/availability', availabilityRoutes);
router.use('/webhook-endpoints', webhookEndpointsRoutes);
router.use('/organization', organizationRoutes);
router.use('/public', publicRoutes);
router.use('/google-calendar', googleCalendarRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
