/**
 * Availability Controller
 * Handles availability and slot generation endpoints
 */

const availabilityService = require('../services/availabilityService');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError } = require('../utils/errors');

/**
 * Get available slots for a service
 * GET /api/v1/availability/slots
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { serviceId, workerId, startDate, endDate, timezone } = req.query;

  if (!serviceId || !startDate || !endDate) {
    throw new ValidationError('serviceId, startDate, and endDate are required');
  }

  const slots = await availabilityService.getAvailableSlots({
    orgId: req.user.orgId,
    serviceId,
    workerId,
    startDate,
    endDate,
    timezone: timezone || req.user.organization.timezone,
  });

  res.json(successResponse('Available slots retrieved', { slots }));
});

/**
 * Check if specific slot is available
 * GET /api/v1/availability/check
 */
const checkSlotAvailability = asyncHandler(async (req, res) => {
  const { serviceId, workerId, startTime } = req.query;

  if (!serviceId || !workerId || !startTime) {
    throw new ValidationError('serviceId, workerId, and startTime are required');
  }

  const availability = await availabilityService.isSlotAvailable({
    orgId: req.user.orgId,
    serviceId,
    workerId,
    startTime,
  });

  res.json(successResponse('Slot availability checked', availability));
});

/**
 * Get next available slot
 * GET /api/v1/availability/next
 */
const getNextAvailableSlot = asyncHandler(async (req, res) => {
  const { serviceId, workerId } = req.query;

  if (!serviceId) {
    throw new ValidationError('serviceId is required');
  }

  const slot = await availabilityService.getNextAvailableSlot({
    orgId: req.user.orgId,
    serviceId,
    workerId,
  });

  if (!slot) {
    return res.json(
      successResponse('No available slots found in the next 30 days', { slot: null })
    );
  }

  res.json(successResponse('Next available slot retrieved', { slot }));
});

module.exports = {
  getAvailableSlots,
  checkSlotAvailability,
  getNextAvailableSlot,
};
