/**
 * Public Controller
 * Handles public booking endpoints (Calendly-like)
 */

const { Organization, Service, User } = require('../models');
const availabilityService = require('../services/availabilityService');
const appointmentService = require('../services/appointmentService');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Get organization public profile by slug
 * GET /public/:orgSlug
 */
const getOrganizationProfile = asyncHandler(async (req, res) => {
  const organization = await Organization.findOne({
    slug: req.params.orgSlug,
    status: 'active',
  }).select('name slug branding businessHours timezone');

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  res.json(
    successResponse('Organization profile retrieved', {
      organization,
    })
  );
});

/**
 * Get public services
 * GET /public/:orgSlug/services
 */
const getPublicServices = asyncHandler(async (req, res) => {
  // Organization is attached by extractSubdomain middleware
  const organization = req.organization;

  const services = await Service.find({
    orgId: organization._id,
    status: 'active',
  }).select('name description duration price currency color');

  res.json(successResponse('Services retrieved', { services }));
});

/**
 * Get available workers for service
 * GET /public/:orgSlug/services/:serviceId/workers
 */
const getServiceWorkers = asyncHandler(async (req, res) => {
  const organization = req.organization;

  const service = await Service.findOne({
    _id: req.params.serviceId,
    orgId: organization._id,
    status: 'active',
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  const workers = await User.find({
    orgId: organization._id,
    role: { $in: ['admin', 'worker'] },
    'workerProfile.bookingEnabled': true,
    'workerProfile.serviceIds': req.params.serviceId,
  }).select('profile workerProfile.bio');

  res.json(successResponse('Workers retrieved', { workers }));
});

/**
 * Get available slots for public booking
 * GET /public/:orgSlug/availability
 */
const getPublicAvailability = asyncHandler(async (req, res) => {
  const organization = req.organization;
  const { serviceId, workerId, startDate, endDate } = req.query;

  if (!serviceId || !startDate || !endDate) {
    throw new ValidationError('serviceId, startDate, and endDate are required');
  }

  const slots = await availabilityService.getAvailableSlots({
    orgId: organization._id,
    serviceId,
    workerId,
    startDate,
    endDate,
    timezone: organization.timezone,
  });

  res.json(successResponse('Available slots retrieved', { slots }));
});

/**
 * Create public appointment booking
 * POST /public/:orgSlug/book
 */
const createPublicBooking = asyncHandler(async (req, res) => {
  const organization = req.organization;
  const { serviceId, workerId, startTime, customer } = req.body;

  if (!serviceId || !workerId || !startTime) {
    throw new ValidationError('serviceId, workerId, and startTime are required');
  }

  if (!customer || !customer.phone || !customer.name) {
    throw new ValidationError('Customer phone and name are required');
  }

  // Verify service exists and is active
  const service = await Service.findOne({
    _id: serviceId,
    orgId: organization._id,
    status: 'active',
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  const appointment = await appointmentService.createAppointment({
    orgId: organization._id,
    serviceId,
    workerId,
    startTime,
    customerData: {
      phone: customer.phone,
      name: customer.name,
      email: customer.email,
      profile: customer.profile || {},
    },
    sendConfirmation: true,
    notes: customer.notes || '',
    metadata: {
      source: 'public_booking',
      bookedAt: new Date(),
    },
  });

  res.status(201).json(
    successResponse('Appointment booked successfully', {
      appointment: {
        id: appointment._id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        service: appointment.serviceId,
        worker: appointment.workerId,
      },
    })
  );
});

/**
 * Reschedule appointment (public, requires token)
 * POST /public/:orgSlug/reschedule
 */
const reschedulePublicBooking = asyncHandler(async (req, res) => {
  const organization = req.organization;
  const { appointmentId, newStartTime, rescheduleToken } = req.body;

  if (!appointmentId || !newStartTime || !rescheduleToken) {
    throw new ValidationError('appointmentId, newStartTime, and rescheduleToken are required');
  }

  const appointment = await appointmentService.rescheduleAppointment({
    orgId: organization._id,
    appointmentId,
    newStartTime,
    rescheduleToken,
  });

  res.json(
    successResponse('Appointment rescheduled successfully', {
      appointment: {
        id: appointment._id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
      },
    })
  );
});

/**
 * Cancel appointment (public, requires token)
 * POST /public/:orgSlug/cancel
 */
const cancelPublicBooking = asyncHandler(async (req, res) => {
  const organization = req.organization;
  const { appointmentId, rescheduleToken, reason } = req.body;

  if (!appointmentId || !rescheduleToken) {
    throw new ValidationError('appointmentId and rescheduleToken are required');
  }

  const { Appointment } = require('../models');
  const { hashToken } = require('../utils/tokenGenerator');

  // Verify appointment and token
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    orgId: organization._id,
  });

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  const hashedToken = hashToken(rescheduleToken);
  if (appointment.rescheduleToken !== hashedToken) {
    throw new ValidationError('Invalid reschedule token');
  }

  await appointmentService.cancelAppointment({
    orgId: organization._id,
    appointmentId,
    reason: reason || 'Canceled by customer',
    sendNotification: false, // Already being canceled by customer
  });

  res.json(successResponse('Appointment canceled successfully'));
});

module.exports = {
  getOrganizationProfile,
  getPublicServices,
  getServiceWorkers,
  getPublicAvailability,
  createPublicBooking,
  reschedulePublicBooking,
  cancelPublicBooking,
};
