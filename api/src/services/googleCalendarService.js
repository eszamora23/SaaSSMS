/**
 * Google Calendar Service
 * Handles Google Calendar API integration for syncing appointments
 */

const { google } = require('googleapis');
const logger = require('../utils/logger');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = null;
    this.initializeOAuth();
  }

  /**
   * Initialize OAuth2 client
   */
  initializeOAuth() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/google-calendar/callback';

    if (!clientId || !clientSecret) {
      logger.warn('Google Calendar integration not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
      return;
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
  }

  /**
   * Check if OAuth is configured
   */
  isConfigured() {
    return this.oauth2Client !== null;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      state: state, // Can store orgId here
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      logger.error('Error getting tokens from code', { error: error.message });
      throw error;
    }
  }

  /**
   * Set credentials for API calls
   */
  setCredentials(tokens) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Refresh access token if needed
   */
  async refreshTokenIfNeeded(tokens) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    // Check if token is expired
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      this.setCredentials(tokens);
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    }

    return tokens;
  }

  /**
   * List all calendars for the authenticated user
   */
  async listCalendars(tokens) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    try {
      // Refresh token if needed
      const freshTokens = await this.refreshTokenIfNeeded(tokens);
      this.setCredentials(freshTokens);

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const response = await calendar.calendarList.list();

      return {
        calendars: response.data.items,
        tokens: freshTokens,
      };
    } catch (error) {
      logger.error('Error listing calendars', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(tokens, calendarId, appointment) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    try {
      // Refresh token if needed
      const freshTokens = await this.refreshTokenIfNeeded(tokens);
      this.setCredentials(freshTokens);

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: `${appointment.serviceId?.name || 'Appointment'} - ${appointment.customerId?.name || 'Customer'}`,
        description: appointment.notes || '',
        location: appointment.serviceId?.location || '',
        start: {
          dateTime: appointment.startTime,
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: appointment.endTime,
          timeZone: 'America/New_York',
        },
        attendees: appointment.customerId?.email
          ? [{ email: appointment.customerId.email }]
          : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: calendarId || 'primary',
        resource: event,
        sendUpdates: 'all', // Send email to attendees
      });

      return {
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        tokens: freshTokens,
      };
    } catch (error) {
      logger.error('Error creating calendar event', { error: error.message, appointment: appointment._id });
      throw error;
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(tokens, calendarId, eventId, appointment) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    try {
      // Refresh token if needed
      const freshTokens = await this.refreshTokenIfNeeded(tokens);
      this.setCredentials(freshTokens);

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const event = {
        summary: `${appointment.serviceId?.name || 'Appointment'} - ${appointment.customerId?.name || 'Customer'}`,
        description: appointment.notes || '',
        location: appointment.serviceId?.location || '',
        start: {
          dateTime: appointment.startTime,
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: appointment.endTime,
          timeZone: 'America/New_York',
        },
        attendees: appointment.customerId?.email
          ? [{ email: appointment.customerId.email }]
          : [],
      };

      const response = await calendar.events.update({
        calendarId: calendarId || 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all',
      });

      return {
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        tokens: freshTokens,
      };
    } catch (error) {
      logger.error('Error updating calendar event', { error: error.message, eventId });
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(tokens, calendarId, eventId) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    try {
      // Refresh token if needed
      const freshTokens = await this.refreshTokenIfNeeded(tokens);
      this.setCredentials(freshTokens);

      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: calendarId || 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      return { tokens: freshTokens };
    } catch (error) {
      logger.error('Error deleting calendar event', { error: error.message, eventId });
      throw error;
    }
  }

  /**
   * Test calendar connection
   */
  async testConnection(tokens) {
    if (!this.isConfigured()) {
      throw new Error('Google Calendar not configured');
    }

    try {
      const result = await this.listCalendars(tokens);
      return {
        success: true,
        calendarsCount: result.calendars.length,
        tokens: result.tokens,
      };
    } catch (error) {
      logger.error('Error testing calendar connection', { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new GoogleCalendarService();
