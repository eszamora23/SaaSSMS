/**
 * Webhooks Controller
 * Handles incoming Twilio webhooks
 */

const messageService = require('../services/messageService');
const twilioService = require('../services/twilioService');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * Handle inbound SMS from Twilio
 * POST /webhooks/twilio/sms/inbound
 */
const handleInboundSMS = asyncHandler(async (req, res) => {
  const signature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // Validate Twilio signature
  const isValid = twilioService.validateSignature(url, req.body, signature);

  if (!isValid && process.env.NODE_ENV === 'production') {
    logger.warn('Invalid Twilio signature', { url });
    return res.status(403).send('Forbidden');
  }

  // Process the inbound message
  await messageService.processInboundMessage(req.body);

  // Respond with TwiML (empty response)
  res.type('text/xml');
  res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

/**
 * Handle SMS status callback from Twilio
 * POST /webhooks/twilio/sms/status
 */
const handleSMSStatus = asyncHandler(async (req, res) => {
  const signature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // Validate Twilio signature
  const isValid = twilioService.validateSignature(url, req.body, signature);

  if (!isValid && process.env.NODE_ENV === 'production') {
    logger.warn('Invalid Twilio signature', { url });
    return res.status(403).send('Forbidden');
  }

  // Update message status
  await messageService.updateMessageStatus(req.body);

  res.status(200).send('OK');
});

/**
 * Handle voice call webhook from Twilio
 * POST /webhooks/twilio/voice/inbound
 */
const handleInboundCall = asyncHandler(async (req, res) => {
  const signature = req.headers['x-twilio-signature'];
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  // Validate Twilio signature
  const isValid = twilioService.validateSignature(url, req.body, signature);

  if (!isValid && process.env.NODE_ENV === 'production') {
    logger.warn('Invalid Twilio signature', { url });
    return res.status(403).send('Forbidden');
  }

  logger.info('Inbound call received', {
    from: req.body.From,
    to: req.body.To,
    callSid: req.body.CallSid,
  });

  // Simple TwiML response
  res.type('text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling. Please send us a text message to get started.</Say>
  <Hangup/>
</Response>`);
});

module.exports = {
  handleInboundSMS,
  handleSMSStatus,
  handleInboundCall,
};
