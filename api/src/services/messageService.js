/**
 * Message Service
 * Handles SMS message processing and conversation threading
 */

const { Message, Customer, Thread, PhoneNumber, User, Organization } = require('../models');
const twilioService = require('./twilioService');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');
const { formatToE164, isValidE164 } = require('../utils/phoneUtils');
const logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');

/**
 * Send outbound SMS message
 */
const sendMessage = async ({
  orgId,
  to,
  from,
  body,
  mediaUrls = [],
  userId = null,
  customerId = null,
  metadata = {},
}) => {
  try {
    // Validate phone numbers
    const toE164 = formatToE164(to);
    const fromE164 = formatToE164(from);

    if (!isValidE164(toE164)) {
      throw new ValidationError('Invalid recipient phone number');
    }

    if (!isValidE164(fromE164)) {
      throw new ValidationError('Invalid sender phone number');
    }

    // Verify sender number belongs to organization
    const phoneNumber = await PhoneNumber.findOne({
      orgId,
      phoneNumber: fromE164,
      status: 'active',
    });

    if (!phoneNumber) {
      throw new ForbiddenError('Phone number not available for organization');
    }

    // Get organization for Twilio credentials
    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Get or create customer
    let customer = await Customer.findOne({ orgId, phone: toE164 });
    if (!customer) {
      customer = await Customer.create({
        orgId,
        phone: toE164,
        consents: {
          smsOptIn: {
            granted: false, // Will need explicit opt-in
          },
        },
      });
    }

    // Check opt-in status (log warning but allow in some cases)
    if (!customer.consents.smsOptIn.granted) {
      logger.warn('Sending message to customer without SMS opt-in', {
        orgId,
        customerId: customer._id,
        phone: toE164,
      });
    }

    // Create message record
    const message = await Message.create({
      orgId,
      customerId: customer._id,
      direction: 'outbound',
      to: toE164,
      from: fromE164,
      body,
      mediaUrls,
      status: 'queued',
      sentBy: userId,
      metadata,
    });

    // Send via Twilio
    try {
      const result = await twilioService.sendSMS({
        to: toE164,
        from: fromE164,
        body,
        mediaUrls,
        statusCallback: true,
        organization, // Use org-specific Twilio credentials
      });

      // Update message with Twilio data
      message.twilioSid = result.messageSid;
      message.status = result.status;
      message.sentAt = new Date();
      await message.save();

      logger.info('Message sent successfully', {
        messageId: message._id,
        twilioSid: result.messageSid,
        orgId,
        to: toE164,
      });
    } catch (twilioError) {
      // Update message status to failed
      message.status = 'failed';
      message.errorCode = twilioError.code;
      message.errorMessage = twilioError.message;
      await message.save();

      logger.error('Twilio send failed', {
        messageId: message._id,
        error: twilioError.message,
      });

      throw twilioError;
    }

    // Update or create thread
    await updateThread({
      orgId,
      customerId: customer._id,
      phoneNumberId: phoneNumber._id,
      lastMessageAt: new Date(),
    });

    // Emit event for real-time updates
    eventBus.emit('message.sent', {
      orgId,
      message: message.toObject(),
      customerId: customer._id,
    });

    return message;
  } catch (error) {
    logger.error('Send message error', {
      error: error.message,
      orgId,
      to,
    });
    throw error;
  }
};

/**
 * Process inbound SMS message from Twilio webhook
 */
