/**
 * Service Model
 * Bookable services/appointment types
 */

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [5, 'Minimum duration is 5 minutes'],
      max: [480, 'Maximum duration is 8 hours'],
    },

    bufferBefore: {
      type: Number,
      default: 0,
      min: 0,
    },

    bufferAfter: {
      type: Number,
      default: 0,
      min: 0,
    },

    price: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },

    // Display "FREE" label when price is 0
    displayFreeLabel: {
      type: Boolean,
      default: false,
    },

    location: {
      type: String,
      enum: ['in-person', 'virtual', 'phone'],
      default: 'in-person',
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Maximum number of bookings allowed per time slot
    // E.g., 1 = exclusive (default), 3 = up to 3 people can book the same slot
    // Useful for group classes, shared resources, etc.
    maxSlotsPerTimeSlot: {
      type: Number,
      default: 1,
      min: [1, 'Must allow at least 1 booking per slot'],
      max: [100, 'Cannot exceed 100 bookings per slot'],
    },

    bookingSettings: {
      minLeadTimeHours: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxLeadTimeDays: {
        type: Number,
        default: 60,
        min: 1,
      },
      allowedWorkers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      // Resource configuration for flexible booking types
      resourceType: {
        type: String,
        enum: ['staff', 'room', 'vehicle', 'equipment', 'property', 'facility', 'virtual', 'other'],
        default: 'staff',
      },
      // If true, uses Resource model instead of User/Worker model
      useResourceModel: {
        type: Boolean,
        default: false,
      },
      // Specific resources allowed for this service
      allowedResources: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Resource',
        },
      ],
      // Require quantity selection (for items that can have multiple bookings)
      requiresQuantity: {
        type: Boolean,
        default: false,
      },
      maxQuantityPerBooking: {
        type: Number,
        default: 1,
        min: 1,
      },
    },

    displayOrder: {
      type: Number,
      default: 0,
    },

    image: String,

    color: {
      type: String,
      default: '#1976D2',
    },

    // Google Calendar Integration
    googleCalendar: {
      calendarId: {
        type: String,
        default: null,
      },
      calendarName: {
        type: String,
        default: null,
      },
      syncEnabled: {
        type: Boolean,
        default: false,
      },
      lastSyncAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
serviceSchema.index({ orgId: 1, active: 1 });
serviceSchema.index({ orgId: 1, displayOrder: 1 });

// Static method: Find active services
serviceSchema.statics.findActive = function (orgId) {
  return this.find({ orgId, active: true }).sort({ displayOrder: 1, name: 1 });
};

// Static method: Check if worker can provide service
serviceSchema.statics.canWorkerProvide = function (serviceId, workerId) {
  return this.findOne({
    _id: serviceId,
    active: true,
    $or: [
      { 'bookingSettings.allowedWorkers': { $size: 0 } }, // Empty = all workers
      { 'bookingSettings.allowedWorkers': workerId },
    ],
  });
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;
