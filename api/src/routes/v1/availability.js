/**
 * Availability Routes
 * /api/v1/availability
 */

const express = require('express');
const router = express.Router();
const availabilityController = require('../../controllers/availabilityController');
const { authenticate } = require('../../middleware/authenticate');
const { requireWorkerOrAdmin } = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');

// All routes require authentication and tenant scoping
router.use(authenticate);
router.use(tenantScope);
router.use(requireWorkerOrAdmin);

// Routes
router.get('/slots', availabilityController.getAvailableSlots);
router.get('/check', availabilityController.checkSlotAvailability);
router.get('/next', availabilityController.getNextAvailableSlot);

module.exports = router;
