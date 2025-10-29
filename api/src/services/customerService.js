/**
 * Customer Service
 * Handles customer management, profiles, and CRM operations
 */

const { Customer, Message, Appointment, Thread } = require('../models');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');
const { formatToE164, isValidE164 } = require('../utils/phoneUtils');
const logger = require('../utils/logger');
const eventBus = require('../utils/eventBus');

/**
 * Create new customer
 */
const createCustomer = async ({ orgId, phone, name, email, profile = {}, consents = {} }) => {
  try {
    const phoneE164 = formatToE164(phone);

    if (!isValidE164(phoneE164)) {
      throw new ValidationError('Invalid phone number format');
    }

    // Check if customer already exists
    const existing = await Customer.findOne({ orgId, phone: phoneE164 });
    if (existing) {
      throw new ConflictError('Customer with this phone number already exists');
    }

    const customer = await Customer.create({
      orgId,
      phone: phoneE164,
      name,
      email: email ? email.toLowerCase() : undefined,
      profile,
      consents: {
        smsOptIn: {
          granted: consents.smsOptIn || false,
          at: consents.smsOptIn ? new Date() : undefined,
          method: consents.smsOptInMethod || 'explicit',
        },
        emailOptIn: {
          granted: consents.emailOptIn || false,
          at: consents.emailOptIn ? new Date() : undefined,
          method: consents.emailOptInMethod || 'explicit',
        },
      },
    });

    logger.info('Customer created', {
      customerId: customer._id,
      orgId,
      phone: phoneE164,
    });

    // Emit event
    eventBus.emit('customer.created', {
      orgId,
      customer: customer.toObject(),
    });

    return customer;
  } catch (error) {
    logger.error('Create customer error', {
      error: error.message,
      orgId,
      phone,
    });
    throw error;
  }
};

/**
 * Update customer
 */
const updateCustomer = async ({ orgId, customerId, updates }) => {
  try {
    const customer = await Customer.findOne({ _id: customerId, orgId });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Update allowed fields
    const allowedFields = ['name', 'email', 'profile', 'tags', 'notes'];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'email' && updates.email) {
          customer.email = updates.email.toLowerCase();
        } else if (field === 'profile') {
          customer.profile = { ...customer.profile, ...updates.profile };
        } else if (field === 'tags') {
          customer.tags = updates.tags;
        } else {
          customer[field] = updates[field];
        }
      }
    }

    await customer.save();

    logger.info('Customer updated', {
      customerId: customer._id,
      orgId,
    });

    // Emit event
    eventBus.emit('customer.updated', {
      orgId,
      customer: customer.toObject(),
    });

    return customer;
  } catch (error) {
    logger.error('Update customer error', {
      error: error.message,
      customerId,
    });
    throw error;
  }
};

/**
 * Update customer consents
 */
const updateConsents = async ({ orgId, customerId, smsOptIn, emailOptIn, method = 'explicit' }) => {
  try {
    const customer = await Customer.findOne({ _id: customerId, orgId });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    if (smsOptIn !== undefined) {
      customer.consents.smsOptIn.granted = smsOptIn;
      customer.consents.smsOptIn.at = new Date();
      customer.consents.smsOptIn.method = method;
    }

    if (emailOptIn !== undefined) {
      customer.consents.emailOptIn.granted = emailOptIn;
      customer.consents.emailOptIn.at = new Date();
      customer.consents.emailOptIn.method = method;
    }

    await customer.save();

    logger.info('Customer consents updated', {
      customerId: customer._id,
      orgId,
      smsOptIn,
      emailOptIn,
    });

    return customer;
  } catch (error) {
    logger.error('Update consents error', {
      error: error.message,
      customerId,
    });
    throw error;
  }
};

/**
 * Get customer with activity history
 */
