/**
 * Organization Controller
 * Handles organization management endpoints
 */

const { Organization } = require('../models');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');
const twilio = require('twilio');

/**
 * Get current organization
 * GET /api/v1/organization
 */
const getOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.user.orgId);

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  res.json(successResponse('Organization retrieved', { organization }));
});

/**
 * Update organization
 * PATCH /api/v1/organization
 */
const updateOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.user.orgId);

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  const allowedFields = [
    'name',
    'email',
    'phone',
    'website',
    'address',
    'timezone',
    'country',
    'businessHours',
    'branding',
    'settings',
    'twilioConfig',
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (field === 'branding' || field === 'settings' || field === 'address') {
        organization[field] = { ...organization[field], ...req.body[field] };
      } else {
        organization[field] = req.body[field];
      }
    }
  }

  await organization.save();

  res.json(successResponse('Organization updated', { organization }));
});

/**
 * Get organization stats
 * GET /api/v1/organization/stats
 */
const getOrganizationStats = asyncHandler(async (req, res) => {
  const { Message, Appointment, Customer, User } = require('../models');
  const orgId = req.user.orgId;

  // Get current month date range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalMessages,
    totalAppointments,
    totalCustomers,
    totalUsers,
    upcomingAppointments,
    completedAppointments,
    // Monthly stats
    monthlyMessages,
    monthlyAppointments,
    monthlyCustomers,
    monthlyCompletedAppointments,
    // Appointments for kanban
    pendingAppointments,
    confirmedAppointments,
    completedAppointmentsThisMonth,
    canceledAppointments,
  ] = await Promise.all([
    // All-time stats
    Message.countDocuments({ orgId }),
    Appointment.countDocuments({ orgId }),
    Customer.countDocuments({ orgId }),
    User.countDocuments({ orgId }),
    Appointment.countDocuments({
      orgId,
      status: { $in: ['pending', 'confirmed'] },
      startTime: { $gte: new Date() },
    }),
    Appointment.countDocuments({
      orgId,
      status: 'completed',
    }),
    // Monthly stats
    Message.countDocuments({
      orgId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    }),
    Appointment.countDocuments({
      orgId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    }),
    Customer.countDocuments({
      orgId,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    }),
    Appointment.countDocuments({
      orgId,
      status: 'completed',
      endTime: { $gte: startOfMonth, $lte: endOfMonth },
    }),
    // Appointments for kanban (this month)
    Appointment.find({
      orgId,
      status: 'pending',
      startTime: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name color durationMinutes')
      .sort({ startTime: 1 })
      .limit(50)
      .lean(),
    Appointment.find({
      orgId,
      status: 'confirmed',
      startTime: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name color durationMinutes')
      .sort({ startTime: 1 })
      .limit(50)
      .lean(),
    Appointment.find({
      orgId,
      status: 'completed',
      endTime: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name color durationMinutes')
      .sort({ endTime: -1 })
      .limit(50)
      .lean(),
    Appointment.find({
      orgId,
      status: 'canceled',
      updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name color durationMinutes')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),
  ]);

  // Combine appointments for kanban
  const kanbanAppointments = {
    pending: pendingAppointments,
    confirmed: confirmedAppointments,
    completed: completedAppointmentsThisMonth,
    canceled: canceledAppointments,
  };

  res.json(
    successResponse('Organization stats retrieved', {
      stats: {
        // All-time stats
        totalMessages,
        totalAppointments,
        totalCustomers,
        totalUsers,
        upcomingAppointments,
        completedAppointments,
        // Monthly stats
        monthly: {
          messages: monthlyMessages,
          appointments: monthlyAppointments,
          customers: monthlyCustomers,
          completedAppointments: monthlyCompletedAppointments,
          month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
        },
        // Kanban appointments
        kanban: kanbanAppointments,
      },
    })
  );
});

/**
 * Update Twilio Configuration
 * PATCH /api/v1/organization/twilio-config
 * Admin only
 */
const updateTwilioConfig = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.user.orgId);

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  const { accountSid, authToken, messagingServiceSid } = req.body;

  try {
    // Test credentials by attempting to fetch account info
    const testClient = twilio(accountSid, authToken);
    await testClient.api.accounts(accountSid).fetch();

    // Credentials are valid, save them (they will be encrypted automatically)
    organization.setTwilioCredentials({
      accountSid,
      authToken,
      messagingServiceSid,
    });

    await organization.save();

    res.json(
      successResponse('Twilio configuration updated successfully', {
        message: 'Your Twilio credentials have been saved and encrypted.',
      })
    );
  } catch (error) {
    // Invalid credentials
    if (error.code === 20003 || error.status === 401) {
      throw new ValidationError(
        'Invalid Twilio credentials. Please check your Account SID and Auth Token.'
      );
    }

    // Other Twilio errors
    throw new ValidationError(
      `Failed to validate Twilio credentials: ${error.message}`
    );
  }
});

/**
 * Get Twilio Configuration Status
 * GET /api/v1/organization/twilio-config
 * Returns whether Twilio is configured (without exposing credentials)
 */
const getTwilioConfigStatus = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.user.orgId);

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  const hasConfig = !!(
    organization.twilioConfig &&
    organization.twilioConfig.accountSid &&
    organization.twilioConfig.authToken
  );

  res.json(
    successResponse('Twilio configuration status retrieved', {
      configured: hasConfig,
      hasMessagingService: !!(
        hasConfig && organization.twilioConfig.messagingServiceSid
      ),
    })
  );
});

/**
 * Validate Twilio Configuration
 * POST /api/v1/organization/twilio-config/validate
 * Tests credentials without saving them
 */
const validateTwilioConfig = asyncHandler(async (req, res) => {
  const { accountSid, authToken } = req.body;

  if (!accountSid || !authToken) {
    throw new ValidationError('Account SID and Auth Token are required');
  }

  try {
    // Test credentials by attempting to fetch account info
    const testClient = twilio(accountSid, authToken);
    const account = await testClient.api.accounts(accountSid).fetch();

    res.json(
      successResponse('Twilio credentials are valid', {
        valid: true,
        accountName: account.friendlyName,
        accountStatus: account.status,
      })
    );
  } catch (error) {
    // Invalid credentials
    if (error.code === 20003 || error.status === 401) {
      res.json(
        successResponse('Twilio credentials validation result', {
          valid: false,
          error: 'Invalid Account SID or Auth Token',
        })
      );
    } else {
      throw new ValidationError(`Twilio API error: ${error.message}`);
    }
  }
});

/**
 * Fetch Available Twilio Phone Numbers
 * POST /api/v1/organization/twilio-config/fetch-numbers
 * Retrieves all phone numbers from the Twilio account
 */
const fetchTwilioNumbers = asyncHandler(async (req, res) => {
  const { accountSid, authToken } = req.body;

  if (!accountSid || !authToken) {
    throw new ValidationError('Account SID and Auth Token are required');
  }

  try {
    // Create temporary client with provided credentials
    const testClient = twilio(accountSid, authToken);
    const numbers = await testClient.incomingPhoneNumbers.list({ limit: 100 });

    const formattedNumbers = numbers.map((num) => ({
      sid: num.sid,
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      capabilities: num.capabilities,
      dateCreated: num.dateCreated,
    }));

    res.json(
      successResponse('Phone numbers retrieved from Twilio', {
        numbers: formattedNumbers,
        total: formattedNumbers.length,
      })
    );
  } catch (error) {
    if (error.code === 20003 || error.status === 401) {
      throw new ValidationError('Invalid Twilio credentials');
    }
    throw new ValidationError(`Failed to fetch phone numbers: ${error.message}`);
  }
});

/**
 * Import Selected Twilio Phone Numbers
 * POST /api/v1/organization/twilio-config/import-numbers
 * Saves Twilio config and imports selected phone numbers
 */
const importTwilioNumbers = asyncHandler(async (req, res) => {
  const { PhoneNumber } = require('../models');
  const { accountSid, authToken, messagingServiceSid, selectedNumbers } = req.body;

  if (!accountSid || !authToken) {
    throw new ValidationError('Account SID and Auth Token are required');
  }

  if (!selectedNumbers || !Array.isArray(selectedNumbers) || selectedNumbers.length === 0) {
    throw new ValidationError('At least one phone number must be selected');
  }

  const organization = await Organization.findById(req.user.orgId);

  if (!organization) {
    throw new NotFoundError('Organization not found');
  }

  try {
    // Validate credentials one more time
    const testClient = twilio(accountSid, authToken);
    await testClient.api.accounts(accountSid).fetch();

    // Save Twilio credentials
    organization.setTwilioCredentials({
      accountSid,
      authToken,
      messagingServiceSid,
    });
    await organization.save();

    // Import selected numbers
    const importedNumbers = [];
    const errors = [];

    for (const numberData of selectedNumbers) {
      try {
        // Check if number already exists
        const existing = await PhoneNumber.findOne({
          twilioSid: numberData.sid,
        });

        if (existing) {
          // Update existing number
          existing.orgId = req.user.orgId;
          existing.status = 'active';
          existing.type = numberData.isIVR ? 'ivr' : 'pooled';
          await existing.save();
          importedNumbers.push(existing);
        } else {
          // Create new number
          const newNumber = await PhoneNumber.create({
            orgId: req.user.orgId,
            twilioSid: numberData.sid,
            e164: numberData.phoneNumber,
            friendlyName: numberData.friendlyName || numberData.phoneNumber,
            capabilities: {
              sms: numberData.capabilities?.sms || false,
              mms: numberData.capabilities?.mms || false,
              voice: numberData.capabilities?.voice || false,
            },
            type: numberData.isIVR ? 'ivr' : 'pooled',
            status: 'active',
            purchasedAt: numberData.dateCreated,
          });
          importedNumbers.push(newNumber);
        }
      } catch (error) {
        errors.push({
          phoneNumber: numberData.phoneNumber,
          error: error.message,
        });
      }
    }

    res.json(
      successResponse('Twilio configuration completed', {
        imported: importedNumbers.length,
        errors: errors.length,
        numbers: importedNumbers,
        errorDetails: errors,
      })
    );
  } catch (error) {
    if (error.code === 20003 || error.status === 401) {
      throw new ValidationError('Invalid Twilio credentials');
    }
    throw error;
  }
});

module.exports = {
  getOrganization,
  updateOrganization,
  getOrganizationStats,
  updateTwilioConfig,
  getTwilioConfigStatus,
  validateTwilioConfig,
  fetchTwilioNumbers,
  importTwilioNumbers,
};
