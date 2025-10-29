/**
 * Organization Validation Schemas
 * Zod schemas for validating organization-related requests
 */

const { z } = require('zod');

/**
 * Update Twilio Configuration Schema
 */
const updateTwilioConfigSchema = {
  body: z.object({
    accountSid: z
      .string()
      .regex(/^AC[a-zA-Z0-9]{32}$/, 'Invalid Twilio Account SID format')
      .describe('Twilio Account SID (starts with AC)'),

    authToken: z
      .string()
      .min(32, 'Invalid Twilio Auth Token')
      .describe('Twilio Auth Token'),

    messagingServiceSid: z
      .string()
      .regex(/^MG[a-zA-Z0-9]{32}$/, 'Invalid Messaging Service SID format')
      .optional()
      .describe('Twilio Messaging Service SID (optional, starts with MG)'),
  }),
};

/**
 * Update Business Hours Schema
 */
const updateBusinessHoursSchema = {
  body: z.object({
    businessHours: z.array(
      z.object({
        dayOfWeek: z
          .number()
          .int()
          .min(0, 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
          .max(6, 'Day of week must be between 0 (Sunday) and 6 (Saturday)')
          .describe('Day of week (0 = Sunday, 6 = Saturday)'),

        start: z
          .string()
          .regex(
            /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Invalid time format. Use HH:MM (24-hour format)'
          )
          .describe('Start time in HH:MM format'),

        end: z
          .string()
          .regex(
            /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Invalid time format. Use HH:MM (24-hour format)'
          )
          .describe('End time in HH:MM format'),
      })
    ).min(1, 'At least one business hour entry is required'),
  }),
};

/**
 * Update Organization Settings Schema
 */
const updateOrganizationSchema = {
  body: z.object({
    name: z
      .string()
      .min(3, 'Organization name must be at least 3 characters')
      .max(100, 'Organization name cannot exceed 100 characters')
      .optional(),

    email: z
      .string()
      .email('Invalid email address')
      .optional(),

    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),

    timezone: z
      .string()
      .optional()
      .describe('IANA timezone (e.g., America/New_York)'),

    country: z
      .string()
      .length(2, 'Country code must be 2 characters (ISO 3166-1 alpha-2)')
      .optional(),
  }),
};

/**
 * Update Branding Schema
 */
const updateBrandingSchema = {
  body: z.object({
    logo: z
      .string()
      .url('Logo must be a valid URL')
      .optional(),

    primaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Primary color must be a valid hex color')
      .optional(),

    secondaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Secondary color must be a valid hex color')
      .optional(),

    customDomain: z
      .string()
      .regex(
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
        'Invalid domain format'
      )
      .optional(),
  }),
};

/**
 * Add Holiday Schema
 */
const addHolidaySchema = {
  body: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .describe('Holiday date'),

    name: z
      .string()
      .min(1, 'Holiday name is required')
      .max(100, 'Holiday name cannot exceed 100 characters')
      .describe('Holiday name'),
  }),
};

/**
 * Update Features Schema
 */
const updateFeaturesSchema = {
  body: z.object({
    ivrEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    paymentsEnabled: z.boolean().optional(),
  }),
};

module.exports = {
  updateTwilioConfigSchema,
  updateBusinessHoursSchema,
  updateOrganizationSchema,
  updateBrandingSchema,
  addHolidaySchema,
  updateFeaturesSchema,
};
