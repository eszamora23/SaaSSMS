/**
 * Cleanup Job Processor
 * Handles database cleanup and maintenance
 */

const { Message, Appointment } = require('../../models');
const logger = require('../../utils/logger');

/**
 * Process cleanup job
 */
const processCleanupJob = async (job) => {
  const { type = 'all' } = job.data;

  try {
    logger.info('Processing cleanup job', {
      jobId: job.id,
      type,
    });

    let deletedCount = 0;

    // Clean up old completed appointments
    if (type === 'all' || type === 'appointments') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const result = await Appointment.deleteMany({
        status: 'completed',
        endTime: { $lt: sixMonthsAgo },
      });

      deletedCount += result.deletedCount;

      logger.info('Cleaned up old appointments', {
        deletedCount: result.deletedCount,
      });
    }

    // Clean up old messages (optional, depending on retention policy)
    if (type === 'messages') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const result = await Message.deleteMany({
        createdAt: { $lt: oneYearAgo },
        direction: 'outbound',
        status: { $in: ['delivered', 'failed'] },
      });

      deletedCount += result.deletedCount;

      logger.info('Cleaned up old messages', {
        deletedCount: result.deletedCount,
      });
    }

    logger.info('Cleanup job completed', {
      jobId: job.id,
      totalDeleted: deletedCount,
    });

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    logger.error('Cleanup job failed', {
      jobId: job.id,
      error: error.message,
    });

    throw error;
  }
};

module.exports = processCleanupJob;
