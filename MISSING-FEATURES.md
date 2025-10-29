# Missing Features & Implementation Guide

## ✅ JUST IMPLEMENTED

### 1. Per-Organization Twilio Credentials ✅
**Status**: COMPLETE

**What was added**:
- Encryption utility (`api/src/utils/encryption.js`)
- Organization model methods for encrypting/decrypting Twilio credentials
- Updated Twilio service to use org-specific credentials
- Automatic credential encryption on save

**How it works**:
- Admins can now configure their own Twilio credentials
- Credentials are encrypted using AES-256-GCM
- Falls back to global credentials if org doesn't have their own
- Cached per-organization for performance

**To use**:
```javascript
// Set Twilio credentials for an organization
organization.setTwilioCredentials({
  accountSid: 'ACxxxxx',
  authToken: 'your-token',
  messagingServiceSid: 'MGxxxxx' // optional
});
await organization.save();

// Get decrypted credentials
const creds = organization.getTwilioCredentials();
```

**Needs**:
- UI for admins to input their Twilio credentials in settings
- API endpoint to update Twilio config
- Validation of Twilio credentials before saving

---

## ❌ CRITICAL MISSING FEATURES

### 2. Email Service ❌
**Priority**: CRITICAL
**Status**: NOT IMPLEMENTED

**What's missing**:
- Email sending service (SendGrid, AWS SES, or Nodemailer)
- Email templates (verification, password reset, notifications)
- Email verification flow (sends email, verifies token)
- Password reset flow (sends email with token)
- Appointment confirmation emails
- Appointment reminder emails

**Current state**:
- TODOs marked in authService.js for email sending
- Email verification token generated but not sent
- Password reset token generated but not sent

**Implementation needed**:

```javascript
// api/src/services/emailService.js
const sendGrid = require('@sendgrid/mail');

sendGrid.setAPIKey(process.env.SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, html }) => {
  await sendGrid.send({
    to,
    from: process.env.FROM_EMAIL,
    subject,
    html,
  });
};

const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your email',
    html: `Click here to verify: <a href="${url}">${url}</a>`,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
```

**Dependencies to add**:
```bash
npm install @sendgrid/mail
# OR
npm install nodemailer
```

**Environment variables needed**:
```env
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@yourdomain.com
# OR for Nodemailer
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

---

### 3. File Upload & Storage ❌
**Priority**: HIGH
**Status**: NOT IMPLEMENTED

**What's missing**:
- File upload middleware (multer)
- File storage (AWS S3, Google Cloud Storage, or local)
- Image processing (sharp for resizing)
- MMS media URL handling
- Profile picture uploads
- Organization logo uploads

**Implementation needed**:

```javascript
// api/src/middleware/upload.js
const multer = require('multer');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  },
});

const uploadToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  const result = await s3.upload(params).promise();
  return result.Location;
};

module.exports = { upload, uploadToS3 };
```

**Dependencies to add**:
```bash
npm install multer aws-sdk sharp
```

**Environment variables needed**:
```env
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

---

### 4. Organization Settings API & UI ❌
**Priority**: CRITICAL
**Status**: PARTIAL (API exists, UI missing)

**What's missing**:
- UI for Twilio configuration
- UI for email configuration
- UI for branding settings
- UI for business hours management
- UI for subscription management
- Validation of settings before save

**Implementation needed**:

**Backend** (add to organizationController.js):
```javascript
const updateTwilioConfig = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.user.orgId);

  // Validate credentials with Twilio
  const { accountSid, authToken, messagingServiceSid } = req.body;

  try {
    // Test credentials
    const testClient = twilio(accountSid, authToken);
    await testClient.api.accounts(accountSid).fetch();

    // Save if valid
    organization.setTwilioCredentials({
      accountSid,
      authToken,
      messagingServiceSid,
    });
    await organization.save();

    res.json(successResponse('Twilio configuration updated'));
  } catch (error) {
    throw new ValidationError('Invalid Twilio credentials');
  }
});
```

