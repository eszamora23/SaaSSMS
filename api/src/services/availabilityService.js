/**
 * Availability Service
 * Handles worker availability and slot generation for appointments
 */

const { Service, User, Appointment, Organization } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { toOrgTimezone, getDayBounds, addMinutes, doRangesOverlap } = require('../utils/dateUtils');
const logger = require('../utils/logger');

/**
 * Get available time slots for a service
 */
const getAvailableSlots = async ({
  orgId,
  serviceId,
  workerId = null,
  startDate,
  endDate,
  timezone,
}) => {
  try {
    // Validate service exists
    const service = await Service.findOne({ _id: serviceId, orgId });
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Get organization for business hours
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Get workers (either specific worker or all workers for this service)
    let workers;
    if (workerId) {
      const worker = await User.findOne({
        _id: workerId,
        orgId,
        role: { $in: ['admin', 'worker'] },
        'workerProfile.bookingEnabled': true,
      });
      if (!worker) {
        throw new NotFoundError('Worker not found or booking not enabled');
      }
      workers = [worker];
    } else {
      workers = await User.find({
        orgId,
        role: { $in: ['admin', 'worker'] },
        'workerProfile.bookingEnabled': true,
        'workerProfile.serviceIds': serviceId,
      });
    }

    if (workers.length === 0) {
      return [];
    }

    // Generate slots for each worker
    const allSlots = [];

    for (const worker of workers) {
      const workerSlots = await generateWorkerSlots({
        worker,
        service,
        organization,
        startDate,
        endDate,
        timezone,
      });

      allSlots.push(...workerSlots);
    }

    // Sort by start time
    allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    logger.debug('Available slots generated', {
      orgId,
      serviceId,
      workerId,
      slotsCount: allSlots.length,
    });

    return allSlots;
  } catch (error) {
    logger.error('Get available slots error', {
      error: error.message,
      orgId,
      serviceId,
    });
    throw error;
  }
};

/**
 * Generate available slots for a specific worker
 */
const generateWorkerSlots = async ({
  worker,
  service,
  organization,
  startDate,
  endDate,
  timezone,
}) => {
  const slots = [];
  const slotDuration = service.durationMinutes; // in minutes
  const bufferBefore = service.bufferBefore || 0;
  const bufferAfter = service.bufferAfter || 0;
  const maxSlotsPerTimeSlot = service.maxSlotsPerTimeSlot || 1;

  // Get worker's existing appointments in the date range
  const existingAppointments = await Appointment.find({
    orgId: organization._id,
    workerId: worker._id,
    status: { $in: ['pending', 'confirmed'] },
    startTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
  }).sort({ startTime: 1 });

  // Get worker's custom availability or use organization defaults
  const availability = worker.workerProfile?.availability || organization.businessHours;

  // Iterate through each day in the range
  let currentDate = new Date(startDate);
  const endDateTime = new Date(endDate);

  while (currentDate <= endDateTime) {
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Find availability for this day
    const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);

    if (dayAvailability) {
      // Parse start and end times for this day
      const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
      const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);

      const dayStart = new Date(currentDate);
      dayStart.setHours(startHour, startMinute, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMinute, 0, 0);

      // Generate slots for this day
      let slotStart = new Date(dayStart);

      while (slotStart < dayEnd) {
        const slotEnd = addMinutes(slotStart, slotDuration);

        // Check if slot end is within business hours
        if (slotEnd > dayEnd) {
          break;
        }

        // Check if slot is in the past
        if (slotStart < new Date()) {
          slotStart = addMinutes(slotStart, service.slotInterval || slotDuration);
          continue;
        }

        // Count existing appointments in this time slot (including buffers)
        const overlappingAppointments = existingAppointments.filter((appointment) => {
          const appointmentStart = addMinutes(new Date(appointment.startTime), -bufferBefore);
          const appointmentEnd = addMinutes(new Date(appointment.endTime), bufferAfter);

          return doRangesOverlap(slotStart, slotEnd, appointmentStart, appointmentEnd);
        });

        const bookedSlots = overlappingAppointments.length;
        const availableSpots = maxSlotsPerTimeSlot - bookedSlots;

        // Only add slot if there are available spots
        if (availableSpots > 0) {
          slots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
            workerId: worker._id,
            workerName: `${worker.profile.firstName} ${worker.profile.lastName}`.trim(),
            available: true,
            availableSpots,
            maxSlots: maxSlotsPerTimeSlot,
          });
        }

        // Move to next slot
        slotStart = addMinutes(slotStart, service.slotInterval || slotDuration);
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    currentDate.setHours(0, 0, 0, 0);
  }

  return slots;
};

/**
 * Check if a specific time slot is available
 */
