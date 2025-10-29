/**
 * Services Controller
 * Handles bookable services endpoints
 */

const { Service } = require('../models');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/errors');

/**
 * Create service
 * POST /api/v1/services
 */
const createService = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    durationMinutes,
    priceAmount,
    priceCurrency,
    displayFreeLabel,
    bufferBefore,
    bufferAfter,
    color,
    location,
    status,
    maxSlotsPerTimeSlot,
    bookingSettings,
    googleCalendar,
  } = req.body;

  const service = await Service.create({
    orgId: req.user.orgId,
    name,
    description,
    durationMinutes,
    price: {
      amount: priceAmount || 0,
      currency: priceCurrency || 'USD',
    },
    displayFreeLabel: displayFreeLabel || false,
    bufferBefore: bufferBefore || 0,
    bufferAfter: bufferAfter || 0,
    color,
    location,
    active: status === 'active',
    maxSlotsPerTimeSlot: maxSlotsPerTimeSlot || 1,
    bookingSettings,
    googleCalendar: googleCalendar || {},
  });

  res.status(201).json(successResponse('Service created', { service }));
});

/**
 * Get all services
 * GET /api/v1/services
 */
const getServices = asyncHandler(async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  const query = { orgId: req.user.orgId };

  // Handle status filter - Service model uses 'active' boolean field
  if (status === 'active') {
    query.active = true;
  } else if (status === 'inactive') {
    query.active = false;
  }

  const services = await Service.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  const total = await Service.countDocuments(query);

  res.json(
    successResponse('Services retrieved', {
      services,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  );
});

/**
 * Get service by ID
 * GET /api/v1/services/:id
 */
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  res.json(successResponse('Service retrieved', { service }));
});

/**
 * Update service
 * PATCH /api/v1/services/:id
 */
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  const {
    name,
    description,
    durationMinutes,
    priceAmount,
    priceCurrency,
    displayFreeLabel,
    bufferBefore,
    bufferAfter,
    color,
    location,
    status,
    maxSlotsPerTimeSlot,
    bookingSettings,
    googleCalendar,
  } = req.body;

  // Update fields if provided
  if (name !== undefined) service.name = name;
  if (description !== undefined) service.description = description;
  if (durationMinutes !== undefined) service.durationMinutes = durationMinutes;
  if (priceAmount !== undefined) service.price.amount = priceAmount;
  if (priceCurrency !== undefined) service.price.currency = priceCurrency;
  if (displayFreeLabel !== undefined) service.displayFreeLabel = displayFreeLabel;
  if (bufferBefore !== undefined) service.bufferBefore = bufferBefore;
  if (bufferAfter !== undefined) service.bufferAfter = bufferAfter;
  if (color !== undefined) service.color = color;
  if (location !== undefined) service.location = location;
  if (status !== undefined) service.active = status === 'active';
  if (maxSlotsPerTimeSlot !== undefined) service.maxSlotsPerTimeSlot = maxSlotsPerTimeSlot;
  if (bookingSettings !== undefined) service.bookingSettings = bookingSettings;
  if (googleCalendar !== undefined) {
    service.googleCalendar = {
      ...service.googleCalendar,
      ...googleCalendar,
    };
  }

  await service.save();

  res.json(successResponse('Service updated', { service }));
});

/**
 * Delete service
 * DELETE /api/v1/services/:id
 */
const deleteService = asyncHandler(async (req, res) => {
  const { Appointment } = require('../models');

  const service = await Service.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!service) {
    throw new NotFoundError('Service not found');
  }

  // Check for upcoming appointments
  const upcomingAppointments = await Appointment.countDocuments({
    orgId: req.user.orgId,
    serviceId: req.params.id,
    status: { $in: ['pending', 'confirmed'] },
    startTime: { $gte: new Date() },
  });

  if (upcomingAppointments > 0) {
    return res.status(400).json({
      error: 'Cannot delete service with upcoming appointments',
    });
  }

  // Soft delete by marking as inactive
  service.status = 'inactive';
  await service.save();

  res.json(successResponse('Service deleted'));
});

module.exports = {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
};