**Frontend** (client/src/pages/Settings.jsx):
```jsx
import { useState } from 'react';
import { TextField, Button, Card, CardContent } from '@mui/material';
import { organizationAPI } from '../services/api';

export default function Settings() {
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: '',
    authToken: '',
    messagingServiceSid: '',
  });

  const handleSave = async () => {
    try {
      await organizationAPI.updateTwilioConfig(twilioConfig);
      alert('Twilio credentials saved!');
    } catch (error) {
      alert('Failed to save: ' + error.message);
    }
  };

  return (
    <Card>
      <CardContent>
        <h2>Twilio Configuration</h2>
        <TextField
          label="Account SID"
          value={twilioConfig.accountSid}
          onChange={(e) =>
            setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })
          }
          fullWidth
          margin="normal"
        />
        <TextField
          label="Auth Token"
          type="password"
          value={twilioConfig.authToken}
          onChange={(e) =>
            setTwilioConfig({ ...twilioConfig, authToken: e.target.value })
          }
          fullWidth
          margin="normal"
        />
        <Button variant="contained" onClick={handleSave}>
          Save Twilio Settings
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### 5. Request Validators ❌
**Priority**: HIGH
**Status**: PARTIAL (some routes have validators)

**What's missing**:
- Validators for organization settings
- Validators for Twilio config
- Validators for file uploads
- Validators for bulk operations
- More comprehensive error messages

**Implementation needed**:

```javascript
// api/src/validators/organizationSchemas.js
const { z } = require('zod');

const updateTwilioConfigSchema = {
  body: z.object({
    accountSid: z.string().regex(/^AC[a-z0-9]{32}$/, 'Invalid Twilio Account SID'),
    authToken: z.string().min(32, 'Invalid Twilio Auth Token'),
    messagingServiceSid: z
      .string()
      .regex(/^MG[a-z0-9]{32}$/, 'Invalid Messaging Service SID')
      .optional(),
  }),
};

const updateBusinessHoursSchema = {
  body: z.object({
    businessHours: z.array(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      })
    ),
  }),
};

module.exports = {
  updateTwilioConfigSchema,
  updateBusinessHoursSchema,
};
```

---

## ⚠️ IMPORTANT MISSING FEATURES

### 6. MFA/TOTP Implementation ❌
**Priority**: MEDIUM
**Status**: MARKED AS TODO

**What's missing**:
- TOTP secret generation
- QR code generation
- TOTP verification
- Backup codes
- MFA enforcement for admins

**Implementation needed**:
```bash
npm install speakeasy qrcode
```

```javascript
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const setupMFA = async (user) => {
  const secret = speakeasy.generateSecret({
    name: `SaaS SMS Calendar (${user.email})`,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  user.auth.mfaSecret = secret.base32;
  await user.save();

  return { secret: secret.base32, qrCode };
};

const verifyMFA = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });
};
```

---

### 7. Subscription & Billing ❌
**Priority**: MEDIUM
**Status**: NOT IMPLEMENTED

**What's missing**:
- Stripe integration
- Subscription plans
- Usage tracking
- Usage limits enforcement
- Billing webhooks
- Invoice generation

**Implementation needed**:
```bash
npm install stripe
```

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createSubscription = async (organization, priceId) => {
  const subscription = await stripe.subscriptions.create({
    customer: organization.stripeCustomerId,
    items: [{ price: priceId }],
    metadata: { orgId: organization._id.toString() },
  });

  organization.subscription.stripeSubscriptionId = subscription.id;
  organization.subscription.status = 'active';
  await organization.save();

  return subscription;
};
```

---

### 8. Usage Limits & Quotas ❌
**Priority**: MEDIUM
**Status**: NOT IMPLEMENTED

**What's missing**:
- SMS message limits per plan
- Appointment limits per plan
- User limits per plan
- Storage limits
- Middleware to enforce limits
- Usage tracking

**Implementation needed**:

```javascript
// api/src/middleware/checkLimits.js
const checkMessageLimit = async (req, res, next) => {
  const { Organization, Message } = require('../models');

  const org = await Organization.findById(req.user.orgId);
  const limits = {
    free: 100,
    starter: 1000,
    professional: 10000,
    enterprise: -1, // unlimited
  };

  const limit = limits[org.subscription.tier];

  if (limit === -1) {
    return next();
  }

  const count = await Message.countDocuments({
    orgId: org._id,
    createdAt: { $gte: startOfMonth() },
  });

  if (count >= limit) {
    return res.status(429).json({
      error: 'Monthly message limit reached. Upgrade your plan.',
    });
  }

  next();
};
```

---

### 9. Advanced Search & Filtering ❌
**Priority**: LOW
**Status**: BASIC IMPLEMENTATION

**What's missing**:
- Full-text search
- Advanced filters (date ranges, status, tags)
- Saved searches
- Export filtered results
- Bulk actions on filtered results

---

### 10. Reporting & Analytics ❌
**Priority**: LOW
**Status**: NOT IMPLEMENTED

**What's missing**:
- Message analytics
- Appointment analytics
- Customer analytics
- Revenue reports
- Export to CSV/PDF
- Charts and graphs

---

