/**
 * Webhook Endpoints Controller
 * Handles customer webhook endpoint management
 */

const webhookService = require('../services/webhookService');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Register webhook endpoint
 * POST /api/v1/webhook-endpoints
 */
const registerWebhook = asyncHandler(async (req, res) => {
  const { url, events, description, secret } = req.body;

  const webhook = await webhookService.registerWebhook({
    orgId: req.user.orgId,
    url,
    events,
    description,
    secret,
  });

  res.status(201).json(
    successResponse('Webhook registered', {
      webhook,
      note: 'Save the secret securely. It will not be shown again.',
    })
  );
});

/**
 * Get all webhook endpoints
 * GET /api/v1/webhook-endpoints
 */
const getWebhooks = asyncHandler(async (req, res) => {
  const { WebhookEndpoint } = require('../models');
  const { status, limit = 50, offset = 0 } = req.query;

  const query = { orgId: req.user.orgId };

  if (status) query.status = status;

  const webhooks = await WebhookEndpoint.find(query)
    .select('-secret') // Don't expose secret
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

  const total = await WebhookEndpoint.countDocuments(query);

  res.json(
    successResponse('Webhooks retrieved', {
      webhooks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    })
  );
});

/**
 * Get webhook endpoint by ID
 * GET /api/v1/webhook-endpoints/:id
 */
const getWebhook = asyncHandler(async (req, res) => {
  const { WebhookEndpoint } = require('../models');

  const webhook = await WebhookEndpoint.findOne({
    _id: req.params.id,
    orgId: req.user.orgId,
  }).select('-secret');

  if (!webhook) {
    return res.status(404).json({ error: 'Webhook not found' });
  }

  res.json(successResponse('Webhook retrieved', { webhook }));
});

/**
 * Update webhook endpoint
 * PATCH /api/v1/webhook-endpoints/:id
 */
const updateWebhook = asyncHandler(async (req, res) => {
  const webhook = await webhookService.updateWebhook({
    orgId: req.user.orgId,
    webhookId: req.params.id,
    updates: req.body,
  });

  res.json(successResponse('Webhook updated', { webhook }));
});

/**
 * Delete webhook endpoint
 * DELETE /api/v1/webhook-endpoints/:id
 */
const deleteWebhook = asyncHandler(async (req, res) => {
  await webhookService.deleteWebhook({
    orgId: req.user.orgId,
    webhookId: req.params.id,
  });

  res.json(successResponse('Webhook deleted'));
});

/**
 * Test webhook endpoint
 * POST /api/v1/webhook-endpoints/:id/test
 */
const testWebhook = asyncHandler(async (req, res) => {
  const result = await webhookService.testWebhook({
    orgId: req.user.orgId,
    webhookId: req.params.id,
  });

  if (result.success) {
    res.json(successResponse('Webhook test sent successfully'));
  } else {
    res.status(400).json({
      error: 'Webhook test failed',
      message: result.error,
    });
  }
});

/**
 * Get webhook logs
 * GET /api/v1/webhook-endpoints/:id/logs
 */
const getWebhookLogs = asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  const logs = await webhookService.getWebhookLogs({
    orgId: req.user.orgId,
    webhookId: req.params.id,
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json(successResponse('Webhook logs retrieved', logs));
});

module.exports = {
  registerWebhook,
  getWebhooks,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  getWebhookLogs,
};
