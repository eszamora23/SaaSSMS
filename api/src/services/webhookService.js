/**
 * Webhook Service
 * Handles webhook event delivery and management
 */

const { WebhookEndpoint } = require('../models');
const { NotFoundError, ValidationError } = require('../utils/errors');
const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');

/**
 * Register webhook endpoint
 */
const registerWebhook = async ({ orgId, url, events, description = '', secret = null }) => {
  try {
    // Validate URL
    try {
      new URL(url);
    } catch (error) {
      throw new ValidationError('Invalid webhook URL');
    }

    // Validate events
    const validEvents = [
      'message.sent',
      'message.received',
      'message.delivered',
      'message.failed',
      'appointment.created',
      'appointment.rescheduled',
      'appointment.canceled',
      'appointment.confirmed',
      'appointment.completed',
      'appointment.no_show',
      'customer.created',
      'customer.updated',
    ];

    for (const event of events) {
      if (!validEvents.includes(event)) {
        throw new ValidationError(`Invalid event type: ${event}`);
      }
    }

    // Generate secret if not provided
    const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

    const webhook = await WebhookEndpoint.create({
      orgId,
      url,
      events,
      description,
      secret: webhookSecret,
      status: 'active',
    });

    logger.info('Webhook registered', {
      webhookId: webhook._id,
      orgId,
      url,
      events,
    });

    return webhook;
  } catch (error) {
    logger.error('Register webhook error', {
      error: error.message,
      orgId,
      url,
    });
    throw error;
  }
};

/**
 * Update webhook endpoint
 */
const updateWebhook = async ({ orgId, webhookId, updates }) => {
  try {
    const webhook = await WebhookEndpoint.findOne({ _id: webhookId, orgId });
    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    // Update allowed fields
    if (updates.url) {
      try {
        new URL(updates.url);
        webhook.url = updates.url;
      } catch (error) {
        throw new ValidationError('Invalid webhook URL');
      }
    }

    if (updates.events) {
      webhook.events = updates.events;
    }

    if (updates.description !== undefined) {
      webhook.description = updates.description;
    }

    if (updates.status) {
      webhook.status = updates.status;
    }

    await webhook.save();

    logger.info('Webhook updated', {
      webhookId: webhook._id,
      orgId,
    });

    return webhook;
  } catch (error) {
    logger.error('Update webhook error', {
      error: error.message,
      webhookId,
    });
    throw error;
  }
};

/**
 * Delete webhook endpoint
 */
const deleteWebhook = async ({ orgId, webhookId }) => {
  try {
    const webhook = await WebhookEndpoint.findOne({ _id: webhookId, orgId });
    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    await webhook.deleteOne();

    logger.info('Webhook deleted', {
      webhookId,
      orgId,
    });

    return true;
  } catch (error) {
    logger.error('Delete webhook error', {
      error: error.message,
      webhookId,
    });
    throw error;
  }
};

/**
 * Deliver webhook event
 */
const deliverWebhookEvent = async ({ orgId, eventType, payload }) => {
  try {
    // Find active webhooks listening for this event
    const webhooks = await WebhookEndpoint.find({
      orgId,
      status: 'active',
      events: eventType,
    });

    if (webhooks.length === 0) {
      logger.debug('No webhooks registered for event', {
        orgId,
        eventType,
      });
      return { delivered: 0 };
    }

    const deliveryResults = await Promise.allSettled(
      webhooks.map((webhook) =>
        sendWebhookRequest({
          webhook,
          eventType,
          payload,
        })
      )
    );

    const delivered = deliveryResults.filter((r) => r.status === 'fulfilled').length;
    const failed = deliveryResults.filter((r) => r.status === 'rejected').length;

    logger.info('Webhook event delivered', {
      orgId,
      eventType,
      delivered,
      failed,
    });

    return { delivered, failed };
  } catch (error) {
    logger.error('Deliver webhook event error', {
      error: error.message,
      orgId,
      eventType,
    });
    throw error;
  }
};

/**
 * Send individual webhook request with retries
 */
