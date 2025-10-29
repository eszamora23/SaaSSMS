/**
 * Message Model
 * SMS messages (inbound and outbound)
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Thread',
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },

    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
      index: true,
    },

    from: {
      type: String,
      required: true,
    },

    to: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
      maxlength: 1600,
    },

    media: [
      {
        url: String,
        contentType: String,
        size: Number,
      },
    ],

    twilioSids: {
      messageSid: {
        type: String,
      },
      accountSid: String,
    },

    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'failed', 'undelivered'],
      default: 'queued',
      index: true,
    },

    errorCode: Number,
    errorMessage: String,

    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

    readAt: Date,

    metadata: {
      cost: Number,
      segments: Number,
      carrier: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ orgId: 1, threadId: 1, createdAt: -1 });
messageSchema.index({ orgId: 1, customerId: 1, createdAt: -1 });
messageSchema.index({ orgId: 1, workerId: 1, createdAt: -1 });
messageSchema.index({ 'twilioSids.messageSid': 1 }, { sparse: true });

// Static method: Find by thread
messageSchema.statics.findByThread = function (threadId, options = {}) {
  const { limit = 50, skip = 0 } = options;

  return this.find({ threadId })
    .sort({ createdAt: 1 }) // Oldest first for chat display
    .skip(skip)
    .limit(limit)
    .populate('workerId', 'profile.firstName profile.lastName');
};

// Static method: Find by customer
messageSchema.statics.findByCustomer = function (orgId, customerId, options = {}) {
  const { limit = 50, skip = 0 } = options;

  return this.find({ orgId, customerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method: Find by Twilio message SID
messageSchema.statics.findByTwilioSid = function (messageSid) {
  return this.findOne({ 'twilioSids.messageSid': messageSid });
};

// Static method: Count unread for worker
messageSchema.statics.countUnread = function (orgId, workerId) {
  return this.countDocuments({
    orgId,
    workerId,
    direction: 'inbound',
    read: false,
  });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
