/**
 * Users Controller
 * Handles user management endpoints
 */

const { User } = require('../models');
const availabilityService = require('../services/availabilityService');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ValidationError } = require('../utils/errors');

/**
 * Create user (invite)
 * POST /api/v1/users
 */
const createUser = asyncHandler(async (req, res) => {
  const { email, role, profile, workerProfile } = req.body;

  // Check if user already exists
  const existing = await User.findOne({
    orgId: req.user.orgId,
    email: email.toLowerCase(),
  });

  if (existing) {
    throw new ValidationError('User with this email already exists');
  }

  const user = await User.create({
    orgId: req.user.orgId,
    email: email.toLowerCase(),
    passwordHash: Math.random().toString(36), // Temporary password, will be set via invitation
    role,
    profile,
    workerProfile,
    status: 'invited',
  });

  // TODO: Send invitation email

  res.status(201).json(successResponse('User invited', { user }));
});

/**
 * Get all users
 * GET /api/v1/users
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role, status, limit = 50, offset = 0 } = req.query;

  const query = { orgId: req.user.orgId };

  if (role) query.role = role;
  if (status) query.status = status;

  const users = await User.find(query)
    .select('-passwordHash')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  const total = await User.countDocuments(query);

  res.json(
    successResponse('Users retrieved', {
      users,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  );
});

/**
 * Get user by ID
 * GET /api/v1/users/:id
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  }).select('-passwordHash');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json(successResponse('User retrieved', { user }));
});

/**
 * Update user
 * PATCH /api/v1/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  const allowedFields = ['profile', 'role', 'status', 'workerProfile'];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      if (field === 'profile' || field === 'workerProfile') {
        user[field] = { ...user[field], ...req.body[field] };
      } else {
        user[field] = req.body[field];
      }
    }
  }

  await user.save();

  res.json(successResponse('User updated', { user }));
});

/**
 * Delete user
 * DELETE /api/v1/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Don't allow deleting yourself
  if (user._id.toString() === req.user.id) {
    throw new ValidationError('Cannot delete your own account');
  }

  // Soft delete by marking as inactive
  user.status = 'inactive';
  await user.save();

  res.json(successResponse('User deleted'));
});

/**
 * Get worker schedule
 * GET /api/v1/users/:id/schedule
 */
const getWorkerSchedule = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ValidationError('startDate and endDate are required');
  }

  const appointments = await availabilityService.getWorkerSchedule({
    orgId: req.user.orgId,
    workerId: req.params.id,
    startDate,
    endDate,
  });

  res.json(successResponse('Worker schedule retrieved', { appointments }));
});

/**
 * Update worker availability
 * PUT /api/v1/users/:id/availability
 */
const updateWorkerAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;

  const worker = await availabilityService.updateWorkerAvailability({
    orgId: req.user.orgId,
    workerId: req.params.id,
    availability,
  });

  res.json(successResponse('Worker availability updated', { worker }));
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getWorkerSchedule,
  updateWorkerAvailability,
};
