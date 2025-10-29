/**
 * Twilio Configuration
 */

module.exports = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  webhookBaseUrl: process.env.TWILIO_WEBHOOK_BASE_URL || 'http://localhost:5000',

  // Webhook URLs (constructed dynamically)
  webhooks: {
    smsInbound: '/webhooks/twilio/sms/inbound',
    smsStatus: '/webhooks/twilio/sms/status',
    voiceInbound: '/webhooks/twilio/voice/inbound',
  },
};
