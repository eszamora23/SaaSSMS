/**
 * Customers Controller
 * Handles customer/CRM endpoints
 */

const customerService = require('../services/customerService');
const { successResponse } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Create customer
 * POST /api/v1/customers
 */
const createCustomer = asyncHandler(async (req, res) => {
  const { phone, name, email, profile, consents } = req.body;

  const customer = await customerService.createCustomer({
    orgId: req.user.orgId,
    phone,
    name,
    email,
    profile,
    consents,
  });

  res.status(201).json(successResponse('Customer created', { customer }));
});

/**
 * Get all customers
 * GET /api/v1/customers
 */
const getCustomers = asyncHandler(async (req, res) => {
  const { query, tags, limit = 50, offset = 0 } = req.query;

  const result = await customerService.searchCustomers({
    orgId: req.user.orgId,
    query,
    tags: tags ? tags.split(',') : [],
    limit: parseInt(limit),
    offset: parseInt(offset),
  });

  res.json(
    successResponse('Customers retrieved', {
      customers: result.customers,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    })
  );
});

/**
 * Get customer by ID with history
 * GET /api/v1/customers/:id
 */
const getCustomer = asyncHandler(async (req, res) => {
  const result = await customerService.getCustomerWithHistory({
    orgId: req.user.orgId,
    customerId: req.params.id,
  });

  res.json(
    successResponse('Customer retrieved', {
      customer: result.customer,
      messages: result.messages,
      appointments: result.appointments,
      threads: result.threads,
    })
  );
});

/**
 * Update customer
 * PATCH /api/v1/customers/:id
 */
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer({
    orgId: req.user.orgId,
    customerId: req.params.id,
    updates: req.body,
  });

  res.json(successResponse('Customer updated', { customer }));
});

/**
 * Update customer consents
 * PATCH /api/v1/customers/:id/consents
 */
const updateConsents = asyncHandler(async (req, res) => {
  const { smsOptIn, emailOptIn, method } = req.body;

  const customer = await customerService.updateConsents({
    orgId: req.user.orgId,
    customerId: req.params.id,
    smsOptIn,
    emailOptIn,
    method,
  });

  res.json(successResponse('Consents updated', { customer }));
});

/**
 * Delete customer
 * DELETE /api/v1/customers/:id
 */
const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer({
    orgId: req.user.orgId,
    customerId: req.params.id,
  });

  res.json(successResponse('Customer deleted'));
});

/**
 * Merge duplicate customers
 * POST /api/v1/customers/:id/merge
 */
const mergeCustomers = asyncHandler(async (req, res) => {
  const { duplicateCustomerId } = req.body;

  const customer = await customerService.mergeCustomers({
    orgId: req.user.orgId,
    primaryCustomerId: req.params.id,
    duplicateCustomerId,
  });

  res.json(successResponse('Customers merged', { customer }));
});

/**
 * Get customer statistics
 * GET /api/v1/customers/:id/stats
 */
const getCustomerStats = asyncHandler(async (req, res) => {
  const stats = await customerService.getCustomerStats({
    orgId: req.user.orgId,
    customerId: req.params.id,
  });

  res.json(successResponse('Customer stats retrieved', { stats }));
});

/**
 * Bulk import customers
 * POST /api/v1/customers/import
 */
const bulkImport = asyncHandler(async (req, res) => {
  const { customers } = req.body;

  const result = await customerService.bulkImportCustomers({
    orgId: req.user.orgId,
    customers,
  });

  res.json(
    successResponse('Bulk import completed', {
      created: result.created,
      skipped: result.skipped,
      errors: result.errors,
    })
  );
});

module.exports = {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  updateConsents,
  deleteCustomer,
  mergeCustomers,
  getCustomerStats,
  bulkImport,
};