const isSlotAvailable = async ({
  orgId,
  serviceId,
  workerId,
  startTime,
  excludeAppointmentId = null,
}) => {
  try {
    const service = await Service.findOne({ _id: serviceId, orgId });
    if (!service) {
      throw new NotFoundError('Service not found');
    }

    const worker = await User.findOne({ _id: workerId, orgId });
    if (!worker) {
      throw new NotFoundError('Worker not found');
    }

    const organization = await Organization.findById(orgId);

    const slotStartTime = new Date(startTime);
    const slotEndTime = addMinutes(slotStartTime, service.durationMinutes);

    // Check if time is in the past
    if (slotStartTime < new Date()) {
      return { available: false, reason: 'Time slot is in the past' };
    }

    // Check business hours
    const dayOfWeek = slotStartTime.getDay();
    const availability = worker.workerProfile?.availability || organization.businessHours;
    const dayAvailability = availability.find((a) => a.dayOfWeek === dayOfWeek);

    if (!dayAvailability) {
      return { available: false, reason: 'Worker not available on this day' };
    }

    // Check if slot is within business hours
    const [startHour, startMinute] = dayAvailability.start.split(':').map(Number);
    const [endHour, endMinute] = dayAvailability.end.split(':').map(Number);

    const dayStart = new Date(slotStartTime);
    dayStart.setHours(startHour, startMinute, 0, 0);

    const dayEnd = new Date(slotStartTime);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    if (slotStartTime < dayStart || slotEndTime > dayEnd) {
      return { available: false, reason: 'Time slot outside business hours' };
    }

    // Check for conflicts with existing appointments
    const hasConflict = await Appointment.hasConflict(
      orgId,
      workerId,
      slotStartTime,
      slotEndTime,
      excludeAppointmentId
    );

    if (hasConflict) {
      return { available: false, reason: 'Time slot conflicts with existing appointment' };
    }

    return { available: true };
  } catch (error) {
    logger.error('Check slot availability error', {
      error: error.message,
      orgId,
      serviceId,
      workerId,
      startTime,
    });
    throw error;
  }
};

/**
 * Get worker's schedule for a date range
 */
const getWorkerSchedule = async ({ orgId, workerId, startDate, endDate }) => {
  try {
    const worker = await User.findOne({ _id: workerId, orgId });
    if (!worker) {
      throw new NotFoundError('Worker not found');
    }

    const appointments = await Appointment.find({
      orgId,
      workerId,
      status: { $in: ['pending', 'confirmed', 'completed'] },
      startTime: { $gte: new Date(startDate), $lte: new Date(endDate) },
    })
      .populate('customerId', 'name phone email')
      .populate('serviceId', 'name duration')
      .sort({ startTime: 1 });

    logger.debug('Worker schedule retrieved', {
      orgId,
      workerId,
      appointmentsCount: appointments.length,
    });

    return appointments;
  } catch (error) {
    logger.error('Get worker schedule error', {
      error: error.message,
      orgId,
      workerId,
    });
    throw error;
  }
};

/**
 * Update worker availability
 */
const updateWorkerAvailability = async ({ orgId, workerId, availability }) => {
  try {
    const worker = await User.findOne({ _id: workerId, orgId });
    if (!worker) {
      throw new NotFoundError('Worker not found');
    }

    // Validate availability format
    if (!Array.isArray(availability)) {
      throw new ValidationError('Availability must be an array');
    }

    for (const slot of availability) {
      if (
        typeof slot.dayOfWeek !== 'number' ||
        slot.dayOfWeek < 0 ||
        slot.dayOfWeek > 6
      ) {
        throw new ValidationError('Invalid dayOfWeek (0-6)');
      }

      if (!slot.start || !slot.end) {
        throw new ValidationError('Start and end times are required');
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(slot.start) || !timeRegex.test(slot.end)) {
        throw new ValidationError('Invalid time format (use HH:MM)');
      }
    }

    worker.workerProfile.availability = availability;
    await worker.save();

    logger.info('Worker availability updated', {
      orgId,
      workerId,
      slotsCount: availability.length,
    });

    return worker;
  } catch (error) {
    logger.error('Update worker availability error', {
      error: error.message,
      orgId,
      workerId,
    });
    throw error;
  }
};

/**
 * Get next available slot for a service
 */
const getNextAvailableSlot = async ({ orgId, serviceId, workerId = null }) => {
  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Look ahead 30 days

    const slots = await getAvailableSlots({
      orgId,
      serviceId,
      workerId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    if (slots.length === 0) {
      return null;
    }

    return slots[0];
  } catch (error) {
    logger.error('Get next available slot error', {
      error: error.message,
      orgId,
      serviceId,
    });
    throw error;
  }
};

module.exports = {
  getAvailableSlots,
  isSlotAvailable,
  getWorkerSchedule,
  updateWorkerAvailability,
  getNextAvailableSlot,
};
