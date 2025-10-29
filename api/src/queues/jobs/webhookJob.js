/**
 * Webhook Job Processor
 * Handles webhook event delivery
 */

const webhookService = require('../../services/webhookService');
const logger = require('../../utils/logger');

/**
 * Process webhook delivery job
 */
const processWebhookJob = async (job) => {
  const { orgId, eventType, payload } = job.data;

  try {
    logger.info('Processing webhook job', {
      jobId: job.id,
      orgId,
      eventType,
    });

    const result = await webhookService.deliverWebhookEvent({
      orgId,
      eventType,
      payload,
    });

    logger.info('Webhook job completed', {
      jobId: job.id,
      delivered: result.delivered,
      failed: result.failed,
    });

    return {
      success: true,
      delivered: result.delivered,
      failed: result.failed,
    };
  } catch (error) {
    logger.error('Webhook job failed', {
      jobId: job.id,
      error: error.message,
      orgId,
      eventType,
    });

    throw error;
  }
};

module.exports = processWebhookJob;
