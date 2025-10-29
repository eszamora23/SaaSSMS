/**
 * Google Calendar API Routes
 * Handles OAuth and calendar operations
 */

const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const googleCalendarService = require('../../services/googleCalendarService');
const { authenticate } = require('../../middleware/authenticate');
const { requireAdmin } = require('../../middleware/authorize');
const Organization = require('../../models/Organization');
const logger = require('../../utils/logger');

/**
 * Check if Google Calendar is configured
 * GET /api/v1/google-calendar/status
 */
router.get(
  '/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const organization = await Organization.findById(req.user.orgId);

    const hasCredentials = !!(
      organization.googleCalendarConfig?.accessToken &&
      organization.googleCalendarConfig?.refreshToken
    );

    res.json(
      successResponse('Google Calendar status', {
        configured: googleCalendarService.isConfigured(),
        connected: hasCredentials,
        connectedAt: organization.googleCalendarConfig?.connectedAt || null,
      })
    );
  })
);

/**
 * Start OAuth flow
 * GET /api/v1/google-calendar/auth
 */
router.get(
  '/auth',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (!googleCalendarService.isConfigured()) {
      return res.status(400).json({
        error: 'Google Calendar integration not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.',
      });
    }

    // Use orgId as state to identify organization after OAuth
    const authUrl = googleCalendarService.getAuthUrl(req.user.orgId.toString());

    res.json(
      successResponse('OAuth URL generated', {
        authUrl,
      })
    );
  })
);

/**
 * OAuth callback
 * GET /api/v1/google-calendar/callback
 */
router.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { code, state: orgId } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code missing');
    }

    if (!orgId) {
      return res.status(400).send('Organization ID missing');
    }

    try {
      // Exchange code for tokens
      const tokens = await googleCalendarService.getTokensFromCode(code);

      // Save tokens to organization
      const organization = await Organization.findById(orgId);
      if (!organization) {
        return res.status(404).send('Organization not found');
      }

      organization.googleCalendarConfig = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: new Date(tokens.expiry_date),
        scope: tokens.scope,
        tokenType: tokens.token_type,
        connectedAt: new Date(),
      };

      await organization.save();

      logger.info('Google Calendar connected', { orgId });

      // Redirect to settings page with success message
      res.send(`
        <html>
          <body>
            <h2>Google Calendar Connected Successfully!</h2>
            <p>You can now close this window and return to the application.</p>
            <script>
              window.opener?.postMessage({ type: 'GOOGLE_CALENDAR_CONNECTED' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </body>
        </html>
      `);
    } catch (error) {
      logger.error('OAuth callback error', { error: error.message });
      res.status(500).send(`Error connecting Google Calendar: ${error.message}`);
    }
  })
);

/**
 * List available calendars
 * GET /api/v1/google-calendar/calendars
 */
router.get(
  '/calendars',
  authenticate,
  asyncHandler(async (req, res) => {
    const organization = await Organization.findById(req.user.orgId);

    if (!organization.googleCalendarConfig?.accessToken) {
      return res.status(400).json({
        error: 'Google Calendar not connected. Please connect first.',
      });
    }

    try {
      const result = await googleCalendarService.listCalendars({
        access_token: organization.googleCalendarConfig.accessToken,
        refresh_token: organization.googleCalendarConfig.refreshToken,
        expiry_date: organization.googleCalendarConfig.expiryDate?.getTime(),
      });

      // Update tokens if they were refreshed
      if (result.tokens.access_token !== organization.googleCalendarConfig.accessToken) {
        organization.googleCalendarConfig.accessToken = result.tokens.access_token;
        organization.googleCalendarConfig.expiryDate = new Date(result.tokens.expiry_date);
        await organization.save();
      }

      res.json(
        successResponse('Calendars retrieved', {
          calendars: result.calendars.map(cal => ({
            id: cal.id,
            summary: cal.summary,
            description: cal.description,
            timeZone: cal.timeZone,
            primary: cal.primary,
            accessRole: cal.accessRole,
            backgroundColor: cal.backgroundColor,
          })),
        })
      );
    } catch (error) {
      logger.error('Error listing calendars', { error: error.message });
      res.status(500).json({
        error: 'Failed to fetch calendars. Please reconnect your Google Calendar.',
      });
    }
  })
);

/**
 * Disconnect Google Calendar
 * POST /api/v1/google-calendar/disconnect
 */
router.post(
  '/disconnect',
  authenticate,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const organization = await Organization.findById(req.user.orgId);

    organization.googleCalendarConfig = undefined;
    await organization.save();

    // Also clear calendar settings from all services
    const { Service } = require('../../models');
    await Service.updateMany(
      { orgId: req.user.orgId },
      {
        $set: {
          'googleCalendar.calendarId': null,
          'googleCalendar.calendarName': null,
          'googleCalendar.syncEnabled': false,
        },
      }
    );

    logger.info('Google Calendar disconnected', { orgId: req.user.orgId });

    res.json(successResponse('Google Calendar disconnected'));
  })
);

/**
 * Test calendar connection
 * POST /api/v1/google-calendar/test
 */
router.post(
  '/test',
  authenticate,
  asyncHandler(async (req, res) => {
    const organization = await Organization.findById(req.user.orgId);

    if (!organization.googleCalendarConfig?.accessToken) {
      return res.status(400).json({
        error: 'Google Calendar not connected',
      });
    }

    const result = await googleCalendarService.testConnection({
      access_token: organization.googleCalendarConfig.accessToken,
      refresh_token: organization.googleCalendarConfig.refreshToken,
      expiry_date: organization.googleCalendarConfig.expiryDate?.getTime(),
    });

    if (result.success && result.tokens) {
      // Update tokens if refreshed
      organization.googleCalendarConfig.accessToken = result.tokens.access_token;
      organization.googleCalendarConfig.expiryDate = new Date(result.tokens.expiry_date);
      await organization.save();
    }

    res.json(successResponse('Connection test completed', result));
  })
);

module.exports = router;
