/**
 * Messages Controller
 * Handles SMS messaging endpoints
 */

const messageService = require('../services/messageService');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Send SMS message
 * POST /api/v1/messages
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { to, from, body, mediaUrls, customerId, metadata } = req.body;

  const message = await messageService.sendMessage({
    orgId: req.user.orgId,
    to,
    from,
    body,
    mediaUrls,
    userId: req.user.id,
    customerId,
    metadata,
  });

  res.status(201).json(successResponse('Message sent', { message }));
});

/**
 * Get messages
 * GET /api/v1/messages
 */
const getMessages = asyncHandler(async (req, res) => {
  const { Message } = require('../models');
  const { customerId, direction, status, limit = 50, offset = 0 } = req.query;

  const query = { orgId: req.user.orgId };

  if (customerId) query.customerId = customerId;
  if (direction) query.direction = direction;
  if (status) query.status = status;

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .populate('customerId', 'name phone email')
    .populate('workerId', 'email profile');

  const total = await Message.countDocuments(query);

  res.json(
    successResponse('Messages retrieved', {
      messages,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  );
});

/**
 * Get message by ID
 * GET /api/v1/messages/:id
 */
const getMessage = asyncHandler(async (req, res) => {
  const { Message } = require('../models');

  const message = await Message.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  })
    .populate('customerId', 'name phone email')
    .populate('workerId', 'email profile');

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  res.json(successResponse('Message retrieved', { message }));
});

/**
 * Search messages
 * GET /api/v1/messages/search
 */
const searchMessages = asyncHandler(async (req, res) => {
  const { query, limit = 50, offset = 0 } = req.query;

  const result = await messageService.searchMessages({
    orgId: req.user.orgId,
    query,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json(
    successResponse('Search results', {
      messages: result.messages,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    })
  );
});

/**
 * Get conversation threads
 * GET /api/v1/threads
 */
const getThreads = asyncHandler(async (req, res) => {
  const { Thread } = require('../models');
  const { status, assignedTo, limit = 50, offset = 0 } = req.query;

  const query = { orgId: req.user.orgId };

  if (status) query.status = status;
  if (assignedTo) query.assignedTo = assignedTo;

  const threads = await Thread.find(query)
    .sort({ lastMessageAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .populate('customerId', 'name phone email')
    .populate('assignedTo', 'email profile');

  const total = await Thread.countDocuments(query);

  res.json(
    successResponse('Threads retrieved', {
      threads,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  );
});

/**
 * Get thread by ID with messages
 * GET /api/v1/threads/:id
 */
const getThread = asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  const result = await messageService.getThread({
    orgId: req.user.orgId,
    threadId: req.params.id,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json(
    successResponse('Thread retrieved', {
      thread: result.thread,
      messages: result.messages,
    })
  );
});

/**
 * Assign thread to worker
 * POST /api/v1/threads/:id/assign
 */
const assignThread = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const thread = await messageService.assignThread({
    orgId: req.user.orgId,
    threadId: req.params.id,
    userId,
  });

  res.json(successResponse('Thread assigned', { thread }));
});

/**
 * Mark thread as read
 * POST /api/v1/threads/:id/read
 */
const markThreadRead = asyncHandler(async (req, res) => {
  const thread = await messageService.markThreadRead({
    orgId: req.user.orgId,
    threadId: req.params.id,
  });

  res.json(successResponse('Thread marked as read', { thread }));
});

/**
 * Get thread messages only
 * GET /api/v1/threads/:id/messages
 */
const getThreadMessages = asyncHandler(async (req, res) => {
  const { Message } = require('../models');
  const { limit = 100, offset = 0, sortBy = 'createdAt', sortOrder = 'asc' } = req.query;

  const messages = await Message.find({
    threadId: req.params.id,
    orgId: req.user.orgId,
  })
    .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset))
    .populate('customerId', 'name phone email')
    .populate('workerId', 'email profile');

  const total = await Message.countDocuments({
    threadId: req.params.id,
    orgId: req.user.orgId,
  });

  res.json(
    successResponse('Messages retrieved', {
      messages,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  );
});

/**
 * Update thread status or assignment
 * PATCH /api/v1/threads/:id
 */
const updateThread = asyncHandler(async (req, res) => {
  const { Thread } = require('../models');
  const { status, assignedTo } = req.body;

  const thread = await Thread.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  });

  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  if (status) thread.status = status;
  if (assignedTo !== undefined) thread.assignedTo = assignedTo;

  await thread.save();

  // Populate the updated thread
  await thread.populate('assignedTo', 'email profile');

  res.json(successResponse('Thread updated', { thread }));
});

module.exports = {
  sendMessage,
  getMessages,
  getMessage,
  searchMessages,
  getThreads,
  getThread,
  getThreadMessages,
  assignThread,
  markThreadRead,
  updateThread,
};
