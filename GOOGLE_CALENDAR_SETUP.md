# Google Calendar Integration - Setup Guide

## ✅ What's Been Implemented

### Backend (API)

1. **Database Models Updated**
   - ✅ Service model: Added `googleCalendar` field (calendarId, calendarName, syncEnabled, lastSyncAt)
   - ✅ Organization model: Added `googleCalendarConfig` field (OAuth tokens)

2. **Google Calendar Service** (`api/src/services/googleCalendarService.js`)
   - ✅ OAuth2 authentication flow
   - ✅ List user's calendars
   - ✅ Create calendar events
   - ✅ Update calendar events
   - ✅ Delete calendar events
   - ✅ Automatic token refresh

3. **API Endpoints** (`api/src/routes/v1/googleCalendar.js`)
   - ✅ `GET /api/v1/google-calendar/status` - Check connection status
   - ✅ `GET /api/v1/google-calendar/auth` - Start OAuth flow
   - ✅ `GET /api/v1/google-calendar/callback` - OAuth callback handler
   - ✅ `GET /api/v1/google-calendar/calendars` - List available calendars
   - ✅ `POST /api/v1/google-calendar/disconnect` - Disconnect Google Calendar
   - ✅ `POST /api/v1/google-calendar/test` - Test connection

4. **Services Controller Updated**
   - ✅ Create service with Google Calendar settings
   - ✅ Update service with Google Calendar settings

### Frontend (UI) - Next Steps

The following UI components need to be created:

1. **Settings Page** - Add Google Calendar connection section
2. **Services Page** - Add calendar selector dropdown when editing services

---

## 🔧 Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it something like "SaaS SMS Calendar Integration"

### Step 2: Enable Google Calendar API

1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

### Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: SaaS SMS Calendar OAuth
   - **Authorized JavaScript origins**:
     - `http://localhost:5000`
     - `http://localhost:3000`
     - Your production domain (e.g., `https://yourdomain.com`)
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/v1/google-calendar/callback`
     - Your production callback URL (e.g., `https://yourdomain.com/api/v1/google-calendar/callback`)
5. Click "Create"
6. **Save your Client ID and Client Secret**

### Step 4: Configure Environment Variables

Add these to your `.env` file in the `api` folder:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/google-calendar/callback
```

**For Production:**
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/v1/google-calendar/callback
```

### Step 5: Restart API Server

```bash
cd api
npm restart
```

Or if running with nodemon, it should restart automatically.

---

## 📱 UI Implementation Guide

### 1. Add Google Calendar Section to Settings Page

Location: `client/src/pages/Settings.jsx`

Add a new tab or section that includes:

```jsx
// Pseudo-code for Settings page

<Tab label="Integrations" />

{/* In the Integrations tab */}
<Box>
  <Typography variant="h6">Google Calendar</Typography>

  {/* Connection Status */}
  {isConnected ? (
    <Alert severity="success">
      Connected to Google Calendar
      <Button onClick={handleDisconnect}>Disconnect</Button>
    </Alert>
  ) : (
    <Alert severity="info">
      Connect your Google Calendar to sync appointments automatically
      <Button onClick={handleConnect}>Connect Google Calendar</Button>
    </Alert>
  )}

  {/* Calendar List - shown when connected */}
  {isConnected && (
    <List>
      {calendars.map(calendar => (
        <ListItem key={calendar.id}>
          <ListItemText
            primary={calendar.summary}
            secondary={calendar.description}
          />
        </ListItem>
      ))}
    </List>
  )}
</Box>
```

**API Calls to Implement:**

```javascript
// Check connection status
const checkGoogleCalendarStatus = async () => {
  const response = await axios.get('/api/v1/google-calendar/status');
  setIsConnected(response.data.data.connected);
};

// Start OAuth flow
const handleConnect = async () => {
  const response = await axios.get('/api/v1/google-calendar/auth');
  // Open OAuth URL in popup
  const popup = window.open(
    response.data.data.authUrl,
    'Google Calendar OAuth',
    'width=600,height=600'
  );

  // Listen for success message from popup
  window.addEventListener('message', (event) => {
    if (event.data.type === 'GOOGLE_CALENDAR_CONNECTED') {
      popup?.close();
      checkGoogleCalendarStatus(); // Refresh status
      fetchCalendars(); // Load calendars
    }
  });
};

// Fetch calendars
const fetchCalendars = async () => {
  const response = await axios.get('/api/v1/google-calendar/calendars');
  setCalendars(response.data.data.calendars);
};

// Disconnect
const handleDisconnect = async () => {
  await axios.post('/api/v1/google-calendar/disconnect');
  setIsConnected(false);
  setCalendars([]);
};
```

### 2. Update Services Page to Show Calendar Selector

Location: `client/src/pages/Services.jsx` (or wherever services are managed)

Add Google Calendar field to the service form:

