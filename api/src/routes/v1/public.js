/**
 * Public API Routes (v1)
 * For public booking pages accessed via URL parameter
 * /api/v1/public/org/:orgSlug
 */

const express = require('express');
const router = express.Router();
const { validateRequest } = require('../../middleware/validateRequest');
const rateLimiter = require('../../middleware/rateLimiter');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { z } = require('zod');

// Models
const Organization = require('../../models/Organization');
const Service = require('../../models/Service');
const Appointment = require('../../models/Appointment');
const Customer = require('../../models/Customer');
const availabilityService = require('../../services/availabilityService');

// Validation schemas
const createBookingSchema = {
  body: z.object({
    serviceId: z.string(),
    date: z.string(), // YYYY-MM-DD
    time: z.string(), // HH:MM
    customerName: z.string().min(2),
    customerEmail: z.string().email(),
    customerPhone: z.string().min(7).max(20), // Support international phone numbers (7-20 digits)
    notes: z.string().optional(),
  }),
};

/**
 * Get organization by slug
 * GET /api/v1/public/org/:orgSlug
 */
router.get(
  '/org/:orgSlug',
  asyncHandler(async (req, res) => {
    const { orgSlug } = req.params;

    const organization = await Organization.findOne({
      slug: orgSlug,
      status: 'active'
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Return public information only
    res.json(
      successResponse('Organization retrieved', {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
        email: organization.email,
        country: organization.country,
        timezone: organization.timezone,
      })
    );
  })
);

/**
 * Get services for an organization
 * GET /api/v1/public/org/:orgSlug/services
 */
router.get(
  '/org/:orgSlug/services',
  asyncHandler(async (req, res) => {
    const { orgSlug } = req.params;

    // Find organization
    const organization = await Organization.findOne({
      slug: orgSlug,
      status: 'active'
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Get active services
    const services = await Service.find({
      orgId: organization._id,
      active: true,
    })
      .select('name description durationMinutes price color location')
      .sort({ name: 1 });

    res.json(successResponse('Services retrieved', services));
  })
);

/**
 * Get available time slots for a service
 * GET /api/v1/public/org/:orgSlug/availability?serviceId=xxx&startDate=2025-01-01&endDate=2025-01-31
 */
router.get(
  '/org/:orgSlug/availability',
  asyncHandler(async (req, res) => {
    const { orgSlug } = req.params;
    const { serviceId, startDate, endDate } = req.query;

    // Validate required query parameters
    if (!serviceId || !startDate || !endDate) {
      throw new ValidationError('serviceId, startDate, and endDate are required');
    }

    // Find organization
    const organization = await Organization.findOne({
      slug: orgSlug,
      status: 'active',
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Verify service exists
    const service = await Service.findOne({
      _id: serviceId,
      orgId: organization._id,
      active: true,
    });

    if (!service) {
      throw new NotFoundError('Service not found or inactive');
    }

    // Get available slots using the availability service
    const slots = await availabilityService.getAvailableSlots({
      orgId: organization._id,
      serviceId,
      workerId: null, // Will find all available workers
      startDate,
      endDate,
      timezone: organization.timezone,
    });

    res.json(successResponse('Available slots retrieved', { slots }));
  })
);

/**
 * Create public booking
 * POST /api/v1/public/org/:orgSlug/book
 */
router.post(
  '/org/:orgSlug/book',
  validateRequest(createBookingSchema),
  asyncHandler(async (req, res) => {
    const { orgSlug } = req.params;
    const {
      serviceId,
      date,
      time,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = req.body;

    // Find organization
    const organization = await Organization.findOne({
      slug: orgSlug,
      status: 'active'
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Verify service exists and belongs to organization
    const service = await Service.findOne({
      _id: serviceId,
      orgId: organization._id,
      active: true,
    });

    if (!service) {
      throw new NotFoundError('Service not found or inactive');
    }

    // Find or create customer
    let customer = await Customer.findOne({
      email: customerEmail.toLowerCase(),
      orgId: organization._id,
    });

    if (!customer) {
      customer = await Customer.create({
        orgId: organization._id,
        name: customerName,
        email: customerEmail.toLowerCase(),
        phone: customerPhone,
        source: 'booking',
      });
    } else {
      // Update customer info if it changed
      let updated = false;
      if (customer.name !== customerName) {
        customer.name = customerName;
        updated = true;
      }
      if (customer.phone !== customerPhone) {
        customer.phone = customerPhone;
        updated = true;
      }
      if (updated) {
        await customer.save();
      }
    }

    // Combine date and time into datetime
    const appointmentDateTime = new Date(`${date}T${time}:00`);

    // Validate datetime is in the future
    if (appointmentDateTime < new Date()) {
      throw new ValidationError('Appointment time must be in the future');
    }

    // Get a worker/resource for this service
    // Must match the same criteria used in availabilityService.getAvailableSlots
    const User = require('../../models/User');

    // Get available slots at this specific time to find which worker has availability
    const availableSlots = await availabilityService.getAvailableSlots({
      orgId: organization._id,
      serviceId: service._id,
      workerId: null,
      startDate: date,
      endDate: date,
      timezone: organization.timezone,
    });

    // Find the slot that matches the requested time
    const requestedSlot = availableSlots.find(slot => {
      const slotTime = new Date(slot.startTime);
      const [hours, minutes] = time.split(':').map(Number);
      return slotTime.getHours() === hours && slotTime.getMinutes() === minutes;
    });

    if (!requestedSlot) {
      throw new ValidationError('This time slot is not available');
    }

    const workerId = requestedSlot.workerId;
    const worker = await User.findById(workerId);

    if (!worker) {
      throw new ValidationError('No available staff for this time slot');
    }

    // Check availability using the availability service
    const availabilityCheck = await availabilityService.isSlotAvailable({
      orgId: organization._id,
      serviceId: service._id,
      workerId,
      startTime: appointmentDateTime,
    });

    if (!availabilityCheck.available) {
      throw new ValidationError(
        availabilityCheck.reason || 'This time slot is not available'
      );
    }

    // Calculate end time based on service duration
    const durationMinutes = service.durationMinutes || 30;
    const endDateTime = new Date(appointmentDateTime.getTime() + durationMinutes * 60000);

    // Create appointment
    const appointment = await Appointment.create({
      orgId: organization._id,
      customerId: customer._id,
      serviceId: service._id,
      workerId,
      startTime: appointmentDateTime,
      endTime: endDateTime,
      status: 'confirmed',
      notes: notes || '',
      source: 'public_booking',
      customerInfo: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
    });

    // Populate for response
    await appointment.populate('customerId serviceId');

    res.status(201).json(
      successResponse('Appointment booked successfully', {
        appointment: {
          id: appointment._id,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          service: {
            id: appointment.serviceId._id,
            name: appointment.serviceId.name,
            price: appointment.serviceId.price,
            duration: appointment.serviceId.durationMinutes,
          },
          customer: {
            id: appointment.customerId._id,
            name: appointment.customerId.name,
            email: appointment.customerId.email,
          },
        },
      })
    );
  })
);

module.exports = router;
