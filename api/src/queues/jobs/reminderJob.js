/**
 * Reminder Job Processor
 * Handles appointment reminders
 */

const appointmentService = require('../../services/appointmentService');
const logger = require('../../utils/logger');

/**
 * Process reminder sending job
 */
const processReminderJob = async (job) => {
  const { reminderWindow = 24 } = job.data;

  try {
    logger.info('Processing reminder job', {
      jobId: job.id,
      reminderWindow,
    });

    const result = await appointmentService.sendReminders({
      reminderWindow,
    });

    logger.info('Reminder job completed', {
      jobId: job.id,
      sentCount: result.sentCount,
    });

    return {
      success: true,
      sentCount: result.sentCount,
    };
  } catch (error) {
    logger.error('Reminder job failed', {
      jobId: job.id,
      error: error.message,
    });

    throw error;
  }
};

module.exports = processReminderJob;