const getCustomerWithHistory = async ({ orgId, customerId }) => {
  try {
    const customer = await Customer.findOne({ _id: customerId, orgId });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Get recent messages
    const messages = await Message.find({
      orgId,
      customerId,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get appointments
    const appointments = await Appointment.find({
      orgId,
      customerId,
    })
      .populate('serviceId', 'name duration')
      .populate('workerId', 'profile')
      .sort({ startTime: -1 })
      .limit(20);

    // Get active threads
    const threads = await Thread.find({
      orgId,
      customerId,
    })
      .populate('assignedTo', 'profile email')
      .populate('phoneNumberId', 'phoneNumber friendlyName');

    return {
      customer,
      messages,
      appointments,
      threads,
    };
  } catch (error) {
    logger.error('Get customer with history error', {
      error: error.message,
      customerId,
    });
    throw error;
  }
};

/**
 * Search customers
 */
const searchCustomers = async ({ orgId, query, tags = [], limit = 50, offset = 0 }) => {
  try {
    const searchQuery = { orgId };

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ];
    }

    if (tags && tags.length > 0) {
      searchQuery.tags = { $in: tags };
    }

    const customers = await Customer.find(searchQuery)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await Customer.countDocuments(searchQuery);

    return {
      customers,
      total,
      limit,
      offset,
    };
  } catch (error) {
    logger.error('Search customers error', {
      error: error.message,
      orgId,
      query,
    });
    throw error;
  }
};

/**
 * Merge duplicate customers
 */
const mergeCustomers = async ({ orgId, primaryCustomerId, duplicateCustomerId }) => {
  try {
    const primaryCustomer = await Customer.findOne({ _id: primaryCustomerId, orgId });
    if (!primaryCustomer) {
      throw new NotFoundError('Primary customer not found');
    }

    const duplicateCustomer = await Customer.findOne({ _id: duplicateCustomerId, orgId });
    if (!duplicateCustomer) {
      throw new NotFoundError('Duplicate customer not found');
    }

    if (primaryCustomerId === duplicateCustomerId) {
      throw new ValidationError('Cannot merge customer with itself');
    }

    // Merge profile data (keep primary, add missing from duplicate)
    if (!primaryCustomer.name && duplicateCustomer.name) {
      primaryCustomer.name = duplicateCustomer.name;
    }

    if (!primaryCustomer.email && duplicateCustomer.email) {
      primaryCustomer.email = duplicateCustomer.email;
    }

    // Merge profile fields
    primaryCustomer.profile = {
      ...duplicateCustomer.profile,
      ...primaryCustomer.profile,
    };

    // Merge tags
    const mergedTags = [...new Set([...primaryCustomer.tags, ...duplicateCustomer.tags])];
    primaryCustomer.tags = mergedTags;

    // Merge notes
    if (duplicateCustomer.notes) {
      primaryCustomer.notes = `${primaryCustomer.notes}\n\n[Merged from duplicate]: ${duplicateCustomer.notes}`.trim();
    }

    // Merge stats
    primaryCustomer.stats.totalAppointments +=
      duplicateCustomer.stats.totalAppointments;
    primaryCustomer.stats.noShows += duplicateCustomer.stats.noShows;
    primaryCustomer.stats.lifetimeValue += duplicateCustomer.stats.lifetimeValue;

    // Update all messages to point to primary customer
    await Message.updateMany(
      { orgId, customerId: duplicateCustomerId },
      { $set: { customerId: primaryCustomerId } }
    );

    // Update all appointments to point to primary customer
    await Appointment.updateMany(
      { orgId, customerId: duplicateCustomerId },
      { $set: { customerId: primaryCustomerId } }
    );

    // Update all threads to point to primary customer
    await Thread.updateMany(
      { orgId, customerId: duplicateCustomerId },
      { $set: { customerId: primaryCustomerId } }
    );

    // Save primary customer
    await primaryCustomer.save();

    // Delete duplicate customer
    await duplicateCustomer.deleteOne();

    logger.info('Customers merged', {
      primaryCustomerId,
      duplicateCustomerId,
      orgId,
    });

    return primaryCustomer;
  } catch (error) {
    logger.error('Merge customers error', {
      error: error.message,
      primaryCustomerId,
      duplicateCustomerId,
    });
    throw error;
  }
};

