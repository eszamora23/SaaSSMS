/**
 * Public Booking Routes
 * /public/:orgSlug
 */

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { extractSubdomain } = require('../middleware/tenantScope');
const { validateRequest } = require('../middleware/validateRequest');
const rateLimiter = require('../middleware/rateLimiter');
const { z } = require('zod');

// Validation schemas
const createBookingSchema = {
  body: z.object({
    serviceId: z.string(),
    workerId: z.string(),
    startTime: z.string(),
    customer: z.object({
      phone: z.string(),
      name: z.string(),
      email: z.string().email().optional(),
      profile: z.object({}).passthrough().optional(),
      notes: z.string().optional(),
    }),
  }),
};

const rescheduleBookingSchema = {
  body: z.object({
    appointmentId: z.string(),
    newStartTime: z.string(),
    rescheduleToken: z.string(),
  }),
};

const cancelBookingSchema = {
  body: z.object({
    appointmentId: z.string(),
    rescheduleToken: z.string(),
    reason: z.string().optional(),
  }),
};

// All routes use subdomain extraction
router.use('/:orgSlug', extractSubdomain);

// Routes
router.get('/:orgSlug', publicController.getOrganizationProfile);
router.get('/:orgSlug/services', publicController.getPublicServices);
router.get('/:orgSlug/services/:serviceId/workers', publicController.getServiceWorkers);
router.get('/:orgSlug/availability', publicController.getPublicAvailability);

router.post(
  '/:orgSlug/book',
  rateLimiter.publicBooking,
  validateRequest(createBookingSchema),
  publicController.createPublicBooking
);

router.post(
  '/:orgSlug/reschedule',
  rateLimiter.publicBooking,
  validateRequest(rescheduleBookingSchema),
  publicController.reschedulePublicBooking
);

router.post(
  '/:orgSlug/cancel',
  rateLimiter.publicBooking,
  validateRequest(cancelBookingSchema),
  publicController.cancelPublicBooking
);

module.exports = router;
