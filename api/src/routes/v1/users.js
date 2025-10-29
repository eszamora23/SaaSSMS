/**
 * Users Routes
 * /api/v1/users
 */

const express = require('express');
const router = express.Router();
const usersController = require('../../controllers/usersController');
const { authenticate } = require('../../middleware/authenticate');
const { requireAdmin, requireWorkerOrAdmin } = require('../../middleware/authorize');
const { tenantScope } = require('../../middleware/tenantScope');
const { validateRequest } = require('../../middleware/validateRequest');
const { z } = require('zod');

// All routes require authentication and tenant scoping
router.use(authenticate);
router.use(tenantScope);

// Validation schemas
const createUserSchema = {
  body: z.object({
    email: z.string().email(),
    role: z.enum(['admin', 'worker']),
    profile: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    }).optional(),
    workerProfile: z.object({
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),
      bookingEnabled: z.boolean().optional(),
      serviceIds: z.array(z.string()).optional(),
    }).optional(),
  }),
};

const updateUserSchema = {
  body: z.object({
    profile: z.object({}).passthrough().optional(),
    role: z.enum(['admin', 'worker']).optional(),
    status: z.enum(['active', 'inactive', 'invited']).optional(),
    workerProfile: z.object({}).passthrough().optional(),
  }),
};

const updateAvailabilitySchema = {
  body: z.object({
    availability: z.array(z.object({
      dayOfWeek: z.number().min(0).max(6),
      start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })),
  }),
};

// Routes
router.post('/', requireAdmin, validateRequest(createUserSchema), usersController.createUser);
router.get('/', requireWorkerOrAdmin, usersController.getUsers);
router.get('/:id', requireWorkerOrAdmin, usersController.getUser);
router.patch('/:id', requireAdmin, validateRequest(updateUserSchema), usersController.updateUser);
router.delete('/:id', requireAdmin, usersController.deleteUser);
router.get('/:id/schedule', requireWorkerOrAdmin, usersController.getWorkerSchedule);
router.put('/:id/availability', requireAdmin, validateRequest(updateAvailabilitySchema), usersController.updateWorkerAvailability);

module.exports = router;