const processInboundMessage = async (webhookData) => {
  try {
    const {
      MessageSid,
      From,
      To,
      Body,
      NumMedia,
      MediaUrl0,
      MediaUrl1,
      MediaUrl2,
      MediaUrl3,
    } = webhookData;

    const fromE164 = formatToE164(From);
    const toE164 = formatToE164(To);

    // Find phone number and organization
    const phoneNumber = await PhoneNumber.findOne({
      phoneNumber: toE164,
      status: 'active',
    }).populate('orgId');

    if (!phoneNumber) {
      logger.warn('Inbound message to unknown phone number', {
        to: toE164,
        from: fromE164,
      });
      return null;
    }

    const orgId = phoneNumber.orgId._id;

    // Get or create customer
    let customer = await Customer.findOne({ orgId, phone: fromE164 });
    if (!customer) {
      customer = await Customer.create({
        orgId,
        phone: fromE164,
        consents: {
          smsOptIn: {
            granted: true, // Implicit opt-in by sending message
            at: new Date(),
            method: 'implicit',
          },
        },
      });

      logger.info('New customer created from inbound message', {
        customerId: customer._id,
        orgId,
        phone: fromE164,
      });
    } else if (!customer.consents.smsOptIn.granted) {
      // Auto opt-in if customer texts us
      await customer.optInSMS('implicit');
    }

    // Collect media URLs
    const mediaUrls = [];
    const numMedia = parseInt(NumMedia) || 0;
    for (let i = 0; i < numMedia && i < 4; i++) {
      const mediaUrl = webhookData[`MediaUrl${i}`];
      if (mediaUrl) {
        mediaUrls.push(mediaUrl);
      }
    }

    // Create message record
    const message = await Message.create({
      orgId,
      customerId: customer._id,
      direction: 'inbound',
      from: fromE164,
      to: toE164,
      body: Body || '',
      mediaUrls,
      status: 'received',
      twilioSid: MessageSid,
      receivedAt: new Date(),
    });

    logger.info('Inbound message received', {
      messageId: message._id,
      twilioSid: MessageSid,
      orgId,
      customerId: customer._id,
    });

    // Update or create thread
    const thread = await updateThread({
      orgId,
      customerId: customer._id,
      phoneNumberId: phoneNumber._id,
      lastMessageAt: new Date(),
      incrementUnread: true,
    });

    // Check for auto-assignment rules
    if (!thread.assignedTo && phoneNumber.assignedTo) {
      thread.assignedTo = phoneNumber.assignedTo;
      await thread.save();
    }

    // Emit event for real-time updates
    eventBus.emit('message.received', {
      orgId,
      message: message.toObject(),
      customerId: customer._id,
      threadId: thread._id,
    });

    // Check for keyword commands (e.g., STOP, START)
    await processKeywordCommands({
      orgId,
      customerId: customer._id,
      body: Body,
      from: fromE164,
      to: toE164,
    });

    return message;
  } catch (error) {
    logger.error('Process inbound message error', {
      error: error.message,
      MessageSid: webhookData.MessageSid,
    });
    throw error;
  }
};

/**
 * Update message status from Twilio webhook
 */
const updateMessageStatus = async (webhookData) => {
  try {
    const { MessageSid, MessageStatus, ErrorCode, ErrorMessage } = webhookData;

    const message = await Message.findOne({ twilioSid: MessageSid });

    if (!message) {
      logger.warn('Status update for unknown message', { MessageSid });
      return null;
    }

    message.status = MessageStatus;

    if (ErrorCode) {
      message.errorCode = ErrorCode;
      message.errorMessage = ErrorMessage;
    }

    if (MessageStatus === 'delivered') {
      message.deliveredAt = new Date();
    } else if (MessageStatus === 'failed' || MessageStatus === 'undelivered') {
      logger.error('Message delivery failed', {
        messageId: message._id,
        twilioSid: MessageSid,
        errorCode: ErrorCode,
        errorMessage: ErrorMessage,
      });
    }

    await message.save();

    // Emit event for real-time updates
    eventBus.emit('message.status_updated', {
      orgId: message.orgId,
      messageId: message._id,
      status: MessageStatus,
    });

    return message;
  } catch (error) {
    logger.error('Update message status error', {
      error: error.message,
      MessageSid: webhookData.MessageSid,
    });
    throw error;
  }
};

/**
 * Update or create conversation thread
 */
const updateThread = async ({
  orgId,
  customerId,
  phoneNumberId,
  lastMessageAt,
  incrementUnread = false,
}) => {
  let thread = await Thread.findOne({ orgId, customerId });

  if (!thread) {
    thread = await Thread.create({
      orgId,
      customerId,
      phoneNumberId,
      lastMessageAt,
      unreadCount: incrementUnread ? 1 : 0,
      status: 'open',
    });
  } else {
    thread.lastMessageAt = lastMessageAt;
    if (incrementUnread) {
      thread.unreadCount += 1;
    }
    await thread.save();
  }

  return thread;
};

/**
 * Get conversation thread with messages
 */
