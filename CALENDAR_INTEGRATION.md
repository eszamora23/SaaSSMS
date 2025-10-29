# Calendar Integration Guide

## Overview

The SaaS SMS Calendar application includes calendar integration features that allow users to add appointments to their personal calendars.

## Current Features (Implemented)

### 1. "Add to Calendar" Button

The application now includes an "Add to Calendar" button that appears:
- In the appointment detail dialog (Appointments page)
- In the booking confirmation message (Public booking page)

**Supported Calendar Providers:**
- ✅ Google Calendar
- ✅ Outlook Calendar
- ✅ Office 365 Calendar
- ✅ Yahoo Calendar
- ✅ Download .ics file (works with Apple Calendar, Thunderbird, and other iCal-compatible apps)

### How It Works

When a user clicks the "Add to Calendar" button, they see a dropdown menu with options for different calendar providers. The system generates:

1. **Calendar URLs**: Deep links that open the user's calendar app pre-filled with appointment details
2. **.ics Files**: Standard iCalendar format files that can be imported into any calendar application

**Appointment Details Included:**
- Event title (Service name + Customer name)
- Start and end time
- Description/notes
- Location (if service has a location)

### Implementation Files

- `client/src/utils/calendar.js` - Calendar URL and .ics file generation utilities
- `client/src/components/AddToCalendarButton.jsx` - Reusable button component
- Updated: `client/src/pages/Appointments.jsx` - Added button to appointment detail dialog
- Updated: `client/src/pages/PublicBooking.jsx` - Added button to booking confirmation

## Future Enhancement: Google Calendar Two-Way Sync

### Overview

For a more robust integration, you can implement two-way synchronization between the application and workers' Google Calendars. This would allow:

- Workers to see their appointments automatically in Google Calendar
- Block time slots in the booking system when workers have Google Calendar events
- Update appointments when changed in either system

### Setup Requirements

1. **Google Cloud Project Setup**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Calendar API
   - Create OAuth 2.0 credentials
   - Configure authorized redirect URIs

2. **OAuth Credentials**
   - Client ID
   - Client Secret
   - Redirect URIs (e.g., `https://yourdomain.com/api/v1/auth/google/callback`)

3. **Environment Variables**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=your_redirect_uri
   ```

### Implementation Steps

#### 1. Backend: Google Calendar API Integration

**Install Google API Client:**
```bash
cd api
npm install googleapis
```

**Create Calendar Service** (`api/src/services/googleCalendarService.js`):
```javascript
const { google } = require('googleapis');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // Generate OAuth URL for user authorization
  getAuthUrl(userId) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
      state: userId,
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  // Create calendar event
  async createEvent(tokens, appointment) {
    this.oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const event = {
      summary: `${appointment.serviceId.name} - ${appointment.customerId.name}`,
      description: appointment.notes,
      location: appointment.serviceId.location,
      start: {
        dateTime: appointment.startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: appointment.endTime,
        timeZone: 'America/New_York',
      },
    };

    return await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
  }

  // Update calendar event
  async updateEvent(tokens, eventId, appointment) {
    // Implementation for updating events
  }

  // Delete calendar event
  async deleteEvent(tokens, eventId) {
    // Implementation for deleting events
  }

  // List calendar events (for blocking availability)
  async listEvents(tokens, timeMin, timeMax) {
    this.oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  }
}

module.exports = new GoogleCalendarService();
```

#### 2. Database Schema Updates

**Add to User model:**
```javascript
googleCalendar: {
  accessToken: String,
  refreshToken: String,
  expiryDate: Date,
  calendarId: { type: String, default: 'primary' },
  syncEnabled: { type: Boolean, default: false },
}
```

**Add to Appointment model:**
```javascript
googleCalendarEventId: String,
```

#### 3. API Endpoints

**Create OAuth routes** (`api/src/routes/v1/googleCalendar.js`):
```javascript
// GET /api/v1/google-calendar/auth - Start OAuth flow
// GET /api/v1/google-calendar/callback - OAuth callback
// POST /api/v1/google-calendar/sync - Enable/disable sync
// POST /api/v1/google-calendar/disconnect - Disconnect Google Calendar
```

#### 4. Frontend Integration

**Settings Page:**
- Add "Connect Google Calendar" button in Settings > Team tab
- Show sync status for each worker
- Allow enable/disable sync per worker

**Appointment Sync:**
- Automatically create Google Calendar events when appointments are created
- Update events when appointments are modified
- Delete events when appointments are cancelled

#### 5. Background Jobs

**Create sync job** (`api/src/jobs/calendarSyncJob.js`):
```javascript
// Periodically sync appointments with Google Calendar
// Check for conflicts
// Update availability based on Google Calendar events
```

### Security Considerations

1. **Token Storage**: Encrypt OAuth tokens in database
2. **Token Refresh**: Implement automatic token refresh using refresh tokens
3. **Rate Limiting**: Respect Google Calendar API rate limits
4. **Error Handling**: Handle API errors gracefully (expired tokens, API downtime)
5. **User Consent**: Clear explanation of what data is accessed and why

### Testing

1. Test OAuth flow with Google test accounts
2. Verify event creation, update, and deletion
3. Test token refresh mechanism
4. Handle edge cases (timezone differences, concurrent updates)

## Benefits of Two-Way Sync

**For Workers:**
- Automatic calendar updates
- Single source of truth for their schedule
- Works with existing calendar workflows
- Mobile app notifications

**For Business:**
- Reduced no-shows (calendar reminders)
- Better availability management
- Integration with other calendar-based tools
- Professional appearance

## Alternative: Webhook Integration

Instead of polling, you can use Google Calendar Push Notifications (webhooks) for real-time updates:

1. Set up webhook endpoint
2. Register channel with Google Calendar API
3. Receive notifications when calendar changes
4. Update availability in real-time

## Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)
- [iCalendar RFC 5545](https://tools.ietf.org/html/rfc5545)

## Current Implementation Status

✅ **Completed:**
- Add to Calendar button component
- Calendar URL generation (Google, Outlook, Office 365, Yahoo)
- .ics file generation and download
- Integration in Appointments page
- Integration in Public Booking page

⏳ **Pending (Future Enhancement):**
- Google Calendar OAuth setup
- Two-way sync service
- Background sync jobs
- Settings UI for calendar connection
- Webhook integration for real-time updates

## Usage Examples

### Basic Usage

```jsx
import AddToCalendarButton from '../components/AddToCalendarButton';

<AddToCalendarButton
  appointment={appointment}
  variant="contained"
  size="medium"
/>
```

### With Custom Styling

```jsx
<AddToCalendarButton
  appointment={appointment}
  variant="outlined"
  size="small"
  fullWidth
/>
```

## Notes

- The current implementation requires no additional setup or API keys
- Calendar URLs work with all major calendar providers
- .ics files are compatible with all calendar applications
- No user data is sent to external servers
- All calendar integrations happen client-side