const sendWebhookRequest = async ({
  webhook,
  eventType,
  payload,
  attempt = 1,
  maxAttempts = 3,
}) => {
  try {
    const webhookPayload = {
      id: crypto.randomUUID(),
      type: eventType,
      created: new Date().toISOString(),
      data: payload,
    };

    // Generate signature
    const signature = generateWebhookSignature(webhookPayload, webhook.secret);

    // Send request
    const response = await axios.post(webhook.url, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'X-Webhook-Id': webhookPayload.id,
      },
      timeout: 10000, // 10 second timeout
      validateStatus: (status) => status >= 200 && status < 300,
    });

    // Update webhook stats
    webhook.stats.lastDeliveryAt = new Date();
    webhook.stats.successCount += 1;
    webhook.stats.consecutiveFailures = 0; // Reset failures on success
    await webhook.save();

    logger.debug('Webhook request sent', {
      webhookId: webhook._id,
      eventType,
      status: response.status,
      attempt,
    });

    // Emit event
    eventBus.emit('webhook.delivered', {
      webhookId: webhook._id,
      eventType,
      status: response.status,
    });

    return response;
  } catch (error) {
    logger.error('Webhook request failed', {
      webhookId: webhook._id,
      eventType,
      error: error.message,
      attempt,
    });

    // Update webhook stats
    webhook.stats.failureCount += 1;
    webhook.stats.consecutiveFailures += 1;
    webhook.stats.lastFailureAt = new Date();

    // Disable webhook after too many consecutive failures
    if (webhook.stats.consecutiveFailures >= 10) {
      webhook.status = 'disabled';
      logger.warn('Webhook disabled due to consecutive failures', {
        webhookId: webhook._id,
        consecutiveFailures: webhook.stats.consecutiveFailures,
      });
    }

    await webhook.save();

    // Retry logic
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      logger.info('Retrying webhook request', {
        webhookId: webhook._id,
        attempt: attempt + 1,
        delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));

      return sendWebhookRequest({
        webhook,
        eventType,
        payload,
        attempt: attempt + 1,
        maxAttempts,
      });
    }

    // Emit failure event
    eventBus.emit('webhook.failed', {
      webhookId: webhook._id,
      eventType,
      error: error.message,
    });

    throw error;
  }
};

/**
 * Generate webhook signature (HMAC SHA-256)
 */
const generateWebhookSignature = (payload, secret) => {
  const payloadString = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
};

/**
 * Verify webhook signature
 */
const verifyWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Test webhook endpoint
 */
const testWebhook = async ({ orgId, webhookId }) => {
  try {
    const webhook = await WebhookEndpoint.findOne({ _id: webhookId, orgId });
    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    const testPayload = {
      test: true,
      message: 'This is a test webhook event',
      timestamp: new Date().toISOString(),
    };

    await sendWebhookRequest({
      webhook,
      eventType: 'test',
      payload: testPayload,
      maxAttempts: 1, // Don't retry test requests
    });

    logger.info('Webhook test sent', {
      webhookId: webhook._id,
      orgId,
    });

    return { success: true };
  } catch (error) {
    logger.error('Webhook test failed', {
      webhookId,
      error: error.message,
    });
    return { success: false, error: error.message };
  }
};

/**
 * Get webhook delivery logs (if we implement a WebhookLog model)
 */
const getWebhookLogs = async ({ orgId, webhookId, limit = 50, offset = 0 }) => {
  try {
    const webhook = await WebhookEndpoint.findOne({ _id: webhookId, orgId });
    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    // For now, return basic stats
    // In production, you'd have a WebhookLog model to track each delivery
    return {
      webhookId: webhook._id,
      stats: webhook.stats,
      status: webhook.status,
    };
  } catch (error) {
    logger.error('Get webhook logs error', {
      error: error.message,
      webhookId,
    });
    throw error;
  }
};

/**
 * Setup event listeners for automatic webhook delivery
 */
const setupWebhookListeners = () => {
  // Message events
  eventBus.on('message.sent', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'message.sent',
      payload: data.message,
    });
  });

  eventBus.on('message.received', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'message.received',
      payload: data.message,
    });
  });

  eventBus.on('message.status_updated', async (data) => {
    const eventType = `message.${data.status}`;
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType,
      payload: { messageId: data.messageId, status: data.status },
    });
  });

  // Appointment events
  eventBus.on('appointment.created', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'appointment.created',
      payload: data.appointment,
    });
  });

  eventBus.on('appointment.rescheduled', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'appointment.rescheduled',
      payload: data.appointment,
    });
  });

  eventBus.on('appointment.canceled', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'appointment.canceled',
      payload: data.appointment,
    });
  });

  eventBus.on('appointment.confirmed', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'appointment.confirmed',
      payload: data.appointment,
    });
  });

  eventBus.on('appointment.completed', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'appointment.completed',
      payload: data.appointment,
    });
  });

  eventBus.on('appointment.no_show', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'appointment.no_show',
      payload: data.appointment,
    });
  });

  // Customer events
  eventBus.on('customer.created', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'customer.created',
      payload: data.customer,
    });
  });

  eventBus.on('customer.updated', async (data) => {
    await deliverWebhookEvent({
      orgId: data.orgId,
      eventType: 'customer.updated',
      payload: data.customer,
    });
  });

  logger.info('Webhook event listeners setup complete');
};

module.exports = {
  registerWebhook,
  updateWebhook,
  deleteWebhook,
  deliverWebhookEvent,
  testWebhook,
  getWebhookLogs,
  verifyWebhookSignature,
  setupWebhookListeners,
};
