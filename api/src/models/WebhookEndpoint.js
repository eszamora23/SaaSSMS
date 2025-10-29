/**
 * WebhookEndpoint Model
 * Organization webhook configurations
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const webhookEndpointSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    url: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'URL must be a valid HTTP/HTTPS URL',
      },
    },

    secret: {
      type: String,
      required: true,
      select: false, // Don't return secret by default
    },

    events: [
      {
        type: String,
        enum: [
          '*', // All events
          'message.created',
          'message.status.updated',
          'customer.created',
          'customer.updated',
          'customer.merged',
          'appointment.created',
          'appointment.updated',
          'appointment.canceled',
          'appointment.rescheduled',
          'appointment.no_show',
          'thread.assigned',
          'thread.updated',
        ],
      },
    ],

    status: {
      type: String,
      enum: ['active', 'disabled', 'failed'],
      default: 'active',
      index: true,
    },

    description: String,

    stats: {
      totalDeliveries: {
        type: Number,
        default: 0,
      },
      successfulDeliveries: {
        type: Number,
        default: 0,
      },
      failedDeliveries: {
        type: Number,
        default: 0,
      },
      lastDeliveryAt: Date,
      lastDeliveryStatus: String,
      lastError: String,
    },

    retryConfig: {
      maxAttempts: {
        type: Number,
        default: 5,
      },
      backoffMultiplier: {
        type: Number,
        default: 2,
      },
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

// Indexes
webhookEndpointSchema.index({ orgId: 1, status: 1 });

// Pre-save: Generate secret if not provided
webhookEndpointSchema.pre('save', function (next) {
  if (this.isNew && !this.secret) {
    this.secret = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Instance method: Rotate secret
webhookEndpointSchema.methods.rotateSecret = function () {
  this.secret = crypto.randomBytes(32).toString('hex');
  return this.save();
};

// Instance method: Disable endpoint
webhookEndpointSchema.methods.disable = function () {
  this.status = 'disabled';
  return this.save();
};

// Instance method: Enable endpoint
webhookEndpointSchema.methods.enable = function () {
  this.status = 'active';
  return this.save();
};

// Instance method: Update stats after delivery
webhookEndpointSchema.methods.recordDelivery = function (success, error = null) {
  this.stats.totalDeliveries += 1;
  this.stats.lastDeliveryAt = new Date();

  if (success) {
    this.stats.successfulDeliveries += 1;
    this.stats.lastDeliveryStatus = 'success';
    this.stats.lastError = null;

    // Re-enable if was failed
    if (this.status === 'failed') {
      this.status = 'active';
    }
  } else {
    this.stats.failedDeliveries += 1;
    this.stats.lastDeliveryStatus = 'failed';
    this.stats.lastError = error;

    // Mark as failed if too many consecutive failures
    const failureRate = this.stats.failedDeliveries / this.stats.totalDeliveries;
    if (failureRate > 0.5 && this.stats.totalDeliveries > 10) {
      this.status = 'failed';
    }
  }

  return this.save();
};

// Static method: Find active endpoints for event
webhookEndpointSchema.statics.findForEvent = function (orgId, eventType) {
  return this.find({
    orgId,
    status: 'active',
    $or: [{ events: '*' }, { events: eventType }],
  }).select('+secret');
};

const WebhookEndpoint = mongoose.model('WebhookEndpoint', webhookEndpointSchema);

module.exports = WebhookEndpoint;
