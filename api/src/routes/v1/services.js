/**
 * Services Routes
 * /api/v1/services
 */

const express = require('express');
const router = express.Router();
const servicesController = require('../../controllers/servicesController');
const { authenticate } = require('../../middleware/authenticate');
const { requireAdmin } = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const { validateRequest } = require('../../middleware/validateRequest');
const { z } = require('zod');

// All routes require authentication and tenant scoping
router.use(authenticate);
router.use(tenantScope);

// Validation schemas
const createServiceSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    durationMinutes: z.number().positive('Duration must be positive'),
    priceAmount: z.number().nonnegative().optional(),
    priceCurrency: z.string().optional(),
    displayFreeLabel: z.boolean().optional(),
    bufferBefore: z.number().nonnegative().optional(),
    bufferAfter: z.number().nonnegative().optional(),
    maxSlotsPerTimeSlot: z.number().int().min(1).max(100).optional(),
    location: z.enum(['in-person', 'virtual', 'phone']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    color: z.string().optional(),
    bookingSettings: z.object({}).passthrough().optional(),
  }),
};

const updateServiceSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    durationMinutes: z.number().positive().optional(),
    priceAmount: z.number().nonnegative().optional(),
    priceCurrency: z.string().optional(),
    displayFreeLabel: z.boolean().optional(),
    bufferBefore: z.number().nonnegative().optional(),
    bufferAfter: z.number().nonnegative().optional(),
    maxSlotsPerTimeSlot: z.number().int().min(1).max(100).optional(),
    location: z.enum(['in-person', 'virtual', 'phone']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    color: z.string().optional(),
    bookingSettings: z.object({}).passthrough().optional(),
  }),
};

// Routes
router.post('/', requireAdmin, validateRequest(createServiceSchema), servicesController.createService);
router.get('/', servicesController.getServices);
router.get('/:id', servicesController.getService);
router.patch('/:id', requireAdmin, validateRequest(updateServiceSchema), servicesController.updateService);
router.delete('/:id', requireAdmin, servicesController.deleteService);

module.exports = router;
