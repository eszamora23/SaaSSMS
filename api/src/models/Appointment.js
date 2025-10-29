/**
 * Appointment Model
 * Scheduled appointments/bookings
 */

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },

    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      // Made optional to support resource-based bookings
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      index: true,
      sparse: true, // Only resource-based bookings will have this
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1, // For bookings that involve multiple units (e.g., 2 cars, 3 rooms)
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },

    startTime: {
      type: Date,
      required: true,
      index: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'canceled', 'no_show', 'rescheduled'],
      default: 'confirmed',
      index: true,
    },

    customerInfo: {
      name: String,
      email: String,
      phone: String,
      customFields: Map,
    },

    notes: String,

    outcomeNotes: String,

    rescheduleToken: String,

    cancelToken: String,

    tokensExpireAt: Date,

    reminders: [
      {
        sentAt: Date,
        type: String, // '24h', '2h', '1h', etc.
        channel: {
          type: String,
          enum: ['sms', 'email'],
          default: 'sms',
        },
        status: {
          type: String,
          enum: ['sent', 'failed'],
        },
      },
    ],

    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },

    rescheduledTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },

    canceledAt: Date,
    canceledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelReason: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    source: {
      type: String,
      enum: ['public_booking', 'manual', 'api'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
appointmentSchema.index({ orgId: 1, workerId: 1, startTime: 1 });
appointmentSchema.index({ orgId: 1, resourceId: 1, startTime: 1 }, { sparse: true });
appointmentSchema.index({ orgId: 1, customerId: 1, startTime: -1 });
appointmentSchema.index({ orgId: 1, startTime: 1, status: 1 });
appointmentSchema.index({ orgId: 1, serviceId: 1 });

// Index for token lookups
appointmentSchema.index({ rescheduleToken: 1 }, { sparse: true });
appointmentSchema.index({ cancelToken: 1 }, { sparse: true });

// Virtual: Duration in minutes
appointmentSchema.virtual('durationMinutes').get(function () {
  if (!this.startTime || !this.endTime) return 0;
  return Math.round((this.endTime - this.startTime) / 60000);
});

// Instance method: Mark as completed
appointmentSchema.methods.complete = function (outcomeNotes = null) {
  this.status = 'completed';
  if (outcomeNotes) {
    this.outcomeNotes = outcomeNotes;
  }
  return this.save();
};

// Instance method: Mark as no-show
appointmentSchema.methods.markNoShow = function () {
  this.status = 'no_show';
  return this.save();
};

// Instance method: Cancel
appointmentSchema.methods.cancel = function (reason, userId = null) {
  this.status = 'canceled';
  this.canceledAt = new Date();
  this.cancelReason = reason;
  if (userId) {
    this.canceledBy = userId;
  }
  return this.save();
};

// Static method: Find upcoming appointments
appointmentSchema.statics.findUpcoming = function (orgId, workerId = null, limit = 10) {
  const query = {
    orgId,
    startTime: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] },
  };

  if (workerId) {
    query.workerId = workerId;
  }

  return this.find(query)
    .sort({ startTime: 1 })
    .limit(limit)
    .populate('serviceId', 'name durationMinutes')
    .populate('customerId', 'name phone email')
    .populate('workerId', 'profile.firstName profile.lastName');
};

// Static method: Find appointments in date range
appointmentSchema.statics.findInRange = function (orgId, startDate, endDate, workerId = null) {
  const query = {
    orgId,
    startTime: { $gte: startDate, $lte: endDate },
    status: { $in: ['pending', 'confirmed'] },
  };

  if (workerId) {
    query.workerId = workerId;
  }

  return this.find(query)
    .sort({ startTime: 1 })
    .populate('serviceId', 'name')
    .populate('customerId', 'name phone');
};

// Static method: Check for conflicts
appointmentSchema.statics.hasConflict = async function (
  orgId,
  workerId,
  startTime,
  endTime,
  excludeId = null
) {
  const query = {
    orgId,
    workerId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }, // Overlaps
    ],
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const conflict = await this.findOne(query);
  return !!conflict;
};

// Ensure virtuals are included
appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
