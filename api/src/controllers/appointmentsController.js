/**
 * Appointments Controller
 * Handles appointment booking endpoints
 */

const appointmentService = require('../services/appointmentService');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create appointment
 * POST /api/v1/appointments
 */
const createAppointment = asyncHandler(async (req, res) => {
  const {
    serviceId,
    workerId,
    customerId,
    startTime,
    customerData,
    sendConfirmation,
    notes,
    metadata,
  } = req.body;

  const appointment = await appointmentService.createAppointment({
    orgId: req.user.orgId,
    serviceId,
    workerId,
    customerId,
    startTime,
    customerData,
    sendConfirmation,
    notes,
    metadata,
  });

  res.status(201).json(successResponse('Appointment created', { appointment }));
});

/**
 * Get appointments
 * GET /api/v1/appointments
 */
const getAppointments = asyncHandler(async (req, res) => {
  const { workerId, customerId, status, startDate, endDate, limit = 50, offset = 0 } = req.query;

  const result = await appointmentService.getAppointments({
    orgId: req.user.orgId,
    workerId,
    customerId,
    status,
    startDate,
    endDate,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json(
    successResponse('Appointments retrieved', {
      appointments: result.appointments,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    })
  );
});

/**
 * Get appointment by ID
 * GET /api/v1/appointments/:id
 */
const getAppointment = asyncHandler(async (req, res) => {
  const { Appointment } = require('../models');

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  })
    .populate('serviceId', 'name duration price')
    .populate('workerId', 'profile email')
    .populate('customerId', 'name phone email');

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  res.json(successResponse('Appointment retrieved', { appointment }));
});

/**
 * Update appointment
 * PATCH /api/v1/appointments/:id
 */
const updateAppointment = asyncHandler(async (req, res) => {
  const { Appointment } = require('../models');
  const { notes, metadata } = req.body;

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  if (notes) appointment.notes = notes;
  if (metadata) appointment.metadata = { ...appointment.metadata, ...metadata };

  await appointment.save();

  res.json(successResponse('Appointment updated', { appointment }));
});

/**
 * Reschedule appointment
 * POST /api/v1/appointments/:id/reschedule
 */
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { newStartTime } = req.body;

  const appointment = await appointmentService.rescheduleAppointment({
    orgId: req.user.orgId,
    appointmentId: req.params.id,
    newStartTime,
    userId: req.user.id,
  });

  res.json(successResponse('Appointment rescheduled', { appointment }));
});

/**
 * Cancel appointment
 * POST /api/v1/appointments/:id/cancel
 */
const cancelAppointment = asyncHandler(async (req, res) => {
  const { reason, sendNotification = true } = req.body;

  const appointment = await appointmentService.cancelAppointment({
    orgId: req.user.orgId,
    appointmentId: req.params.id,
    reason,
    canceledBy: req.user.id,
    sendNotification,
  });

  res.json(successResponse('Appointment canceled', { appointment }));
});

/**
 * Confirm appointment
 * POST /api/v1/appointments/:id/confirm
 */
const confirmAppointment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.confirmAppointment({
    orgId: req.user.orgId,
    appointmentId: req.params.id,
  });

  res.json(successResponse('Appointment confirmed', { appointment }));
});

/**
 * Complete appointment
 * POST /api/v1/appointments/:id/complete
 */
const completeAppointment = asyncHandler(async (req, res) => {
  const { notes } = req.body;

  const appointment = await appointmentService.completeAppointment({
    orgId: req.user.orgId,
    appointmentId: req.params.id,
    notes,
  });

  res.json(successResponse('Appointment completed', { appointment }));
});

/**
 * Mark appointment as no-show
 * POST /api/v1/appointments/:id/no-show
 */
const markNoShow = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.markNoShow({
    orgId: req.user.orgId,
    appointmentId: req.params.id,
  });

  res.json(successResponse('Appointment marked as no-show', { appointment }));
});

module.exports = {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  rescheduleAppointment,
  cancelAppointment,
  confirmAppointment,
  completeAppointment,
  markNoShow,
};
