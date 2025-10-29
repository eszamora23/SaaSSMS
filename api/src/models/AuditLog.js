/**
 * AuditLog Model
 * Track all sensitive operations for security and compliance
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    actor: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      email: String,
      role: String,
      type: {
        type: String,
        enum: ['user', 'system', 'api_key'],
        default: 'user',
      },
    },

    action: {
      type: String,
      required: true,
      enum: [
        'create',
        'read',
        'update',
        'delete',
        'login',
        'logout',
        'assign',
        'unassign',
        'export',
        'import',
        'merge',
        'send_sms',
        'book_appointment',
        'cancel_appointment',
        'opt_out',
        'opt_in',
      ],
      index: true,
    },

    entityType: {
      type: String,
      required: true,
      enum: [
        'organization',
        'user',
        'customer',
        'message',
        'appointment',
        'service',
        'phone_number',
        'webhook',
        'api_key',
        'thread',
      ],
      index: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed,
    },

    metadata: {
      ip: String,
      userAgent: String,
      method: {
        type: String,
        enum: ['API', 'UI', 'Webhook', 'System'],
        default: 'API',
      },
      requestId: String,
      duration: Number, // milliseconds
    },

    result: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
    },

    errorMessage: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt
  }
);

// Indexes
auditLogSchema.index({ orgId: 1, createdAt: -1 });
auditLogSchema.index({ orgId: 1, entityType: 1, entityId: 1 });
auditLogSchema.index({ orgId: 1, action: 1 });
auditLogSchema.index({ 'actor.userId': 1, createdAt: -1 });

// TTL index - automatically delete logs older than 1 year
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Static method: Log action
auditLogSchema.statics.log = async function (data) {
  try {
    return await this.create({
      orgId: data.orgId,
      actor: data.actor || { type: 'system' },
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      changes: data.changes,
      metadata: data.metadata || {},
      result: data.result || 'success',
      errorMessage: data.errorMessage,
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to create audit log:', error);
    return null;
  }
};

// Static method: Find logs for entity
auditLogSchema.statics.findForEntity = function (orgId, entityType, entityId, limit = 50) {
  return this.find({
    orgId,
    entityType,
    entityId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor.userId', 'profile.firstName profile.lastName email');
};

// Static method: Find logs by user
auditLogSchema.statics.findByUser = function (orgId, userId, limit = 100) {
  return this.find({
    orgId,
    'actor.userId': userId,
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method: Find recent logs
auditLogSchema.statics.findRecent = function (orgId, limit = 100) {
  return this.find({ orgId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor.userId', 'profile.firstName profile.lastName email');
};

// Static method: Search logs
auditLogSchema.statics.search = function (orgId, filters = {}, limit = 100) {
  const query = { orgId };

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.entityType) {
    query.entityType = filters.entityType;
  }

  if (filters.userId) {
    query['actor.userId'] = filters.userId;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = filters.startDate;
    }
    if (filters.endDate) {
      query.createdAt.$lte = filters.endDate;
    }
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor.userId', 'profile.firstName profile.lastName email');
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
