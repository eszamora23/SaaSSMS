/**
 * Resource Model
 * Universal model for any bookable resource: staff, rooms, vehicles, equipment, etc.
 * This allows the system to work for various use cases:
 * - Appointment booking (staff/workers)
 * - Hotel rooms
 * - Car rentals
 * - Equipment rentals
 * - Conference rooms
 * - Apartment viewings
 * - Any physical or virtual bookable item
 */

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    // Resource identification
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
      maxlength: [100, 'Resource name cannot exceed 100 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Resource type - flexible to support any use case
    type: {
      type: String,
      enum: [
        'staff', // Workers, employees, service providers
        'room', // Hotel rooms, conference rooms, office spaces
        'vehicle', // Cars, trucks, bikes, boats
        'equipment', // Tools, machinery, sports equipment
        'property', // Apartments, houses for viewing/rental
        'facility', // Gyms, courts, pools
        'virtual', // Virtual meeting slots, online services
        'other', // Custom types
      ],
      required: true,
      index: true,
    },

    // Linked to User model (for staff resources)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      sparse: true, // Only staff resources will have this
    },

    // Capacity/Quantity - how many can be booked simultaneously
    capacity: {
      type: Number,
      default: 1,
      min: [1, 'Capacity must be at least 1'],
      max: [1000, 'Capacity cannot exceed 1000'],
    },

    // Services this resource can provide
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],

    // Availability settings
    availability: {
      // Custom schedule (overrides organization businessHours if set)
      schedule: [
        {
          dayOfWeek: {
            type: Number,
            min: 0,
            max: 6,
            required: true,
          },
          start: {
            type: String,
            required: true,
          },
          end: {
            type: String,
            required: true,
          },
        },
      ],

      // Blocked dates (maintenance, holidays, etc.)
      blockedDates: [
        {
          startDate: {
            type: Date,
            required: true,
          },
          endDate: {
            type: Date,
            required: true,
          },
          reason: String,
        },
      ],

      // Minimum advance booking time (in hours)
      minLeadTimeHours: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Maximum advance booking time (in days)
      maxLeadTimeDays: {
        type: Number,
        default: 90,
        min: 1,
      },

      // Buffer time before bookings (in minutes)
      bufferBefore: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Buffer time after bookings (in minutes)
      bufferAfter: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Slot interval (for generating available slots, in minutes)
      slotInterval: {
        type: Number,
        default: 30,
        min: 5,
      },
    },

    // Resource-specific attributes (flexible schema for any type)
    attributes: {
      // For vehicles
      make: String,
      model: String,
      year: Number,
      licensePlate: String,
      color: String,
      fuelType: String,
      transmission: String,

      // For rooms/properties
      size: String, // "2 bedroom", "500 sq ft", etc.
      floor: Number,
      bedType: String,
      amenities: [String], // ["WiFi", "TV", "Parking", etc.]
      maxOccupancy: Number,

      // For equipment
      brand: String,
      serialNumber: String,
      condition: String,

      // For any resource
      location: String,
      category: String,
      tags: [String],
      features: [String],

      // Custom fields (store any additional data)
      custom: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
    },

    // Pricing (can be per-service or per-resource)
    pricing: {
      basePrice: Number,
      currency: {
        type: String,
        default: 'USD',
      },
      priceType: {
        type: String,
        enum: ['per_hour', 'per_day', 'per_booking', 'per_service'],
        default: 'per_booking',
      },
    },

    // Images/media
    images: [
      {
        url: String,
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'retired'],
      default: 'active',
      index: true,
    },

    // Display order for sorting
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
resourceSchema.index({ orgId: 1, status: 1 });
resourceSchema.index({ orgId: 1, type: 1, status: 1 });
resourceSchema.index({ orgId: 1, serviceIds: 1 });
resourceSchema.index({ userId: 1 }, { sparse: true });

// Virtual: Primary image
resourceSchema.virtual('primaryImage').get(function () {
  if (!this.images || this.images.length === 0) return null;

  const primary = this.images.find((img) => img.isPrimary);
  return primary || this.images[0];
});

// Instance method: Check if resource is available
resourceSchema.methods.isAvailableAt = function (startDate, endDate) {
  if (this.status !== 'active') {
    return false;
  }

  // Check blocked dates
  if (this.availability.blockedDates && this.availability.blockedDates.length > 0) {
    const isBlocked = this.availability.blockedDates.some((blocked) => {
      return (
        (startDate >= blocked.startDate && startDate <= blocked.endDate) ||
        (endDate >= blocked.startDate && endDate <= blocked.endDate) ||
        (startDate <= blocked.startDate && endDate >= blocked.endDate)
      );
    });

    if (isBlocked) {
      return false;
    }
  }

  return true;
};

// Instance method: Get availability schedule or organization default
resourceSchema.methods.getSchedule = async function () {
  if (this.availability.schedule && this.availability.schedule.length > 0) {
    return this.availability.schedule;
  }

  // Fall back to organization business hours
  const Organization = require('./Organization');
  const org = await Organization.findById(this.orgId);
  return org?.businessHours || [];
};

// Static method: Find resources for a service
resourceSchema.statics.findForService = function (orgId, serviceId, type = null) {
  const query = {
    orgId,
    serviceIds: serviceId,
    status: 'active',
  };

  if (type) {
    query.type = type;
  }

  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Static method: Find available resources with capacity
resourceSchema.statics.findAvailableWithCapacity = function (orgId, type = null) {
  const query = {
    orgId,
    status: 'active',
    capacity: { $gt: 0 },
  };

  if (type) {
    query.type = type;
  }

  return this.find(query).sort({ displayOrder: 1, name: 1 });
};

// Static method: Get resource utilization stats
resourceSchema.statics.getUtilizationStats = async function (orgId, resourceId, startDate, endDate) {
  const Appointment = require('./Appointment');

  const resource = await this.findById(resourceId);
  if (!resource) {
    throw new Error('Resource not found');
  }

  const appointments = await Appointment.find({
    orgId,
    resourceId,
    startTime: { $gte: startDate, $lte: endDate },
    status: { $in: ['pending', 'confirmed', 'completed'] },
  });

  const totalSlots = this._calculateTotalSlots(startDate, endDate, resource.availability.slotInterval);
  const bookedSlots = appointments.length;
  const utilization = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

  return {
    resourceId,
    resourceName: resource.name,
    totalSlots,
    bookedSlots,
    availableSlots: totalSlots - bookedSlots,
    utilizationPercentage: Math.round(utilization * 100) / 100,
  };
};

// Helper: Calculate total available slots in a date range
resourceSchema.statics._calculateTotalSlots = function (startDate, endDate, slotInterval = 30) {
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const slotsPerDay = (8 * 60) / slotInterval; // Assuming 8-hour days
  return daysDiff * slotsPerDay;
};

// Ensure virtuals are included
resourceSchema.set('toJSON', { virtuals: true });
resourceSchema.set('toObject', { virtuals: true });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
