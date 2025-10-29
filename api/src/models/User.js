/**
 * User Model
 * System users (admins and workers)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => validator.isEmail(v),
        message: 'Invalid email format',
      },
    },

    passwordHash: {
      type: String,
      required: function () {
        // Password required unless OAuth
        return !this.auth?.oauthProvider;
      },
      select: false, // Don't return password hash by default
    },

    profile: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
      },
      phone: String,
      avatar: String,
    },

    role: {
      type: String,
      enum: ['admin', 'worker'],
      default: 'worker',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['invited', 'active', 'disabled'],
      default: 'invited',
      index: true,
    },

    auth: {
      mfaEnabled: {
        type: Boolean,
        default: false,
      },
      mfaSecret: {
        type: String,
        select: false,
      },
      lastLoginAt: Date,
      lastLoginIp: String,
      passwordResetToken: String,
      passwordResetExpires: Date,
      emailVerificationToken: String,
      emailVerificationExpires: Date,
      oauthProvider: String, // 'google', 'microsoft', etc.
      oauthId: String,
    },

    workerProfile: {
      type: {
        skills: [String],
        bookingEnabled: {
          type: Boolean,
          default: true,
        },
        bio: String,
        serviceIds: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Service',
        }],
        availability: [
          {
            dayOfWeek: {
              type: Number,
              min: 0,
              max: 6,
            },
            start: String, // HH:MM format
            end: String,   // HH:MM format
          },
        ],
        availabilityOverrides: [
          {
            type: {
              type: String,
              enum: ['available', 'unavailable', 'vacation'],
            },
            date: Date,
            start: String,
            end: String,
          },
        ],
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
userSchema.index({ orgId: 1, email: 1 }, { unique: true }); // Email unique per org
userSchema.index({ orgId: 1, role: 1 });
userSchema.index({ orgId: 1, status: 1 });

// Virtual: Full name
userSchema.virtual('fullName').get(function () {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save hook: Hash password if modified
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('passwordHash')) {
    return next();
  }

  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, rounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save hook: Set workerProfile for workers and admins
userSchema.pre('save', function (next) {
  // Auto-create workerProfile for workers if missing
  if (this.role === 'worker' && !this.workerProfile) {
    this.workerProfile = {
      skills: [],
      bookingEnabled: true,
      availabilityOverrides: [],
    };
  }

  // Allow admins to have workerProfile (for booking capabilities)
  // But remove workerProfile for non-worker/non-admin roles
  if (this.role !== 'worker' && this.role !== 'admin') {
    this.workerProfile = null;
  }

  next();
});

// Instance method: Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Need to explicitly select passwordHash for comparison
  if (!this.passwordHash) {
    const user = await this.constructor.findById(this._id).select('+passwordHash');
    return await bcrypt.compare(candidatePassword, user.passwordHash);
  }

  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Instance method: Activate user
userSchema.methods.activate = function () {
  this.status = 'active';
  return this.save();
};

// Instance method: Disable user
userSchema.methods.disable = function () {
  this.status = 'disabled';
  return this.save();
};

// Static method: Find by email (scoped to org)
userSchema.statics.findByEmail = function (orgId, email) {
  return this.findOne({ orgId, email: email.toLowerCase() });
};

// Static method: Find active users in org
userSchema.statics.findActiveUsers = function (orgId, role = null) {
  const query = { orgId, status: 'active' };

  if (role) {
    query.role = role;
  }

  return this.find(query);
};

// Static method: Find workers in org
userSchema.statics.findWorkers = function (orgId, onlyBookable = false) {
  const query = { orgId, role: 'worker', status: 'active' };

  if (onlyBookable) {
    query['workerProfile.bookingEnabled'] = true;
  }

  return this.find(query);
};

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
