/**
 * Appointment Service
 * Handles appointment booking, rescheduling, cancellation, and reminders
 */

const { Appointment, Service, Customer, User, Organization } = require('../models');
const availabilityService = require('./availabilityService');
const messageService = require('./messageService');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');
const { generateRandomToken, hashToken } = require('../utils/tokenGenerator');
const { addMinutes } = require('../utils/dateUtils');
const logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');

/**
 * Create new appointment
 */
const createAppointment = async ({
  orgId,
  serviceId,
  workerId,
  customerId,
  startTime,
  customerData = {},
  sendConfirmation = true,
  notes = '',
  metadata = {},
}) => {
  try {
    // Validate service exists
    const service = await Service.findOne({ _id: serviceId, orgId, status: 'active' });
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Validate worker exists
    const worker = await User.findOne({
      _id: workerId,
      orgId,
      role: { $in: ['admin', 'worker'] },
    });
    if (!worker) {
      throw new NotFoundError('Worker not found');
    }

    // Get or create customer
    let customer;
    if (customerId) {
      customer = await Customer.findOne({ _id: customerId, orgId });
      if (!customer) {
        throw new NotFoundError('Customer not found');
      }
    } else if (customerData.phone) {
      // Create new customer
      customer = await Customer.create({
        orgId,
        phone: customerData.phone,
        name: customerData.name,
        email: customerData.email,
        profile: customerData.profile || {},
      });
    } else {
      throw new ValidationError('Customer ID or phone number required');
    }

    const startDateTime = new Date(startTime);
    const endTime = addMinutes(startDateTime, service.duration);

    // Check slot availability
    const availability = await availabilityService.isSlotAvailable({
      orgId,
      serviceId,
      workerId,
      startTime: startDateTime,
    });

    if (!availability.available) {
      throw new ConflictError(availability.reason || 'Time slot not available');
    }

    // Generate reschedule/cancel token
    const rescheduleToken = generateRandomToken();

    // Create appointment
    const appointment = await Appointment.create({
      orgId,
      serviceId,
      workerId,
      customerId: customer._id,
      startTime: startDateTime,
      endTime,
      status: 'pending',
      notes,
      rescheduleToken: hashToken(rescheduleToken),
      metadata,
    });

    logger.info('Appointment created', {
      appointmentId: appointment._id,
      orgId,
      customerId: customer._id,
      startTime: startDateTime,
    });

    // Populate for response
    await appointment.populate([
      { path: 'serviceId', select: 'name duration price' },
      { path: 'workerId', select: 'profile email' },
      { path: 'customerId', select: 'name phone email' },
    ]);

    // Send confirmation SMS
    if (sendConfirmation && customer.phone && customer.consents.smsOptIn.granted) {
      try {
        const org = await Organization.findById(orgId);
        const phoneNumber = await org.getDefaultPhoneNumber();

        if (phoneNumber) {
          const confirmationMessage = formatAppointmentConfirmation({
            appointment,
            service,
            worker,
            customer,
            rescheduleToken,
          });

          await messageService.sendMessage({
            orgId,
            to: customer.phone,
            from: phoneNumber.phoneNumber,
            body: confirmationMessage,
            metadata: {
              type: 'appointment_confirmation',
              appointmentId: appointment._id,
            },
          });
        }
      } catch (error) {
        logger.error('Failed to send appointment confirmation', {
          error: error.message,
          appointmentId: appointment._id,
        });
        // Don't fail the appointment creation
      }
    }

    // Update customer stats
    customer.stats.totalAppointments += 1;
    await customer.save();

    // Emit event
    eventBus.emit('appointment.created', {
      orgId,
      appointment: appointment.toObject(),
    });

    return appointment;
  } catch (error) {
    logger.error('Create appointment error', {
      error: error.message,
      orgId,
      serviceId,
    });
    throw error;
  }
};

/**
 * Reschedule appointment
 */
