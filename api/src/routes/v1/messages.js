/**
 * Messages Routes
 * /api/v1/messages
 * /api/v1/threads
 */

const express = require('express');
const router = express.Router();
const messagesController = require('../../controllers/messagesController');
const { authenticate } = require('../../middleware/authenticate');
const { requireWorkerOrAdmin } = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const { validateRequest } = require('../../middleware/validateRequest');
const rateLimiter = require('../../middleware/rateLimiter');
const { z } = require('zod');

// All routes require authentication and tenant scoping
router.use(authenticate);
router.use(tenantScope);
router.use(requireWorkerOrAdmin);

// Validation schemas
const sendMessageSchema = {
  body: z.object({
    to: z.string(),
    from: z.string().optional(),
    body: z.string(),
    threadId: z.string().optional(),
    mediaUrls: z.array(z.string()).optional(),
    customerId: z.string().optional(),
    metadata: z.object({}).passthrough().optional(),
  }),
};

const assignThreadSchema = {
  body: z.object({
    userId: z.string(),
  }),
};

// Message routes
router.post('/', rateLimiter.smsSending, validateRequest(sendMessageSchema), messagesController.sendMessage);
router.post('/send', rateLimiter.smsSending, validateRequest(sendMessageSchema), messagesController.sendMessage);
router.get('/', messagesController.getMessages);
router.get('/search', messagesController.searchMessages);
router.get('/:id', messagesController.getMessage);

// Thread routes
router.get('/threads/all', messagesController.getThreads);
router.get('/threads/:id', messagesController.getThread);
router.post('/threads/:id/assign', validateRequest(assignThreadSchema), messagesController.assignThread);
router.post('/threads/:id/read', messagesController.markThreadRead);
router.patch('/threads/:id', messagesController.updateThread);

module.exports = router;