/**
 * Delete customer (soft delete)
 */
const deleteCustomer = async ({ orgId, customerId }) => {
  try {
    const customer = await Customer.findOne({ _id: customerId, orgId });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check for upcoming appointments
    const upcomingAppointments = await Appointment.countDocuments({
      orgId,
      customerId,
      status: { $in: ['pending', 'confirmed'] },
      startTime: { $gte: new Date() },
    });

    if (upcomingAppointments > 0) {
      throw new ValidationError(
        'Cannot delete customer with upcoming appointments. Cancel appointments first.'
      );
    }

    // Soft delete by marking as deleted
    customer.status = 'deleted';
    customer.deletedAt = new Date();
    await customer.save();

    logger.info('Customer deleted', {
      customerId: customer._id,
      orgId,
    });

    return customer;
  } catch (error) {
    logger.error('Delete customer error', {
      error: error.message,
      customerId,
    });
    throw error;
  }
};

/**
 * Get customer statistics
 */
const getCustomerStats = async ({ orgId, customerId }) => {
  try {
    const customer = await Customer.findOne({ _id: customerId, orgId });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Count messages
    const messageCount = await Message.countDocuments({ orgId, customerId });

    const inboundMessages = await Message.countDocuments({
      orgId,
      customerId,
      direction: 'inbound',
    });

    const outboundMessages = await Message.countDocuments({
      orgId,
      customerId,
      direction: 'outbound',
    });

    // Count appointments by status
    const appointmentsByStatus = await Appointment.aggregate([
      { $match: { orgId, customerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Calculate response rate
    const responseRate =
      inboundMessages > 0 ? (outboundMessages / inboundMessages) * 100 : 0;

    return {
      customerId: customer._id,
      totalMessages: messageCount,
      inboundMessages,
      outboundMessages,
      responseRate: responseRate.toFixed(2),
      appointmentsByStatus: appointmentsByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      lifetimeStats: customer.stats,
      lastContactAt: customer.lastContactAt,
      createdAt: customer.createdAt,
    };
  } catch (error) {
    logger.error('Get customer stats error', {
      error: error.message,
      customerId,
    });
    throw error;
  }
};

/**
 * Bulk import customers
 */
const bulkImportCustomers = async ({ orgId, customers }) => {
  try {
    const results = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const customerData of customers) {
      try {
        const phoneE164 = formatToE164(customerData.phone);

        if (!isValidE164(phoneE164)) {
          results.errors.push({
            phone: customerData.phone,
            error: 'Invalid phone number',
          });
          results.skipped++;
          continue;
        }

        // Check if exists
        const existing = await Customer.findOne({ orgId, phone: phoneE164 });
        if (existing) {
          results.skipped++;
          continue;
        }

        // Create customer
        await Customer.create({
          orgId,
          phone: phoneE164,
          name: customerData.name,
          email: customerData.email ? customerData.email.toLowerCase() : undefined,
          profile: customerData.profile || {},
          tags: customerData.tags || [],
          consents: {
            smsOptIn: {
              granted: customerData.smsOptIn || false,
              at: customerData.smsOptIn ? new Date() : undefined,
              method: 'import',
            },
          },
        });

        results.created++;
      } catch (error) {
        results.errors.push({
          phone: customerData.phone,
          error: error.message,
        });
        results.skipped++;
      }
    }

    logger.info('Bulk import completed', {
      orgId,
      created: results.created,
      skipped: results.skipped,
      errors: results.errors.length,
    });

    return results;
  } catch (error) {
    logger.error('Bulk import error', {
      error: error.message,
      orgId,
    });
    throw error;
  }
};

module.exports = {
  createCustomer,
  updateCustomer,
  updateConsents,
  getCustomerWithHistory,
  searchCustomers,
  mergeCustomers,
  deleteCustomer,
  getCustomerStats,
  bulkImportCustomers,
};
