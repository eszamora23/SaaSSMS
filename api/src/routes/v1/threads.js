/**
 * Threads Routes
 * /api/v1/threads
 */

const express = require('express');
const router = express.Router();
const messagesController = require('../../controllers/messagesController');
const { authenticate } = require('../../middleware/authenticate');
const { requireWorkerOrAdmin } = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const { validateRequest } = require('../../middleware/validateRequest');
const { z } = require('zod');

// All routes require authentication and tenant scoping
router.use(authenticate);
router.use(tenantScope);
router.use(requireWorkerOrAdmin);

// Validation schemas
const assignThreadSchema = {
  body: z.object({
    userId: z.string(),
  }),
};

const updateThreadSchema = {
  body: z.object({
    status: z.enum(['open', 'closed']).optional(),
    assignedTo: z.string().optional(),
  }),
};

// Thread routes
router.get('/', messagesController.getThreads);
router.get('/:id', messagesController.getThread);
router.get('/:id/messages', messagesController.getThreadMessages);
router.post('/:id/assign', validateRequest(assignThreadSchema), messagesController.assignThread);
router.post('/:id/mark-read', messagesController.markThreadRead);
router.patch('/:id', validateRequest(updateThreadSchema), messagesController.updateThread);

module.exports = router;
