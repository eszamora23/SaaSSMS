/**
 * ApiKey Model
 * API keys for external integrations
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      select: false,
    },

    keyPrefix: {
      type: String,
      required: true,
      index: true,
    },

    scopes: [
      {
        type: String,
        enum: [
          'customers:read',
          'customers:write',
          'appointments:read',
          'appointments:write',
          'messages:read',
          'messages:write',
          'services:read',
          'webhooks:read',
          'webhooks:write',
          '*', // Full access
        ],
      },
    ],

    status: {
      type: String,
      enum: ['active', 'revoked', 'expired'],
      default: 'active',
      index: true,
    },

    rateLimit: {
      requestsPerHour: {
        type: Number,
        default: 1000,
      },
    },

    lastUsedAt: Date,
    lastUsedIp: String,

    expiresAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
apiKeySchema.index({ orgId: 1, status: 1 });
apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method: Generate new API key
apiKeySchema.statics.generateKey = async function (orgId, name, scopes, createdBy, expiresInDays = null) {
  // Generate random API key (sk_live_...)
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
  const apiKey = `sk_${env}_${randomBytes}`;

  // Hash the key for storage
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Store prefix for identification (first 12 chars)
  const keyPrefix = apiKey.substring(0, 12);

  // Calculate expiration
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

  // Create API key document
  const apiKeyDoc = await this.create({
    orgId,
    name,
    keyHash,
    keyPrefix,
    scopes,
    status: 'active',
    expiresAt,
    createdBy,
  });

  // Return both the API key (only shown once!) and the document
  return {
    apiKey, // Actual key - show to user only once!
    document: apiKeyDoc,
  };
};

// Static method: Verify API key
apiKeySchema.statics.verifyKey = async function (apiKey) {
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  const apiKeyDoc = await this.findOne({
    keyHash,
    status: 'active',
  })
    .populate('orgId', 'name slug status')
    .select('+keyHash');

  if (!apiKeyDoc) {
    return null;
  }

  // Check expiration
  if (apiKeyDoc.expiresAt && apiKeyDoc.expiresAt < new Date()) {
    apiKeyDoc.status = 'expired';
    await apiKeyDoc.save();
    return null;
  }

  // Update last used
  apiKeyDoc.lastUsedAt = new Date();
  await apiKeyDoc.save();

  return apiKeyDoc;
};

// Instance method: Revoke key
apiKeySchema.methods.revoke = function () {
  this.status = 'revoked';
  return this.save();
};

// Instance method: Check if has scope
apiKeySchema.methods.hasScope = function (requiredScope) {
  // Full access
  if (this.scopes.includes('*')) {
    return true;
  }

  // Exact match
  if (this.scopes.includes(requiredScope)) {
    return true;
  }

  // Check wildcard (e.g., customers:* matches customers:read)
  const [resource] = requiredScope.split(':');
  if (this.scopes.includes(`${resource}:*`)) {
    return true;
  }

  return false;
};

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

module.exports = ApiKey;