const rescheduleAppointment = async ({
  orgId,
  appointmentId,
  newStartTime,
  rescheduleToken = null,
  userId = null,
}) => {
  try {
    const appointment = await Appointment.findOne({ _id: appointmentId, orgId });
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    // Verify reschedule token if provided (for public rescheduling)
    if (rescheduleToken) {
      const hashedToken = hashToken(rescheduleToken);
      if (appointment.rescheduleToken !== hashedToken) {
        throw new ValidationError('Invalid reschedule token');
      }
    }

    // Don't allow rescheduling completed or canceled appointments
    if (['completed', 'canceled', 'no_show'].includes(appointment.status)) {
      throw new ValidationError(`Cannot reschedule ${appointment.status} appointment`);
    }

    const service = await Service.findById(appointment.serviceId);
    const newEndTime = addMinutes(new Date(newStartTime), service.duration);

    // Check new slot availability
    const availability = await availabilityService.isSlotAvailable({
      orgId,
      serviceId: appointment.serviceId,
      workerId: appointment.workerId,
      startTime: newStartTime,
      excludeAppointmentId: appointmentId,
    });

    if (!availability.available) {
      throw new ConflictError(availability.reason || 'New time slot not available');
    }

    // Store old time for notification
    const oldStartTime = appointment.startTime;

    // Update appointment
    appointment.startTime = new Date(newStartTime);
    appointment.endTime = newEndTime;
    appointment.status = 'pending'; // Reset to pending if was confirmed
    appointment.metadata.rescheduled = true;
    appointment.metadata.previousStartTime = oldStartTime;
    appointment.metadata.rescheduledAt = new Date();
    appointment.metadata.rescheduledBy = userId;

    await appointment.save();

    logger.info('Appointment rescheduled', {
      appointmentId: appointment._id,
      oldStartTime,
      newStartTime,
    });

    // Send rescheduling confirmation
    const customer = await Customer.findById(appointment.customerId);
    if (customer.phone && customer.consents.smsOptIn.granted) {
      try {
        const org = await Organization.findById(orgId);
        const phoneNumber = await org.getDefaultPhoneNumber();

        if (phoneNumber) {
          const message = `Your appointment has been rescheduled to ${new Date(
            newStartTime
          ).toLocaleString()}. Reply STOP to opt out.`;

          await messageService.sendMessage({
            orgId,
            to: customer.phone,
            from: phoneNumber.phoneNumber,
            body: message,
            metadata: {
              type: 'appointment_rescheduled',
              appointmentId: appointment._id,
            },
          });
        }
      } catch (error) {
        logger.error('Failed to send reschedule notification', {
          error: error.message,
          appointmentId: appointment._id,
        });
      }
    }

    // Emit event
    eventBus.emit('appointment.rescheduled', {
      orgId,
      appointment: appointment.toObject(),
      oldStartTime,
    });

    return appointment;
  } catch (error) {
    logger.error('Reschedule appointment error', {
      error: error.message,
      appointmentId,
    });
    throw error;
  }
};

/**
 * Cancel appointment
 */
const cancelAppointment = async ({
  orgId,
  appointmentId,
  reason = '',
  canceledBy = null,
  sendNotification = true,
}) => {
  try {
    const appointment = await Appointment.findOne({ _id: appointmentId, orgId });
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    if (appointment.status === 'canceled') {
      throw new ValidationError('Appointment already canceled');
    }

    appointment.status = 'canceled';
    appointment.metadata.canceledAt = new Date();
    appointment.metadata.canceledBy = canceledBy;
    appointment.metadata.cancelReason = reason;

    await appointment.save();

    logger.info('Appointment canceled', {
      appointmentId: appointment._id,
      orgId,
      reason,
    });

    // Send cancellation notification
    if (sendNotification) {
      const customer = await Customer.findById(appointment.customerId);
      if (customer.phone && customer.consents.smsOptIn.granted) {
        try {
          const org = await Organization.findById(orgId);
          const phoneNumber = await org.getDefaultPhoneNumber();

          if (phoneNumber) {
            const message = `Your appointment on ${new Date(
              appointment.startTime
            ).toLocaleString()} has been canceled. ${
              reason ? `Reason: ${reason}` : ''
            } Reply STOP to opt out.`;

            await messageService.sendMessage({
              orgId,
              to: customer.phone,
              from: phoneNumber.phoneNumber,
              body: message,
              metadata: {
                type: 'appointment_canceled',
                appointmentId: appointment._id,
              },
            });
          }
        } catch (error) {
          logger.error('Failed to send cancellation notification', {
            error: error.message,
            appointmentId: appointment._id,
          });
        }
      }
    }

    // Emit event
    eventBus.emit('appointment.canceled', {
      orgId,
      appointment: appointment.toObject(),
    });

    return appointment;
  } catch (error) {
    logger.error('Cancel appointment error', {
      error: error.message,
      appointmentId,
    });
    throw error;
  }
};

/**
 * Confirm appointment
 */
const confirmAppointment = async ({ orgId, appointmentId }) => {
  try {
    const appointment = await Appointment.findOne({ _id: appointmentId, orgId });
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    appointment.status = 'confirmed';
    appointment.metadata.confirmedAt = new Date();
    await appointment.save();

    logger.info('Appointment confirmed', {
      appointmentId: appointment._id,
      orgId,
    });

    // Emit event
    eventBus.emit('appointment.confirmed', {
      orgId,
      appointment: appointment.toObject(),
    });

    return appointment;
  } catch (error) {
    logger.error('Confirm appointment error', {
      error: error.message,
      appointmentId,
    });
    throw error;
  }
};

/**
 * Mark appointment as completed
 */
const completeAppointment = async ({ orgId, appointmentId, notes = '' }) => {
  try {
    const appointment = await Appointment.findOne({ _id: appointmentId, orgId });
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    appointment.status = 'completed';
    appointment.metadata.completedAt = new Date();
    if (notes) {
      appointment.notes = `${appointment.notes}\n\nCompletion notes: ${notes}`.trim();
    }
    await appointment.save();

    logger.info('Appointment completed', {
      appointmentId: appointment._id,
      orgId,
    });

    // Emit event
    eventBus.emit('appointment.completed', {
      orgId,
      appointment: appointment.toObject(),
    });

    return appointment;
  } catch (error) {
    logger.error('Complete appointment error', {
      error: error.message,
      appointmentId,
    });
    throw error;
  }
};

