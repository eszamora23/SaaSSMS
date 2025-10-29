/**
 * Organization Routes
 * /api/v1/organization
 */

const express = require('express');
const router = express.Router();
const organizationController = require('../../controllers/organizationController');
const { authenticate } = require('../../middleware/authenticate');
const { requireAdmin, requireWorkerOrAdmin } = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const { validateRequest } = require('../../middleware/validateRequest');
const { updateTwilioConfigSchema } = require('../../validators/organizationSchemas');
const { z } = require('zod');

// All routes require authentication and tenant scoping
router.use(authenticate);
router.use(tenantScope);

// Validation schemas
const updateOrganizationSchema = {
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    address: z.object({}).passthrough().optional(),
    timezone: z.string().optional(),
    country: z.string().optional(),
    businessHours: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      start: z.string(),
      end: z.string(),
    })).optional(),
    branding: z.object({}).passthrough().optional(),
    settings: z.object({}).passthrough().optional(),
  }),
};

// Routes
router.get('/', requireWorkerOrAdmin, organizationController.getOrganization);
router.patch('/', requireAdmin, validateRequest(updateOrganizationSchema), organizationController.updateOrganization);
router.get('/stats', requireWorkerOrAdmin, organizationController.getOrganizationStats);

// Twilio Configuration Routes (Admin only)
router.get('/twilio-config', requireAdmin, organizationController.getTwilioConfigStatus);
router.patch('/twilio-config', requireAdmin, validateRequest(updateTwilioConfigSchema), organizationController.updateTwilioConfig);
router.post('/twilio-config/validate', requireAdmin, organizationController.validateTwilioConfig);
router.post('/twilio-config/fetch-numbers', requireAdmin, organizationController.fetchTwilioNumbers);
router.post('/twilio-config/import-numbers', requireAdmin, organizationController.importTwilioNumbers);

module.exports = router;
