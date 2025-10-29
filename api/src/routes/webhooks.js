/**
 * Twilio Webhooks Routes
 * /webhooks/twilio
 */

const express = require('express');
const router = express.Router();
const webhooksController = require('../controllers/webhooksController');

// Twilio SMS webhooks
router.post('/twilio/sms/inbound', webhooksController.handleInboundSMS);
router.post('/twilio/sms/status', webhooksController.handleSMSStatus);

// Twilio voice webhooks
router.post('/twilio/voice/inbound', webhooksController.handleInboundCall);

module.exports = router;
