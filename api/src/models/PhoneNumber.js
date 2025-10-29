/**
 * PhoneNumber Model
 * Twilio phone numbers managed by organizations
 */

const mongoose = require('mongoose');

const phoneNumberSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    twilioSid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    e164: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (v) => /^\+[1-9]\d{1,14}$/.test(v),
        message: 'Phone must be in E.164 format',
      },
    },

    friendlyName: String,

    country: {
      type: String,
      required: true,
      default: 'US',
    },

    type: {
      type: String,
      enum: ['worker', 'ivr', 'pooled'],
      default: 'pooled',
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },

    capabilities: {
      sms: {
        type: Boolean,
        default: true,
      },
      mms: {
        type: Boolean,
        default: false,
      },
      voice: {
        type: Boolean,
        default: false,
      },
    },

    status: {
      type: String,
      enum: ['active', 'released', 'suspended'],
      default: 'active',
      index: true,
    },

    webhookConfig: {
      smsUrl: String,
      voiceUrl: String,
    },

    monthlyCost: Number,

    purchasedAt: Date,
    releasedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
phoneNumberSchema.index({ orgId: 1, type: 1 });
phoneNumberSchema.index({ orgId: 1, assignedTo: 1 });

// Static method: Find available numbers for assignment
phoneNumberSchema.statics.findAvailableForOrg = function (orgId) {
  return this.find({
    orgId,
    type: 'pooled',
    status: 'active',
    assignedTo: null,
  });
};

// Static method: Find worker's numbers
phoneNumberSchema.statics.findByWorker = function (orgId, workerId) {
  return this.find({
    orgId,
    assignedTo: workerId,
    status: 'active',
  });
};

// Static method: Find IVR number for org
phoneNumberSchema.statics.findIVRNumber = function (orgId) {
  return this.findOne({
    orgId,
    type: 'ivr',
    status: 'active',
  });
};

// Instance method: Assign to worker
phoneNumberSchema.methods.assignToWorker = function (workerId) {
  this.assignedTo = workerId;
  this.type = 'worker';
  return this.save();
};

// Instance method: Unassign (return to pool)
phoneNumberSchema.methods.unassign = function () {
  this.assignedTo = null;
  this.type = 'pooled';
  return this.save();
};

// Instance method: Set as IVR
phoneNumberSchema.methods.setAsIVR = function () {
  this.type = 'ivr';
  this.assignedTo = null;
  return this.save();
};

const PhoneNumber = mongoose.model('PhoneNumber', phoneNumberSchema);

module.exports = PhoneNumber;