/**
 * Mark appointment as no-show
 */
const markNoShow = async ({ orgId, appointmentId }) => {
  try {
    const appointment = await Appointment.findOne({ _id: appointmentId, orgId });
    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    appointment.status = 'no_show';
    appointment.metadata.noShowAt = new Date();
    await appointment.save();

    // Update customer stats
    const customer = await Customer.findById(appointment.customerId);
    customer.stats.noShows += 1;
    await customer.save();

    logger.info('Appointment marked as no-show', {
      appointmentId: appointment._id,
      orgId,
      customerId: customer._id,
    });

    // Emit event
    eventBus.emit('appointment.no_show', {
      orgId,
      appointment: appointment.toObject(),
    });

    return appointment;
  } catch (error) {
    logger.error('Mark no-show error', {
      error: error.message,
      appointmentId,
    });
    throw error;
  }
};

/**
 * Get appointments with filters
 */
const getAppointments = async ({
  orgId,
  workerId = null,
  customerId = null,
  status = null,
  startDate = null,
  endDate = null,
  limit = 50,
  offset = 0,
}) => {
  try {
    const query = { orgId };

    if (workerId) query.workerId = workerId;
    if (customerId) query.customerId = customerId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const appointments = await Appointment.find(query)
      .sort({ startTime: 1 })
      .limit(limit)
      .skip(offset)
      .populate('serviceId', 'name duration price')
      .populate('workerId', 'profile email')
      .populate('customerId', 'name phone email');

    const total = await Appointment.countDocuments(query);

    return {
      appointments,
      total,
      limit,
      offset,
    };
  } catch (error) {
    logger.error('Get appointments error', {
      error: error.message,
      orgId,
    });
    throw error;
  }
};

/**
 * Send appointment reminders (called by background job)
 */
const sendReminders = async ({ reminderWindow = 24 }) => {
  try {
    // Find appointments starting within the reminder window
    const now = new Date();
    const windowEnd = addMinutes(now, reminderWindow * 60);

    const appointments = await Appointment.find({
      status: { $in: ['pending', 'confirmed'] },
      startTime: { $gte: now, $lte: windowEnd },
      'reminders.type': { $ne: `${reminderWindow}h` }, // Haven't sent this reminder yet
    })
      .populate('customerId', 'name phone consents')
      .populate('serviceId', 'name duration')
      .populate('workerId', 'profile')
      .populate('orgId');

    let sentCount = 0;

    for (const appointment of appointments) {
      const customer = appointment.customerId;

      if (!customer.phone || !customer.consents.smsOptIn.granted) {
        continue;
      }

      try {
        const org = appointment.orgId;
        const phoneNumber = await org.getDefaultPhoneNumber();

        if (!phoneNumber) {
          continue;
        }

        const reminderMessage = formatAppointmentReminder({
          appointment,
          service: appointment.serviceId,
          worker: appointment.workerId,
          customer,
          hoursUntil: reminderWindow,
        });

        await messageService.sendMessage({
          orgId: org._id,
          to: customer.phone,
          from: phoneNumber.phoneNumber,
          body: reminderMessage,
          metadata: {
            type: 'appointment_reminder',
            appointmentId: appointment._id,
          },
        });

        // Record reminder sent
        appointment.reminders.push({
          sentAt: new Date(),
          type: `${reminderWindow}h`,
          channel: 'sms',
        });

        await appointment.save();
        sentCount++;

        logger.info('Appointment reminder sent', {
          appointmentId: appointment._id,
          customerId: customer._id,
          reminderWindow,
        });
      } catch (error) {
        logger.error('Failed to send appointment reminder', {
          error: error.message,
          appointmentId: appointment._id,
        });
      }
    }

    logger.info('Appointment reminders batch completed', {
      sentCount,
      reminderWindow,
    });

    return { sentCount };
  } catch (error) {
    logger.error('Send reminders error', {
      error: error.message,
    });
    throw error;
  }
};

/**
 * Format appointment confirmation message
 */
const formatAppointmentConfirmation = ({
  appointment,
  service,
  worker,
  customer,
  rescheduleToken,
}) => {
  const startTime = new Date(appointment.startTime).toLocaleString();
  return `Hi ${customer.name || 'there'}! Your appointment for ${
    service.name
  } is confirmed for ${startTime} with ${worker.profile.firstName}. To reschedule or cancel, use token: ${rescheduleToken}. Reply STOP to opt out.`;
};

/**
 * Format appointment reminder message
 */
const formatAppointmentReminder = ({
  appointment,
  service,
  worker,
  customer,
  hoursUntil,
}) => {
  const startTime = new Date(appointment.startTime).toLocaleString();
  return `Reminder: You have an appointment for ${service.name} in ${hoursUntil} hours at ${startTime} with ${worker.profile.firstName}. Reply STOP to opt out.`;
};

module.exports = {
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  confirmAppointment,
  completeAppointment,
  markNoShow,
  getAppointments,
  sendReminders,
};
