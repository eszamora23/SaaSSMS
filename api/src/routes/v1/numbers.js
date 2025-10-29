/**
 * Phone Numbers Routes
 * /api/v1/numbers
 */

const express = require('express');
const router = express.Router();
const numbersController = require('../../controllers/numbersController');
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
const purchaseNumberSchema = {
  body: z.object({
    phoneNumber: z.string(),
    friendlyName: z.string().optional(),
  }),
};

const updateNumberSchema = {
  body: z.object({
    friendlyName: z.string().optional(),
    assignedTo: z.string().nullable().optional(),
    isIVRNumber: z.boolean().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
};

// Routes
router.get('/search', numbersController.searchNumbers);
router.post('/', validateRequest(purchaseNumberSchema), numbersController.purchaseNumber);
router.get('/', numbersController.getNumbers);
router.get('/:id', numbersController.getNumber);
router.patch('/:id', validateRequest(updateNumberSchema), numbersController.updateNumber);
router.delete('/:id', numbersController.releaseNumber);

module.exports = router;
