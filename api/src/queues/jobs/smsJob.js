/**
 * SMS Job Processor
 * Handles background SMS sending
 */

const messageService = require('../../services/messageService');
const logger = require('../../utils/logger');

/**
 * Process SMS sending job
 */
const processSMSJob = async (job) => {
  const { orgId, to, from, body, mediaUrls, userId, customerId, metadata } = job.data;

  try {
    logger.info('Processing SMS job', {
      jobId: job.id,
      to,
      orgId,
    });

    const message = await messageService.sendMessage({
      orgId,
      to,
      from,
      body,
      mediaUrls,
      userId,
      customerId,
      metadata,
    });

    logger.info('SMS job completed', {
      jobId: job.id,
      messageId: message._id,
      twilioSid: message.twilioSid,
    });

    return {
      success: true,
      messageId: message._id,
      twilioSid: message.twilioSid,
    };
  } catch (error) {
    logger.error('SMS job failed', {
      jobId: job.id,
      error: error.message,
      to,
    });

    throw error; // Will trigger retry
  }
};

module.exports = processSMSJob;
