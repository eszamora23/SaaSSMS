/**
 * Organization Model
 * Multi-tenant organization entity
 */

const mongoose = require('mongoose');
const slugify = require('slugify');
const { encrypt, decrypt } = require('../utils/encryption');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [3, 'Organization name must be at least 3 characters'],
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Organization email is required'],
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    country: {
      type: String,
      required: [true, 'Country is required'],
      default: 'US',
    },

    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      default: 'America/New_York',
    },

    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'canceled'],
      default: 'pending',
    },

    businessHours: [
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

    holidays: [
      {
        date: {
          type: Date,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
      },
    ],

    branding: {
      logo: String,
      primaryColor: {
        type: String,
        default: '#1976D2',
      },
      secondaryColor: {
        type: String,
        default: '#DC004E',
      },
      customDomain: String,
    },

    features: {
      ivrEnabled: {
        type: Boolean,
        default: false,
      },
      emailEnabled: {
        type: Boolean,
        default: false,
      },
      paymentsEnabled: {
        type: Boolean,
        default: false,
      },
    },

    settings: {
      emailVerificationRequired: {
        type: Boolean,
        default: false,
      },
    },

    twilioConfig: {
      accountSid: String,
      authToken: String,
      messagingServiceSid: String,
    },

    // Google Calendar OAuth Credentials (organization-wide)
    googleCalendarConfig: {
      accessToken: String,
      refreshToken: String,
      expiryDate: Date,
      scope: String,
      tokenType: String,
      connectedAt: Date,
      connectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },

    ivrNumberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PhoneNumber',
    },

    subscription: {
      tier: {
        type: String,
        enum: ['free', 'starter', 'professional', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['trial', 'active', 'past_due', 'canceled'],
        default: 'trial',
      },
      expiresAt: Date,
    },

    compliance: {
      dataRetentionDays: {
        type: Number,
        default: 730, // 2 years
      },
      gdprEnabled: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: slug already has a unique index from unique: true in schema
organizationSchema.index({ status: 1 });
organizationSchema.index({ createdAt: -1 });

// Pre-save hook: Generate slug from name
organizationSchema.pre('save', async function (next) {
  if ((this.isNew || this.isModified('name')) && !this.slug) {
    const baseSlug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });

    // Ensure uniqueness
    let slug = baseSlug;
    let counter = 1;

    while (await this.constructor.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    this.slug = slug;
  }

  next();
});

// Set default business hours if not provided
organizationSchema.pre('save', function (next) {
  if (this.isNew && (!this.businessHours || this.businessHours.length === 0)) {
    // Default: Monday-Friday, 9 AM - 5 PM
    this.businessHours = [
      { dayOfWeek: 1, start: '09:00', end: '17:00' }, // Monday
      { dayOfWeek: 2, start: '09:00', end: '17:00' }, // Tuesday
      { dayOfWeek: 3, start: '09:00', end: '17:00' }, // Wednesday
      { dayOfWeek: 4, start: '09:00', end: '17:00' }, // Thursday
      { dayOfWeek: 5, start: '09:00', end: '17:00' }, // Friday
    ];
  }

  next();
});

// Virtual: Full subdomain URL
organizationSchema.virtual('subdomainUrl').get(function () {
  const baseDomain = process.env.BASE_DOMAIN || 'localhost:3000';
  return `https://${this.slug}.${baseDomain}`;
});

// Instance method: Activate organization
organizationSchema.methods.activate = function () {
  this.status = 'active';
  return this.save();
};

// Instance method: Suspend organization
organizationSchema.methods.suspend = function () {
  this.status = 'suspended';
  return this.save();
};

// Static method: Find active organizations
organizationSchema.statics.findActive = function () {
  return this.find({ status: 'active' });
};

// Static method: Find by slug
organizationSchema.statics.findBySlug = function (slug) {
  return this.findOne({ slug, status: 'active' });
};

// Instance method: Get default phone number
organizationSchema.methods.getDefaultPhoneNumber = async function () {
  const PhoneNumber = require('./PhoneNumber');

  // Try to find IVR number first
  let phoneNumber = await PhoneNumber.findOne({
    orgId: this._id,
    isIVRNumber: true,
    status: 'active',
  });

  // If no IVR number, return any active number
  if (!phoneNumber) {
    phoneNumber = await PhoneNumber.findOne({
      orgId: this._id,
      status: 'active',
    });
  }

  return phoneNumber;
};

// Instance method: Get decrypted Twilio credentials
organizationSchema.methods.getTwilioCredentials = function () {
  if (!this.twilioConfig || !this.twilioConfig.accountSid) {
    return null;
  }

  return {
    accountSid: decrypt(this.twilioConfig.accountSid),
    authToken: decrypt(this.twilioConfig.authToken),
    messagingServiceSid: this.twilioConfig.messagingServiceSid
      ? decrypt(this.twilioConfig.messagingServiceSid)
      : null,
  };
};

// Instance method: Set Twilio credentials (encrypts them)
organizationSchema.methods.setTwilioCredentials = function ({
  accountSid,
  authToken,
  messagingServiceSid,
}) {
  this.twilioConfig = {
    accountSid: accountSid ? encrypt(accountSid) : null,
    authToken: authToken ? encrypt(authToken) : null,
    messagingServiceSid: messagingServiceSid ? encrypt(messagingServiceSid) : null,
  };
};

// Pre-save hook: Encrypt Twilio credentials if modified
organizationSchema.pre('save', function (next) {
  // Only encrypt if twilioConfig is modified and not already encrypted
  if (this.isModified('twilioConfig') && this.twilioConfig) {
    // Check if already encrypted (contains ':' from iv:authTag:encrypted format)
    if (
      this.twilioConfig.accountSid &&
      !this.twilioConfig.accountSid.includes(':')
    ) {
      this.twilioConfig.accountSid = encrypt(this.twilioConfig.accountSid);
    }
    if (this.twilioConfig.authToken && !this.twilioConfig.authToken.includes(':')) {
      this.twilioConfig.authToken = encrypt(this.twilioConfig.authToken);
    }
    if (
      this.twilioConfig.messagingServiceSid &&
      !this.twilioConfig.messagingServiceSid.includes(':')
    ) {
      this.twilioConfig.messagingServiceSid = encrypt(
        this.twilioConfig.messagingServiceSid
      );
    }
  }
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
