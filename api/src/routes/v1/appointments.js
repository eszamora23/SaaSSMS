/**
 * Appointments Routes
 * /api/v1/appointments
 */

const express = require('express');
const router = express.Router();
const appointmentsController = require('../../controllers/appointmentsController');
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
const createAppointmentSchema = {
  body: z.object({
    serviceId: z.string(),
    workerId: z.string(),
    customerId: z.string().optional(),
    startTime: z.string(),
    customerData: z.object({
      phone: z.string(),
      name: z.string(),
      email: z.string().email().optional(),
      profile: z.object({}).passthrough().optional(),
    }).optional(),
    sendConfirmation: z.boolean().optional(),
    notes: z.string().optional(),
    metadata: z.object({}).passthrough().optional(),
  }),
};

const rescheduleSchema = {
  body: z.object({
    newStartTime: z.string(),
  }),
};

const cancelSchema = {
  body: z.object({
    reason: z.string().optional(),
    sendNotification: z.boolean().optional(),
  }),
};

const completeSchema = {
  body: z.object({
    notes: z.string().optional(),
  }),
};

// Routes
router.post('/', validateRequest(createAppointmentSchema), appointmentsController.createAppointment);
router.get('/', appointmentsController.getAppointments);
router.get('/:id', appointmentsController.getAppointment);
router.patch('/:id', appointmentsController.updateAppointment);
router.post('/:id/reschedule', validateRequest(rescheduleSchema), appointmentsController.rescheduleAppointment);
router.post('/:id/cancel', validateRequest(cancelSchema), appointmentsController.cancelAppointment);
router.post('/:id/confirm', appointmentsController.confirmAppointment);
router.post('/:id/complete', validateRequest(completeSchema), appointmentsController.completeAppointment);
router.post('/:id/no-show', appointmentsController.markNoShow);

module.exports = router;