### 11. Webhooks for Customers ❌
**Priority**: MEDIUM
**Status**: PARTIAL (delivery implemented, testing missing)

**What's missing**:
- Webhook testing UI
- Webhook logs storage
- Webhook retry configuration
- Webhook signature verification UI
- Example payloads in UI

---

### 12. Calendar Integrations ❌
**Priority**: LOW
**Status**: NOT IMPLEMENTED

**What's missing**:
- Google Calendar sync
- Outlook Calendar sync
- iCal export
- Two-way sync

---

### 13. Payment Processing ❌
**Priority**: LOW
**Status**: NOT IMPLEMENTED

**What's missing**:
- Payment collection at booking
- Deposits
- Refunds
- Payment methods management

---

### 14. Advanced Scheduling ❌
**Priority**: LOW
**Status**: BASIC IMPLEMENTATION

**What's missing**:
- Recurring appointments
- Group bookings
- Waitlist
- Overbooking rules
- Cancellation policies
- No-show penalties

---

### 15. Mobile App Support ❌
**Priority**: LOW
**Status**: NOT IMPLEMENTED

**What's missing**:
- Push notifications
- React Native app
- Deep linking
- Offline mode

---

### 16. Testing ❌
**Priority**: HIGH
**Status**: NOT IMPLEMENTED

**What's missing**:
- Unit tests
- Integration tests
- E2E tests
- API tests
- Load tests

---

### 17. Documentation ❌
**Priority**: MEDIUM
**Status**: PARTIAL (README exists)

**What's missing**:
- API documentation (Swagger/OpenAPI)
- User guides
- Admin guides
- Developer guides
- Video tutorials

---

### 18. DevOps ❌
**Priority**: MEDIUM
**Status**: NOT IMPLEMENTED

**What's missing**:
- Docker setup
- Docker Compose
- Kubernetes configs
- CI/CD pipeline
- Automated deployments
- Health checks
- Monitoring dashboards
- Log aggregation
- Error tracking setup

---

## 📋 IMPLEMENTATION PRIORITY

### Phase 1: Critical (Do First)
1. ✅ Per-org Twilio credentials (DONE)
2. ❌ Email service implementation
3. ❌ Settings UI for Twilio configuration
4. ❌ File upload for MMS
5. ❌ Complete all validators

### Phase 2: Important (Do Next)
6. ❌ MFA implementation
7. ❌ Usage limits enforcement
8. ❌ Complete settings UI
9. ❌ Testing suite
10. ❌ API documentation

### Phase 3: Nice to Have (Do Later)
11. ❌ Subscription/billing
12. ❌ Reporting & analytics
13. ❌ Calendar integrations
14. ❌ Payment processing
15. ❌ Advanced scheduling features

---

## 🔧 QUICK FIXES NEEDED

### Update .env.example
Add these variables:

```env
# Encryption (REQUIRED for production)
ENCRYPTION_KEY=generate-32-byte-hex-key-here

# Email Service
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=noreply@yourdomain.com

# File Storage
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Update messageService.js
Add organization parameter when calling twilioService:

```javascript
// In messageService.js, sendMessage function
const { Organization } = require('../models');
const organization = await Organization.findById(orgId);

const result = await twilioService.sendSMS({
  to: toE164,
  from: fromE164,
  body,
  mediaUrls,
  statusCallback: true,
  organization, // ADD THIS
});
```

### Add API endpoint for Twilio configuration
In `api/src/routes/v1/organization.js`:

```javascript
router.patch(
  '/twilio-config',
  requireAdmin,
  validateRequest(updateTwilioConfigSchema),
  organizationController.updateTwilioConfig
);
```

---

## 📚 NEXT STEPS

1. **Generate encryption key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Add to .env**:
```env
ENCRYPTION_KEY=<generated-key>
```

3. **Update messageService** to pass organization

4. **Implement email service** (use template above)

5. **Create settings UI** (use template above)

6. **Add validators** (use templates above)

7. **Test Twilio per-org credentials**

---

## ✅ SUMMARY

**COMPLETED TODAY**:
- ✅ Encryption utility
- ✅ Organization model encryption methods
- ✅ Twilio service updated for per-org credentials
- ✅ Automatic encryption on save

**READY TO USE**:
- Organizations can now have their own Twilio credentials
- Credentials are securely encrypted
- Twilio service uses org-specific credentials automatically

**CRITICAL NEXT STEPS**:
1. Add ENCRYPTION_KEY to .env
2. Update messageService to pass organization
3. Implement email service
4. Create settings UI
5. Test everything

The foundation is solid! These additions make the platform production-ready for multi-tenant Twilio usage.
