/**
 * Twilio Service
 * Wrapper for Twilio API operations
 */

const twilio = require('twilio');
const logger = require('../utils/logger');
const { ExternalServiceError } = require('../utils/errors');
const config = require('../config');

const TWILIO_WEBHOOK_BASE_URL = config.twilio.webhookBaseUrl;

// Cache of Twilio clients per organization
const twilioClients = new Map();

/**
 * Get Twilio client for an organization
 * Uses org-specific credentials if available, falls back to global config
 */
const getTwilioClient = (organization) => {
  // If organization provided with credentials, use those
  if (organization) {
    const orgId = organization._id.toString();

    // Check if client is cached
    if (twilioClients.has(orgId)) {
      return twilioClients.get(orgId);
    }

    // Try to get org-specific credentials
    const credentials = organization.getTwilioCredentials();

    if (credentials && credentials.accountSid && credentials.authToken) {
      const client = twilio(credentials.accountSid, credentials.authToken);
      twilioClients.set(orgId, client);
      logger.info('Using organization-specific Twilio credentials', { orgId });
      return client;
    }
  }

  // Fall back to global credentials
  const globalSid = config.twilio.accountSid;
  const globalToken = config.twilio.authToken;

  if (globalSid && globalToken) {
    if (!twilioClients.has('global')) {
      twilioClients.set('global', twilio(globalSid, globalToken));
      logger.info('Using global Twilio credentials');
    }
    return twilioClients.get('global');
  }

  return null;
};

/**
 * Send SMS message
 */
const sendSMS = async ({
  to,
  from,
  body,
  mediaUrls = [],
  statusCallback = true,
  organization = null,
}) => {
  try {
    const client = getTwilioClient(organization);

    if (!client) {
      throw new Error(
        'Twilio client not initialized. Please configure Twilio credentials in organization settings.'
      );
    }

    const messageOptions = {
      to,
      from,
      body,
    };

    if (mediaUrls && mediaUrls.length > 0) {
      messageOptions.mediaUrl = mediaUrls;
    }

    if (statusCallback) {
      messageOptions.statusCallback = `${TWILIO_WEBHOOK_BASE_URL}${config.twilio.webhooks.smsStatus}`;
    }

    const message = await client.messages.create(messageOptions);

    logger.info('SMS sent via Twilio', {
      messageSid: message.sid,
      to: message.to,
      from: message.from,
      status: message.status,
    });

    return {
      messageSid: message.sid,
      status: message.status,
      dateCreated: message.dateCreated,
      price: message.price,
      priceUnit: message.priceUnit,
    };
  } catch (error) {
    logger.error('Twilio SMS send error', {
      error: error.message,
      code: error.code,
      to,
      from,
    });

    throw new ExternalServiceError('Failed to send SMS', 'twilio', {
      code: error.code,
      message: error.message,
    });
  }
};

/**
 * Search available phone numbers
 */
const searchNumbers = async ({
  country = 'US',
  areaCode = null,
  contains = null,
  smsEnabled = true,
  voiceEnabled = false,
  limit = 20,
}) => {
  try {
    const client = getTwilioClient();

    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const searchOptions = {
      smsEnabled,
      voiceEnabled,
    };

    if (areaCode) {
      searchOptions.areaCode = areaCode;
    }

    if (contains) {
      searchOptions.contains = contains;
    }

    const numbers = await client.availablePhoneNumbers(country).local.list({
      ...searchOptions,
      limit,
    });

    logger.info('Phone numbers searched', {
      country,
      areaCode,
      found: numbers.length,
    });

    return numbers.map((num) => ({
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      locality: num.locality,
      region: num.region,
      capabilities: num.capabilities,
      isoCountry: num.isoCountry,
    }));
  } catch (error) {
    logger.error('Twilio number search error', { error: error.message });
    throw new ExternalServiceError('Failed to search phone numbers', 'twilio');
  }
};

/**
 * Purchase phone number
 */
const purchaseNumber = async ({ phoneNumber, smsUrl = null, voiceUrl = null }) => {
  try {
    const client = getTwilioClient();

    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const number = await client.incomingPhoneNumbers.create({
      phoneNumber,
      smsUrl: smsUrl || `${TWILIO_WEBHOOK_BASE_URL}${config.twilio.webhooks.smsInbound}`,
      smsMethod: 'POST',
      voiceUrl: voiceUrl || `${TWILIO_WEBHOOK_BASE_URL}${config.twilio.webhooks.voiceInbound}`,
      voiceMethod: 'POST',
    });

    logger.info('Phone number purchased', {
      sid: number.sid,
      phoneNumber: number.phoneNumber,
    });

    return {
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      capabilities: number.capabilities,
    };
  } catch (error) {
    logger.error('Twilio number purchase error', {
      error: error.message,
      phoneNumber,
    });
    throw new ExternalServiceError('Failed to purchase phone number', 'twilio');
  }
};

/**
 * Release phone number
 */
const releaseNumber = async (sid) => {
  try {
    const client = getTwilioClient();

    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    await client.incomingPhoneNumbers(sid).remove();

    logger.info('Phone number released', { sid });

    return true;
  } catch (error) {
    logger.error('Twilio number release error', { error: error.message, sid });
    throw new ExternalServiceError('Failed to release phone number', 'twilio');
  }
};

/**
 * Update phone number configuration
 */
const updateNumber = async (sid, updates) => {
  try {
    const client = getTwilioClient();

    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const number = await client.incomingPhoneNumbers(sid).update(updates);

    logger.info('Phone number updated', { sid });

    return {
      sid: number.sid,
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
    };
  } catch (error) {
    logger.error('Twilio number update error', { error: error.message, sid });
    throw new ExternalServiceError('Failed to update phone number', 'twilio');
  }
};

/**
 * Get message status
 */
const getMessageStatus = async (messageSid) => {
  try {
    const client = getTwilioClient();

    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const message = await client.messages(messageSid).fetch();

    return {
      sid: message.sid,
      status: message.status,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
      price: message.price,
      priceUnit: message.priceUnit,
      dateUpdated: message.dateUpdated,
    };
  } catch (error) {
    logger.error('Twilio get message status error', {
      error: error.message,
      messageSid,
    });
    throw new ExternalServiceError('Failed to get message status', 'twilio');
  }
};

/**
 * Validate Twilio webhook signature
 */
const validateSignature = (url, params, signature) => {
  try {
    if (!TWILIO_AUTH_TOKEN) {
      logger.warn('Cannot validate Twilio signature: Auth token not configured');
      return true; // Allow in development
    }

    return twilio.validateRequest(TWILIO_AUTH_TOKEN, signature, url, params);
  } catch (error) {
    logger.error('Twilio signature validation error', { error: error.message });
    return false;
  }
};

/**
 * List purchased numbers for account
 */
const listNumbers = async () => {
  try {
    const client = getTwilioClient();

    if (!client) {
      throw new Error('Twilio client not initialized');
    }

    const numbers = await client.incomingPhoneNumbers.list({ limit: 100 });

    return numbers.map((num) => ({
      sid: num.sid,
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      capabilities: num.capabilities,
      dateCreated: num.dateCreated,
    }));
  } catch (error) {
    logger.error('Twilio list numbers error', { error: error.message });
    throw new ExternalServiceError('Failed to list phone numbers', 'twilio');
  }
};

module.exports = {
  sendSMS,
  searchNumbers,
  purchaseNumber,
  releaseNumber,
  updateNumber,
  getMessageStatus,
  validateSignature,
  listNumbers,
};
