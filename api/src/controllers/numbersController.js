/**
 * Phone Numbers Controller
 * Handles Twilio phone number management
 */

const { PhoneNumber } = require('../models');
const twilioService = require('../services/twilioService');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/errors');

/**
 * Search available phone numbers
 * GET /api/v1/numbers/search
 */
const searchNumbers = asyncHandler(async (req, res) => {
  const { country = 'US', areaCode, contains, smsEnabled = true, limit = 20 } = req.query;

  const numbers = await twilioService.searchNumbers({
    country,
    areaCode,
    contains,
    smsEnabled: smsEnabled === 'true',
    limit: parseInt(limit),
  });

  res.json(successResponse('Available numbers retrieved', { numbers }));
});

/**
 * Purchase phone number
 * POST /api/v1/numbers
 */
const purchaseNumber = asyncHandler(async (req, res) => {
  const { phoneNumber, friendlyName } = req.body;

  // Purchase from Twilio
  const twilioNumber = await twilioService.purchaseNumber({
    phoneNumber,
  });

  // Save to database
  const number = await PhoneNumber.create({
    orgId: req.user.orgId,
    phoneNumber: twilioNumber.phoneNumber,
    friendlyName: friendlyName || twilioNumber.friendlyName,
    twilioSid: twilioNumber.sid,
    capabilities: twilioNumber.capabilities,
    status: 'active',
  });

  res.status(201).json(successResponse('Phone number purchased', { number }));
});

/**
 * Get all organization phone numbers
 * GET /api/v1/numbers
 */
const getNumbers = asyncHandler(async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  const query = { orgId: req.user.orgId };

  if (status) query.status = status;

  const numbers = await PhoneNumber.find(query)
    .populate('assignedTo', 'profile email')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  const total = await PhoneNumber.countDocuments(query);

  res.json(
    successResponse('Phone numbers retrieved', {
      numbers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  );
});

/**
 * Get phone number by ID
 * GET /api/v1/numbers/:id
 */
const getNumber = asyncHandler(async (req, res) => {
  const number = await PhoneNumber.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  }).populate('assignedTo', 'profile email');

  if (!number) {
    throw new NotFoundError('Phone number not found');
  }

  res.json(successResponse('Phone number retrieved', { number }));
});

/**
 * Update phone number
 * PATCH /api/v1/numbers/:id
 */
const updateNumber = asyncHandler(async (req, res) => {
  const { friendlyName, assignedTo, isIVRNumber, status } = req.body;

  const number = await PhoneNumber.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!number) {
    throw new NotFoundError('Phone number not found');
  }

  if (friendlyName !== undefined) number.friendlyName = friendlyName;
  if (assignedTo !== undefined) number.assignedTo = assignedTo || null;
  if (isIVRNumber !== undefined) number.isIVRNumber = isIVRNumber;
  if (status !== undefined) number.status = status;

  await number.save();

  res.json(successResponse('Phone number updated', { number }));
});

/**
 * Release phone number
 * DELETE /api/v1/numbers/:id
 */
const releaseNumber = asyncHandler(async (req, res) => {
  const number = await PhoneNumber.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!number) {
    throw new NotFoundError('Phone number not found');
  }

  // Release from Twilio
  await twilioService.releaseNumber(number.twilioSid);

  // Delete from database
  await number.deleteOne();

  res.json(successResponse('Phone number released'));
});

module.exports = {
  searchNumbers,
  purchaseNumber,
  getNumbers,
  getNumber,
  updateNumber,
  releaseNumber,
};
