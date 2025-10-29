/**
 * Thread Model
 * SMS conversation threads (groups messages by customer)
 */

const mongoose = require('mongoose');

const threadSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },

    channel: {
      type: String,
      enum: ['sms', 'email', 'voice', 'web'],
      default: 'sms',
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },

    assignedAt: Date,

    status: {
      type: String,
      enum: ['open', 'closed', 'spam'],
      default: 'open',
      index: true,
    },

    tags: [String],

    lastMessageAt: {
      type: Date,
      index: true,
    },

    lastMessagePreview: {
      type: String,
      maxlength: 200,
    },

    lastMessageDirection: {
      type: String,
      enum: ['inbound', 'outbound'],
    },

    unreadCount: {
      type: Number,
      default: 0,
    },

    messageCount: {
      type: Number,
      default: 0,
    },

    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
threadSchema.index({ orgId: 1, status: 1, lastMessageAt: -1 });
threadSchema.index({ orgId: 1, assignedTo: 1, status: 1 });

// Instance method: Assign to worker
threadSchema.methods.assignTo = function (workerId) {
  this.assignedTo = workerId;
  this.assignedAt = new Date();
  return this.save();
};

// Instance method: Unassign
threadSchema.methods.unassign = function () {
  this.assignedTo = null;
  this.assignedAt = null;
  return this.save();
};

// Instance method: Close thread
threadSchema.methods.close = function () {
  this.status = 'closed';
  return this.save();
};

// Instance method: Reopen thread
threadSchema.methods.reopen = function () {
  this.status = 'open';
  return this.save();
};

// Instance method: Mark as spam
threadSchema.methods.markAsSpam = function () {
  this.status = 'spam';
  return this.save();
};

// Instance method: Update with new message
threadSchema.methods.updateWithMessage = function (message) {
  this.lastMessageAt = message.createdAt;
  this.lastMessagePreview = message.body.substring(0, 200);
  this.lastMessageDirection = message.direction;
  this.messageCount += 1;

  if (message.direction === 'inbound' && !message.read) {
    this.unreadCount += 1;
  }

  return this.save();
};

// Instance method: Mark messages as read
threadSchema.methods.markAsRead = function () {
  this.unreadCount = 0;
  return this.save();
};

// Static method: Find or create thread
threadSchema.statics.findOrCreate = async function (orgId, customerId, channel = 'sms') {
  let thread = await this.findOne({
    orgId,
    customerId,
    channel,
    status: { $ne: 'spam' },
  });

  if (!thread) {
    thread = await this.create({
      orgId,
      customerId,
      channel,
      status: 'open',
    });
  }

  return thread;
};

// Static method: Find unassigned threads
threadSchema.statics.findUnassigned = function (orgId) {
  return this.find({
    orgId,
    assignedTo: null,
    status: 'open',
  }).sort({ lastMessageAt: -1 });
};

// Static method: Find by worker
threadSchema.statics.findByWorker = function (orgId, workerId, status = 'open') {
  const query = {
    orgId,
    assignedTo: workerId,
  };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ lastMessageAt: -1 })
    .populate('customerId', 'name phone email');
};

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;
