/**
 * Webhook Endpoints Routes
 * /api/v1/webhook-endpoints
 */

const express = require('express');
const router = express.Router();
const webhookEndpointsController = require('../../controllers/webhookEndpointsController');
const { authenticate } = require('../../middleware/authenticate');
const { requireAdmin } = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const { validateRequest } = require('../../middleware/validateRequest');
const { z } = require('zod');

// All routes require authentication and tenant scoping
router.use(authenticate);
router.use(tenantScope);
router.use(requireAdmin);

// Validation schemas
const registerWebhookSchema = {
  body: z.object({
    url: z.string().url(),
    events: z.array(z.string()).min(1),
    description: z.string().optional(),
    secret: z.string().optional(),
  }),
};

const updateWebhookSchema = {
  body: z.object({
    url: z.string().url().optional(),
    events: z.array(z.string()).min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'disabled']).optional(),
  }),
};

// Routes
router.post('/', validateRequest(registerWebhookSchema), webhookEndpointsController.registerWebhook);
router.get('/', webhookEndpointsController.getWebhooks);
router.get('/:id', webhookEndpointsController.getWebhook);
router.patch('/:id', validateRequest(updateWebhookSchema), webhookEndpointsController.updateWebhook);
router.delete('/:id', webhookEndpointsController.deleteWebhook);
router.post('/:id/test', webhookEndpointsController.testWebhook);
router.get('/:id/logs', webhookEndpointsController.getWebhookLogs);

module.exports = router;
