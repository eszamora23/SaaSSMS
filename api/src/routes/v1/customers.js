/**
 * Customers Routes
 * /api/v1/customers
 */

const express = require('express');
const router = express.Router();
const customersController = require('../../controllers/customersController');
const { authenticate } = require('../../middleware/authenticate');
const { authorize, requireWorkerOrAdmin } = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const { validateRequest } = require('../../middleware/validateRequest');
const { z } = require('zod');

// All routes require authentication and tenant scoping
router.use(authenticate);
router.use(tenantScope);
router.use(requireWorkerOrAdmin);

// Validation schemas
const createCustomerSchema = {
  body: z.object({
    phone: z.string(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    profile: z.object({}).passthrough().optional(),
    consents: z.object({
      smsOptIn: z.boolean().optional(),
      emailOptIn: z.boolean().optional(),
      smsOptInMethod: z.string().optional(),
      emailOptInMethod: z.string().optional(),
    }).optional(),
  }),
};

const updateCustomerSchema = {
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    profile: z.object({}).passthrough().optional(),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
};

const updateConsentsSchema = {
  body: z.object({
    smsOptIn: z.boolean().optional(),
    emailOptIn: z.boolean().optional(),
    method: z.string().optional(),
  }),
};

const mergeCustomersSchema = {
  body: z.object({
    duplicateCustomerId: z.string(),
  }),
};

const bulkImportSchema = {
  body: z.object({
    customers: z.array(z.object({
      phone: z.string(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      profile: z.object({}).passthrough().optional(),
      tags: z.array(z.string()).optional(),
      smsOptIn: z.boolean().optional(),
    })),
  }),
};

// Routes
router.post('/', validateRequest(createCustomerSchema), customersController.createCustomer);
router.get('/', customersController.getCustomers);
router.get('/:id', customersController.getCustomer);
router.patch('/:id', validateRequest(updateCustomerSchema), customersController.updateCustomer);
router.patch('/:id/consents', validateRequest(updateConsentsSchema), customersController.updateConsents);
router.delete('/:id', customersController.deleteCustomer);
router.post('/:id/merge', validateRequest(mergeCustomersSchema), customersController.mergeCustomers);
router.get('/:id/stats', customersController.getCustomerStats);
router.post('/import', validateRequest(bulkImportSchema), customersController.bulkImport);

module.exports = router;