const getThread = async ({ orgId, threadId, limit = 50, offset = 0 }) => {
  try {
    const thread = await Thread.findOne({ _id: threadId, orgId })
      .populate('customerId', 'name phone email profile')
      .populate('assignedTo', 'email profile')
      .populate('phoneNumberId', 'phoneNumber friendlyName');

    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const messages = await Message.find({
      orgId,
      customerId: thread.customerId._id,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('sentBy', 'email profile');

    return {
      thread,
      messages: messages.reverse(), // Reverse to show oldest first
    };
  } catch (error) {
    logger.error('Get thread error', {
      error: error.message,
      orgId,
      threadId,
    });
    throw error;
  }
};

/**
 * Assign thread to worker
 */
const assignThread = async ({ orgId, threadId, userId }) => {
  try {
    const thread = await Thread.findOne({ _id: threadId, orgId });
    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    const user = await User.findOne({ _id: userId, orgId });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    thread.assignedTo = userId;
    await thread.save();

    logger.info('Thread assigned', {
      threadId,
      userId,
      orgId,
    });

    return thread;
  } catch (error) {
    logger.error('Assign thread error', {
      error: error.message,
      orgId,
      threadId,
    });
    throw error;
  }
};

/**
 * Mark thread as read
 */
const markThreadRead = async ({ orgId, threadId }) => {
  try {
    const thread = await Thread.findOne({ _id: threadId, orgId });
    if (!thread) {
      throw new NotFoundError('Thread not found');
    }

    thread.unreadCount = 0;
    await thread.save();

    return thread;
  } catch (error) {
    logger.error('Mark thread read error', {
      error: error.message,
      orgId,
      threadId,
    });
    throw error;
  }
};

/**
 * Process keyword commands (STOP, START, HELP, etc.)
 */
const processKeywordCommands = async ({ orgId, customerId, body, from, to }) => {
  const keyword = (body || '').trim().toUpperCase();

  const customer = await Customer.findOne({ _id: customerId, orgId });
  if (!customer) return;

  switch (keyword) {
    case 'STOP':
    case 'STOPALL':
    case 'UNSUBSCRIBE':
    case 'CANCEL':
    case 'END':
    case 'QUIT':
      // Opt out of SMS
      customer.consents.smsOptIn.granted = false;
      customer.consents.smsOptIn.at = new Date();
      customer.consents.smsOptIn.method = 'keyword';
      await customer.save();

      logger.info('Customer opted out via keyword', {
        customerId,
        orgId,
        keyword,
      });

      // Send confirmation (required by carriers)
      await sendMessage({
        orgId,
        to: from,
        from: to,
        body: 'You have been unsubscribed from SMS messages. Reply START to resubscribe.',
      });
      break;

    case 'START':
    case 'UNSTOP':
    case 'SUBSCRIBE':
    case 'YES':
      // Opt in to SMS
      customer.consents.smsOptIn.granted = true;
      customer.consents.smsOptIn.at = new Date();
      customer.consents.smsOptIn.method = 'keyword';
      await customer.save();

      logger.info('Customer opted in via keyword', {
        customerId,
        orgId,
        keyword,
      });

      // Send confirmation
      await sendMessage({
        orgId,
        to: from,
        from: to,
        body: 'You have been subscribed to SMS messages. Reply STOP to unsubscribe.',
      });
      break;

    case 'HELP':
    case 'INFO':
      // Send help message
      await sendMessage({
        orgId,
        to: from,
        from: to,
        body: 'Reply STOP to unsubscribe or START to resubscribe. For help, contact support.',
      });
      break;

    default:
      // No keyword command
      break;
  }
};

/**
 * Search messages
 */
const searchMessages = async ({ orgId, query, limit = 50, offset = 0 }) => {
  try {
    const searchQuery = {
      orgId,
      $or: [
        { body: { $regex: query, $options: 'i' } },
        { to: { $regex: query, $options: 'i' } },
        { from: { $regex: query, $options: 'i' } },
      ],
    };

    const messages = await Message.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('customerId', 'name phone email')
      .populate('sentBy', 'email profile');

    const total = await Message.countDocuments(searchQuery);

    return {
      messages,
      total,
      limit,
      offset,
    };
  } catch (error) {
    logger.error('Search messages error', {
      error: error.message,
      orgId,
      query,
    });
    throw error;
  }
};

module.exports = {
  sendMessage,
  processInboundMessage,
  updateMessageStatus,
  getThread,
  assignThread,
  markThreadRead,
  searchMessages,
};