```jsx
// In the Service Dialog/Form

{/* Google Calendar Section */}
<FormControl fullWidth>
  <InputLabel>Google Calendar</InputLabel>
  <Select
    value={formData.googleCalendar?.calendarId || ''}
    onChange={(e) => setFormData({
      ...formData,
      googleCalendar: {
        calendarId: e.target.value,
        calendarName: calendars.find(c => c.id === e.target.value)?.summary || '',
        syncEnabled: !!e.target.value,
      }
    })}
    label="Google Calendar"
  >
    <MenuItem value="">
      <em>No Calendar (Disable Sync)</em>
    </MenuItem>
    {calendars.map(calendar => (
      <MenuItem key={calendar.id} value={calendar.id}>
        {calendar.summary}
        {calendar.primary && ' (Primary)'}
      </MenuItem>
    ))}
  </Select>
  <FormHelperText>
    Appointments for this service will be automatically synced to the selected Google Calendar
  </FormHelperText>
</FormControl>

{/* Sync Status Toggle */}
<FormControlLabel
  control={
    <Switch
      checked={formData.googleCalendar?.syncEnabled || false}
      onChange={(e) => setFormData({
        ...formData,
        googleCalendar: {
          ...formData.googleCalendar,
          syncEnabled: e.target.checked,
        }
      })}
      disabled={!formData.googleCalendar?.calendarId}
    />
  }
  label="Enable Auto-Sync"
/>
```

**Load calendars when form opens:**

```javascript
useEffect(() => {
  if (dialogOpen) {
    fetchCalendars();
  }
}, [dialogOpen]);

const fetchCalendars = async () => {
  try {
    const response = await axios.get('/api/v1/google-calendar/calendars');
    setCalendars(response.data.data.calendars);
  } catch (error) {
    // Google Calendar not connected yet
    setCalendars([]);
  }
};
```

### 3. Auto-Sync Logic (Future Enhancement)

To automatically sync appointments to Google Calendar when they're created/updated, you'll need to:

**In Appointments Controller:**

```javascript
const googleCalendarService = require('../services/googleCalendarService');
const Organization = require('../models/Organization');

// After creating appointment
if (appointment.serviceId.googleCalendar?.syncEnabled) {
  const organization = await Organization.findById(req.user.orgId);

  if (organization.googleCalendarConfig?.accessToken) {
    try {
      const result = await googleCalendarService.createEvent(
        {
          access_token: organization.googleCalendarConfig.accessToken,
          refresh_token: organization.googleCalendarConfig.refreshToken,
          expiry_date: organization.googleCalendarConfig.expiryDate?.getTime(),
        },
        appointment.serviceId.googleCalendar.calendarId,
        appointment
      );

      // Store event ID for future updates/deletes
      appointment.googleCalendarEventId = result.eventId;
      await appointment.save();

      // Update tokens if refreshed
      if (result.tokens.access_token !== organization.googleCalendarConfig.accessToken) {
        organization.googleCalendarConfig.accessToken = result.tokens.access_token;
        organization.googleCalendarConfig.expiryDate = new Date(result.tokens.expiry_date);
        await organization.save();
      }
    } catch (error) {
      logger.error('Failed to sync appointment to Google Calendar', { error });
      // Don't fail the appointment creation if sync fails
    }
  }
}
```

---

## 🎯 How It Works

### User Flow

1. **Admin connects Google Calendar** in Settings > Integrations
   - OAuth popup opens
   - User authorizes access
   - Tokens are saved to organization

2. **Admin configures services** in Services page
   - For each service, select which Google Calendar to use
   - Enable auto-sync toggle
   - Save service

3. **Appointments are created**
   - System checks if service has Google Calendar sync enabled
   - If yes, automatically creates event in the linked calendar
   - Event includes:
     - Service name + Customer name as title
     - Start and end time
     - Location
     - Notes
     - Customer email as attendee (gets calendar invite)

4. **Appointments are updated/cancelled**
   - System automatically updates/deletes the corresponding Google Calendar event

### Benefits

- ✅ **Automatic Sync**: No manual calendar management needed
- ✅ **Per-Service Calendars**: Different services can use different calendars
- ✅ **Shared Visibility**: Multiple team members can see bookings in Google Calendar
- ✅ **Customer Invites**: Customers receive calendar invitations via email
- ✅ **Mobile Integration**: Works with Google Calendar mobile apps
- ✅ **Recurring Events**: Can be extended to support recurring appointments

---

## 🔐 Security Notes

1. **OAuth Tokens are Encrypted**: Stored securely in MongoDB
2. **Automatic Token Refresh**: System automatically refreshes expired tokens
3. **Organization-Level**: One Google account per organization (admin connects)
4. **Scope Limitation**: Only requests calendar access (no email, contacts, etc.)
5. **Admin-Only**: Only admins can connect/disconnect Google Calendar

---

## 🐛 Troubleshooting

### "Google Calendar not configured" Error

- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart API server after adding environment variables

### OAuth Popup Blocked

- Allow popups for your application in browser settings
- Make sure redirect URI matches exactly in Google Cloud Console

### Calendars Not Loading

- Ensure organization is connected (check status endpoint)
- Try disconnecting and reconnecting
- Check browser console for errors

### Events Not Syncing

- Verify service has `syncEnabled: true`
- Check that organization has valid tokens
- Look for errors in API server logs

---

## 📚 API Reference

### Check Status
```
GET /api/v1/google-calendar/status
Response: { configured: boolean, connected: boolean, connectedAt: Date }
```

### Start OAuth
```
GET /api/v1/google-calendar/auth
Response: { authUrl: string }
```

### List Calendars
```
GET /api/v1/google-calendar/calendars
Response: { calendars: Array<Calendar> }
```

### Disconnect
```
POST /api/v1/google-calendar/disconnect
Response: { success: true }
```

---

## ✨ Next Steps

1. ✅ Backend implementation (DONE)
2. ⏳ Create UI components in Settings page
3. ⏳ Create UI components in Services page
4. ⏳ Add auto-sync logic to appointments controller
5. ⏳ Add Google Calendar event ID field to Appointment model
6. ⏳ Test end-to-end flow

Would you like me to implement the UI components next?
