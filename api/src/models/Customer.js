/**
 * Customer Model
 * CRM customer/contact entity
 */

const mongoose = require('mongoose');
const validator = require('validator');

const customerSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },

    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: (v) => {
          // Accept E.164 format (+15551234567) or plain numbers (60097557)
          return /^\+[1-9]\d{1,14}$/.test(v) || /^\d{7,20}$/.test(v);
        },
        message: 'Phone must be a valid phone number (7-20 digits, optionally starting with +)',
      },
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return !v || validator.isEmail(v);
        },
        message: 'Invalid email format',
      },
    },

    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    customFields: {
      type: Map,
      of: String,
    },

    consents: {
      smsOptIn: {
        granted: {
          type: Boolean,
          default: false,
        },
        at: Date,
        method: String, // 'explicit', 'implied', 'form', etc.
      },
      emailOptIn: {
        granted: {
          type: Boolean,
          default: false,
        },
        at: Date,
        method: String,
      },
    },

    stats: {
      totalAppointments: {
        type: Number,
        default: 0,
      },
      noShows: {
        type: Number,
        default: 0,
      },
      lifetimeValue: {
        type: Number,
        default: 0,
      },
      lastContactAt: Date,
    },

    mergedInto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    mergedIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
      },
    ],

    source: {
      type: String,
      enum: ['manual', 'sms_inbound', 'booking', 'import', 'api'],
      default: 'manual',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
customerSchema.index({ orgId: 1, phone: 1 }, { unique: true }); // Phone unique per org
customerSchema.index({ orgId: 1, email: 1 }); // Search by email
customerSchema.index({ orgId: 1, tags: 1 }); // Filter by tags
customerSchema.index({ createdAt: -1 }); // Sort by date
customerSchema.index({ 'stats.lastContactAt': -1 }); // Recently contacted

// Text index for search
customerSchema.index({ name: 'text', email: 'text' });

// Virtual: No-show rate
customerSchema.virtual('noShowRate').get(function () {
  if (this.stats.totalAppointments === 0) return 0;
  return ((this.stats.noShows / this.stats.totalAppointments) * 100).toFixed(2);
});

// Virtual: Show rate
customerSchema.virtual('showRate').get(function () {
  if (this.stats.totalAppointments === 0) return 0;
  const shows = this.stats.totalAppointments - this.stats.noShows;
  return ((shows / this.stats.totalAppointments) * 100).toFixed(2);
});

// Instance method: Opt in to SMS
customerSchema.methods.optInSMS = function (method = 'explicit') {
  this.consents.smsOptIn.granted = true;
  this.consents.smsOptIn.at = new Date();
  this.consents.smsOptIn.method = method;
  return this.save();
};

// Instance method: Opt out of SMS
customerSchema.methods.optOutSMS = function () {
  this.consents.smsOptIn.granted = false;
  this.consents.smsOptIn.at = new Date();
  return this.save();
};

// Instance method: Update last contact
customerSchema.methods.updateLastContact = function () {
  this.stats.lastContactAt = new Date();
  return this.save();
};

// Instance method: Increment appointments
customerSchema.methods.incrementAppointments = function () {
  this.stats.totalAppointments += 1;
  return this.save();
};

// Instance method: Mark no-show
customerSchema.methods.markNoShow = function () {
  this.stats.noShows += 1;
  return this.save();
};

// Static method: Find by phone (scoped to org)
customerSchema.statics.findByPhone = function (orgId, phone) {
  return this.findOne({ orgId, phone, mergedInto: null });
};

// Static method: Search customers
customerSchema.statics.search = function (orgId, query, options = {}) {
  const { limit = 20, skip = 0, sort = { createdAt: -1 } } = options;

  const filter = { orgId, mergedInto: null };

  // Text search if query provided
  if (query) {
    filter.$text = { $search: query };
  }

  return this.find(filter).sort(sort).limit(limit).skip(skip).select('-__v');
};

// Static method: Find by tags
customerSchema.statics.findByTags = function (orgId, tags, options = {}) {
  const { limit = 20, skip = 0 } = options;

  return this.find({
    orgId,
    tags: { $in: tags },
    mergedInto: null,
  })
    .limit(limit)
    .skip(skip);
};

// Static method: Find recently contacted
customerSchema.statics.findRecentlyContacted = function (orgId, limit = 10) {
  return this.find({ orgId, mergedInto: null })
    .sort({ 'stats.lastContactAt': -1 })
    .limit(limit);
};

// Ensure virtuals are included
customerSchema.set('toJSON', { virtuals: true });
customerSchema.set('toObject', { virtuals: true });

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
