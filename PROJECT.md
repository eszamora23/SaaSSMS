# Enterprise SaaS Platform - SMS Contact Center & Smart Scheduling System

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Stack](#technical-stack)
3. [Architecture Overview](#architecture-overview)
4. [Core Features](#core-features)
5. [Data Models](#data-models)
6. [API Specifications](#api-specifications)
7. [Security & Compliance](#security--compliance)
8. [Deployment & Infrastructure](#deployment--infrastructure)
9. [Testing Strategy](#testing-strategy)
10. [Extensibility & Future Modules](#extensibility--future-modules)
11. [Development Workflow](#development-workflow)
12. [Acceptance Criteria](#acceptance-criteria)

---

## Project Overview

### Vision
A production-ready, enterprise-grade SaaS platform combining SMS communication management with advanced appointment scheduling capabilities. The system supports multi-tenancy with organization-based isolation, role-based access control, and seamless integration capabilities.

### Key Objectives
- **Multi-tenant architecture** with strict data isolation per organization
- **SMS Contact Center** with per-worker phone numbers and shared IVR inbox
- **Smart scheduling** system (Calendly-like) for customer-facing appointment booking
- **Unified CRM** with 360-degree customer view
- **API-first design** with comprehensive webhooks for integrations
- **Production-grade** security, scalability, and observability
- **Modular extensibility** for future add-ons without disrupting core functionality

### Target Users
- **Platform Super Admin**: Manages the entire SaaS platform
- **Organization Admin**: Manages organization settings, users, and configurations
- **Workers**: Handle SMS communications and appointments
- **End Customers**: Book appointments via public-facing calendar

---

## Technical Stack

### MERN Stack Components

#### Frontend
- **Framework**: React 18+
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit / React Query / RTK Query
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6
- **Date/Time**: Luxon or Day.js
- **Real-time**: Socket.io client
- **Build Tool**: Vite or Create React App
- **Testing**: Jest, React Testing Library

#### Backend
- **Runtime**: Node.js (LTS version)
- **Framework**: Express.js
- **Authentication**: JWT (access + refresh tokens), Passport.js
- **Validation**: Zod or Joi
- **ORM/ODM**: Mongoose for MongoDB
- **Queue Management**: Bull or BullMQ (Redis-backed)
- **Real-time**: Socket.io server
- **Logging**: Winston, Morgan
- **Testing**: Jest, Supertest

#### Database
- **Primary Database**: MongoDB Atlas
  - Replica sets for high availability
  - Automatic backups with point-in-time recovery
  - Sharding for horizontal scalability
  - Field-level encryption for PII
- **Caching/Queue**: Redis
  - Session storage
  - Rate limiting
  - Job queues
  - Real-time pub/sub

#### Communication Services
- **SMS/Voice**: Twilio
  - Programmable Messaging
  - Programmable Voice (IVR)
  - Phone Number Management
  - Status callbacks
  - Opt-out management

#### Additional Services
- **Email**: SendGrid or AWS SES
- **File Storage**: AWS S3 or Google Cloud Storage
- **Error Tracking**: Sentry
- **Monitoring**: Prometheus + Grafana or Datadog
- **CDN**: CloudFlare or AWS CloudFront

---

## Architecture Overview

### Multi-Tenant Model

#### Subdomain-Based Tenancy
- Each organization gets a unique subdomain: `https://{orgSlug}.domain.com`
- Wildcard DNS and TLS certificates for `*.domain.com`
- Edge routing/proxy maps subdomain to organization context
- Server-side validation of subdomain against JWT claims

#### Data Isolation Strategy
- **Database Level**: Every document includes `orgId` field
- **Query Level**: Middleware automatically scopes all queries by `orgId`
- **API Level**: JWT contains `orgId` claim; validated on every request
- **No Cross-Tenant Access**: Server-side checks prevent data leakage
- **Audit Trail**: All cross-collection queries logged

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Edge Layer (CloudFlare/Nginx)            │
│  *.domain.com → Route to API/Frontend based on subdomain    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (React + Material UI)              │
│  - Org Admin Dashboard    - Worker Console                  │
│  - Public Booking Site    - Mobile-responsive               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  API Layer (Express.js)                      │
│  - REST APIs (versioned)  - WebSocket server                │
│  - JWT Auth               - Rate limiting                    │
│  - RBAC middleware        - Input validation                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────┬─────────────────┬────────────────────────┐
│   MongoDB Atlas  │     Redis       │   Twilio Services      │
│   - Organizations│  - Sessions     │   - SMS API            │
│   - Users        │  - Cache        │   - Phone Numbers      │
│   - Customers    │  - Job Queue    │   - Status Callbacks   │
│   - Messages     │  - Rate Limits  │   - IVR                │
│   - Appointments │                 │                        │
└──────────────────┴─────────────────┴────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Background Workers                          │
│  - SMS Sending Queue      - Reminder Scheduler              │
│  - Webhook Delivery       - Cleanup Jobs                    │
└─────────────────────────────────────────────────────────────┘
```

### Environment Configuration

#### Local Development
- Docker Compose for MongoDB, Redis
- Twilio test credentials and webhook tunneling (ngrok)
- Hot-reload for frontend and backend
- Mock external services where appropriate
- `.env.local` file with development credentials

#### Staging Environment
- Mirrors production architecture
- Separate MongoDB Atlas cluster
- Twilio test subaccount
- Limited scale for cost efficiency
- `.env.staging` configuration

#### Production Environment
- Kubernetes or managed container service
- MongoDB Atlas production cluster with geo-replication
- Twilio production account
- Auto-scaling based on load
- `.env.production` with secret management (AWS Secrets Manager, HashiCorp Vault)

---

## Core Features

### 1. Multi-Tenant Organization Management

#### Organization Registration Flow

**Step 1: Self-Service Signup**
- User visits main portal (e.g., `https://app.domain.com`)
- Provides: Organization name, email, password, country/timezone
- System generates unique `orgSlug` from organization name
- Checks slug availability (must be unique)
- Creates pending Organization record

**Step 2: Email Verification**
- Send verification email with time-limited token
- User clicks link to verify email
- Organization status changes from `pending` to `active`

**Step 3: Subdomain Provisioning**
- System automatically provisions `https://{orgSlug}.domain.com`
- DNS wildcard already configured; no manual intervention
- First user becomes Organization Admin

**Step 4: Guided Onboarding**
- Configure business hours and timezone
- Set up branding (logo, colors, company info)
- Optional: Purchase/link first Twilio phone number
- Optional: Create first service for booking
- Tour of dashboard features

#### Organization-Level Settings

**Business Configuration**
- **Business Hours**: Configurable per day of week (e.g., Mon-Fri 9AM-5PM)
- **Holidays/Blackout Dates**: Dates when booking is disabled
- **Timezone**: Organization's default timezone for all operations
- **Country/Region**: For compliance and localization

**Branding**
- **Logo**: Upload organization logo (displayed on booking page, emails)
- **Colors**: Primary and secondary brand colors
- **Custom Domain**: Optional CNAME for white-label (e.g., `booking.clientcompany.com`)
- **Email Templates**: Customize booking confirmations, reminders

**Billing & Subscription** (Future Module)
- Subscription tier (free/starter/professional/enterprise)
- Usage-based billing (SMS sent, appointments booked)
- Payment method management
- Invoice history

#### User Hierarchy & Roles

**Role Definitions**

| Role | Permissions |
|------|-------------|
| **Super Admin** (Platform) | Manage all organizations, view platform metrics, configure system settings |
| **Organization Admin** | Full access to organization settings, manage users, numbers, services, webhooks, billing |
| **Worker** | Access assigned SMS inbox, shared IVR inbox, manage own calendar, view/update customers |
| **Read-Only** (Future) | View-only access to reports and analytics |

**User Management**
- Admins can invite users via email
- Users receive invitation link to set password
- Assign role during invitation
- Enable/disable users without deleting
- Audit log of user actions

**Worker-Specific Settings**
- Assign phone numbers (one or more per worker)
- Set skills/tags for intelligent routing
- Configure personal availability overrides
- Enable/disable booking visibility

---

### 2. SMS Communication Portal

#### Phone Number Management

**Twilio Integration**
- **Number Purchase**: Admins search and buy numbers via Twilio API
  - Filter by country, area code, capabilities (SMS, Voice, MMS)
  - Display pricing information
  - Support for local and toll-free numbers
- **Number Assignment**:
  - Assign individual numbers to workers
  - One "IVR/General" number per organization (optional)
  - Unassigned number pool for future use
- **Number Configuration**:
  - Set inbound webhook URLs (handled by platform)
  - Configure status callback URLs
  - Enable/disable capabilities per number

**Number Types**
- **Worker Numbers**: Dedicated to individual workers; SMS routes to worker's inbox
- **IVR/General Number**: Shared inbox for triage by admins/workers
- **Pooled Numbers**: Available for assignment but not yet active

#### SMS Routing Engine

**Inbound Message Processing**
1. Twilio webhook receives SMS → `POST /webhooks/twilio/sms/inbound`
2. Verify Twilio signature for security
3. Lookup organization by `To` phone number
4. Lookup or create Customer by `From` phone number (within org)
5. Determine routing:
   - If `To` is a worker number → Route to worker's private inbox
   - If `To` is IVR number → Route to shared inbox
6. Create/update Thread (group messages by customer + channel)
7. Store Message record with metadata
8. Emit real-time notification via WebSocket to connected users
9. Return TwiML response to Twilio

**Routing Rules for IVR Inbox**
- **Round-Robin**: Assign to next available worker in rotation
- **Skill-Based**: Match customer tags/requirements to worker skills
- **Manual Assignment**: Admin/worker manually claims thread

**Outbound Message Sending**
1. Worker composes message in UI
2. Frontend calls `POST /api/v1/messages`
3. Backend validates worker owns `From` number
4. Enqueue message send job (async processing)
5. Worker picks job, calls Twilio API
6. Store sent message with Twilio SID
7. Twilio status callback updates message status (sent/delivered/failed)

#### Worker SMS Interface

**Inbox Features**
- **Thread View**: Messages grouped by customer contact
  - Show customer name, phone, last message timestamp
  - Badge for unread count
  - Filter: All, Unread, Open, Closed, Assigned to me
- **Conversation View**:
  - Full message history with customer
  - Sent/Delivered/Read status indicators
  - Support for MMS (images, videos)
  - Internal notes (not sent to customer)
- **Quick Actions**:
  - Quick reply templates (configurable by org)
  - Canned responses library
  - Assign/reassign thread
  - Add customer tags
  - Create appointment from conversation
  - Mark as spam/block number

**Shared IVR Inbox**
- Visible to all workers and admins
- Queue view showing unassigned threads
- Claim/assign functionality
- SLA indicators (e.g., "Reply within 15 minutes")
- Escalation rules (auto-assign if no response in X minutes)

#### Compliance & Opt-Out Management

**TCPA Compliance**
- Automatic handling of STOP, START, HELP keywords
- Maintain per-organization suppression list
- Block outbound messages to opted-out numbers
- Opt-in tracking (when and how consent was obtained)

**Data Retention**
- Configurable retention policy per organization (e.g., keep messages for 2 years)
- Soft delete vs. hard delete options
- Export functionality for compliance requests

#### MMS Support
- Upload images, videos, documents in conversation
- Preview media in message thread
- Store media in S3/Cloud Storage with signed URLs
- Respect Twilio MMS size limits (5MB)

---

### 3. Advanced Appointment Scheduling System

#### Customer-Facing Booking Portal

**Public Booking Page** (`https://{orgSlug}.domain.com`)

**Landing Page**
- Organization logo and branding
- Brief description of services
- Call-to-action: "Book an Appointment"
- SEO-friendly with meta tags, structured data
- Mobile-responsive and accessible (WCAG 2.1 AA)

**Booking Flow**

**Step 1: Select Service**
- Display list of active services with:
  - Service name and description
  - Duration (e.g., "30 minutes")
  - Price (optional, if configured)
  - Availability indicator
- Filter/search if many services
- Option to show "Any service" for flexible booking

**Step 2: Select Worker (Optional)**
- Show available workers for selected service
- Display worker name, photo (optional), bio
- Option for "First Available" (system picks based on earliest slot)
- If service allows specific workers only, enforce constraint

**Step 3: Pick Date & Time**
- Calendar view showing available dates (grayed out unavailable)
- Time slot picker with timezone indicator
- Detect customer's timezone (browser), allow manual override
- Show slots in customer's timezone but store in org timezone
- Real-time availability (check every 30s or on date change)
- Indicate buffer times, breaks as unavailable

**Step 4: Customer Details**
- Collect: Name, Email, Phone (required)
- Custom form fields configured by admin (e.g., "Reason for visit", "Special requests")
- Checkbox for consent (SMS reminders, terms of service)
- CAPTCHA (Google reCAPTCHA) to prevent bot bookings

**Step 5: Confirmation**
- Show booking summary (service, worker, date/time in customer's TZ)
- "Confirm Booking" button
- Upon confirmation:
  - Create Appointment record with status `pending`
  - Send confirmation SMS and/or email
  - Provide reschedule/cancel links (signed, time-limited tokens)
  - Option to add to calendar (ICS file download)

**Post-Booking**
- Thank you page with booking reference number
- Automated reminders (configurable: 24h, 2h before)
- Reschedule/Cancel self-service (if enabled by org)

#### Availability Engine

**Core Logic**
The availability engine determines which time slots are bookable based on:

1. **Organization Business Hours**
   - Default hours per day of week (e.g., Mon-Fri 9AM-5PM, closed weekends)
   - Stored as recurring rules (e.g., RRULE format or cron-like)

2. **Worker Availability Overrides**
   - Personal working hours (e.g., Worker A only works Tue/Thu)
   - One-off exceptions (e.g., out of office on specific date)
   - Vacation/time-off blocks

3. **Holidays and Blackout Dates**
   - Organization-wide closures (e.g., Christmas, New Year)
   - Emergency closures

4. **Service-Specific Settings**
   - Duration (e.g., 30 minutes)
   - Buffer before (e.g., 10 min setup)
   - Buffer after (e.g., 5 min cleanup)
   - Minimum lead time (e.g., bookings must be 2 hours in advance)
   - Maximum lead time (e.g., can only book up to 60 days out)

5. **Existing Appointments**
   - Check for conflicts with confirmed appointments
   - Prevent double-booking
   - Account for buffers

6. **Capacity Rules** (Future)
   - Group appointments (e.g., class with 10 slots)
   - Overbooking allowance

**Slot Generation Algorithm**
```
function generateAvailableSlots(date, serviceId, workerId?) {
  // 1. Get org business hours for this day of week
  // 2. Apply worker overrides if workerId specified, else all workers
  // 3. Subtract holidays/blackouts
  // 4. Generate candidate slots based on service duration + buffers
  // 5. Query existing appointments (including buffers)
  // 6. Filter out occupied slots
  // 7. Apply min/max lead time
  // 8. Return array of { startTime, endTime, workerId }
}
```

**Atomic Booking**
- When customer clicks "Confirm", perform slot availability check again
- Use MongoDB transaction or optimistic locking to prevent race conditions
- If slot now taken, show error and refresh availability

#### Administrative Scheduling Interface

**Calendar View (Inside App)**
- Day/Week/Month views (Material-UI or FullCalendar.js)
- Color-coded by service or worker
- Drag-and-drop to reschedule (admin only)
- Click appointment to view/edit details

**Appointment Management**
- **Create Manually**: Admin can book on behalf of customer
- **Edit**: Change date/time, service, worker, notes
- **Cancel**: Mark as canceled, optionally notify customer
- **No-Show**: Mark as no-show, affects customer history
- **Complete**: Mark as completed, add outcome notes
- **Reschedule**: Generate reschedule link or change directly

**Appointment Statuses**
- `pending`: Awaiting confirmation (if using confirmation flow)
- `confirmed`: Booked and confirmed
- `completed`: Appointment happened successfully
- `canceled`: Canceled by customer or admin
- `no_show`: Customer did not attend
- `rescheduled`: Links to new appointment record

**Block Time**
- Admin can block time slots (e.g., lunch break, meetings)
- Creates "blocker" appointment that shows in calendar
- Not customer-facing

#### Reminders & Notifications

**Reminder Configuration**
- Admin sets reminder schedule per organization
- Options: 24 hours before, 2 hours before, custom
- Channel: SMS (via Twilio), Email (future)
- Template customization with variables: `{customerName}`, `{dateTime}`, `{serviceName}`

**Reminder Sending**
- Background worker checks upcoming appointments every minute
- For each appointment needing reminder (based on time to appointment):
  - Fetch customer phone/email
  - Render template
  - Enqueue send job
  - Mark reminder as sent to prevent duplicates

**Reschedule/Cancel Links**
- Generate signed JWT with appointment ID and expiration
- Include in confirmation and reminder messages
- Customer clicks link → lands on self-service page
- Can pick new time (reschedule) or confirm cancellation
- Updates appointment, sends new confirmation

---

### 4. Unified CRM

#### Customer Profile Management

**Customer Record Structure**
- **Basic Info**: Name, email, phone (required), address (optional)
- **Consents**: SMS opt-in, email opt-in, timestamps
- **Tags**: Custom labels (e.g., "VIP", "Late Payer")
- **Custom Fields**: Extensible key-value pairs per org (e.g., "Preferred Language", "Account Number")
- **Lifetime Value Fields**: Total appointments, no-shows, revenue (future)
- **Merge History**: Track merged duplicate profiles

**Customer 360 View**
- **Header**: Name, contact info, tags, customer since date
- **Timeline**: Chronological feed of all interactions
  - SMS messages sent/received
  - Appointments (past, upcoming, canceled)
  - Notes added by workers
  - Status changes
- **Activity Metrics**:
  - Total appointments
  - No-show rate
  - Average response time
  - Engagement score
- **Actions**:
  - Send SMS
  - Create appointment
  - Add note
  - Edit details
  - Merge with another customer

**Customer Search & Filtering**
- Search by name, phone, email
- Filter by tags, date range, appointment status
- Bulk actions (add tag, export)

**Duplicate Detection & Merging**
- Fuzzy match on phone/email/name
- Admin reviews and merges duplicates
- Preserve all history from both records
- Mark old record as merged with reference to master

#### Communication History

**Unified Inbox**
- View all channels (SMS, future: email, voice calls) in one timeline
- Filter by channel, date, direction (inbound/outbound)
- Export conversation history (CSV, PDF)

**Internal Notes**
- Workers/admins can add private notes to customer profile
- Not visible to customer
- Tagged with author and timestamp
- Searchable

**Interaction Scoring**
- Track engagement metrics:
  - Message response rate
  - Appointment show rate
  - Average time to reply
- Use for prioritization or segmentation

---

### 5. Integration Capabilities

#### RESTful API

**Design Principles**
- **Versioned**: `/api/v1/...` (v1, v2, etc.)
- **Resource-Based**: `/organizations`, `/customers`, `/appointments`
- **HTTP Methods**: GET (read), POST (create), PUT/PATCH (update), DELETE (delete)
- **Status Codes**: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests, 500 Internal Server Error
- **Pagination**: Query params `?page=1&limit=20`; response includes `total`, `page`, `limit`, `data[]`
- **Filtering**: Query params like `?status=confirmed&service=abc123`
- **Sorting**: `?sort=createdAt:desc`

**Authentication**
- **API Keys**: Generate per organization, scoped to specific resources
- **OAuth 2.0**: For third-party integrations (future)
- **JWT in Header**: `Authorization: Bearer <token>`

**Rate Limiting**
- Per API key: 1000 requests/hour (configurable per tier)
- Per IP: 100 requests/15 minutes (burst protection)
- Return `429 Too Many Requests` with `Retry-After` header

**API Documentation**
- OpenAPI 3.0 specification
- Swagger UI at `/api/docs`
- Example requests/responses
- Postman collection for testing

**Key Endpoint Categories**

**Organizations**
- `GET /api/v1/organization` - Get current org details
- `PATCH /api/v1/organization` - Update org settings
- `GET /api/v1/organization/branding` - Get branding
- `POST /api/v1/organization/branding` - Update branding

**Users**
- `GET /api/v1/users` - List users
- `POST /api/v1/users` - Invite user
- `GET /api/v1/users/:id` - Get user
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Deactivate user

**Phone Numbers**
- `GET /api/v1/numbers` - List org's numbers
- `POST /api/v1/numbers/search` - Search available Twilio numbers
- `POST /api/v1/numbers` - Purchase number
- `PATCH /api/v1/numbers/:id` - Assign to worker
- `DELETE /api/v1/numbers/:id` - Release number

**Customers**
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id` - Get customer profile
- `PATCH /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer (soft)
- `POST /api/v1/customers/:id/merge` - Merge with another

**Messages**
- `GET /api/v1/messages` - List messages (with filters)
- `POST /api/v1/messages` - Send SMS
- `GET /api/v1/messages/:id` - Get message
- `GET /api/v1/threads/:id/messages` - Get thread messages

**Services**
- `GET /api/v1/services` - List services
- `POST /api/v1/services` - Create service
- `PATCH /api/v1/services/:id` - Update service
- `DELETE /api/v1/services/:id` - Deactivate service

**Appointments**
- `GET /api/v1/appointments` - List appointments
- `POST /api/v1/appointments` - Create appointment
- `GET /api/v1/appointments/:id` - Get appointment
- `PATCH /api/v1/appointments/:id` - Update appointment
- `DELETE /api/v1/appointments/:id` - Cancel appointment
- `POST /api/v1/appointments/:id/reschedule` - Reschedule
- `GET /api/v1/appointments/:id/ics` - Download ICS file

**Availability**
- `GET /api/v1/availability?date=YYYY-MM-DD&serviceId=...&workerId=...` - Get available slots

**Webhooks**
- `GET /api/v1/webhooks` - List webhook endpoints
- `POST /api/v1/webhooks` - Register endpoint
- `DELETE /api/v1/webhooks/:id` - Delete endpoint
- `GET /api/v1/webhooks/:id/deliveries` - Get delivery log
- `POST /api/v1/webhooks/:id/deliveries/:deliveryId/replay` - Replay event

**API Keys**
- `GET /api/v1/api-keys` - List API keys
- `POST /api/v1/api-keys` - Create API key
- `DELETE /api/v1/api-keys/:id` - Revoke API key

#### Webhooks System

**Event Types**
- `message.created` - New SMS received or sent
- `message.status.updated` - SMS delivery status changed
- `customer.created` - New customer profile created
- `customer.updated` - Customer profile updated
- `customer.merged` - Customers merged
- `appointment.created` - New appointment booked
- `appointment.updated` - Appointment modified
- `appointment.canceled` - Appointment canceled
- `appointment.rescheduled` - Appointment rescheduled
- `appointment.no_show` - Appointment marked no-show
- `thread.assigned` - Conversation assigned to worker
- `thread.updated` - Thread status changed

**Webhook Payload Format**
```json
{
  "id": "evt_abc123",
  "type": "appointment.created",
  "createdAt": "2025-10-21T10:00:00Z",
  "orgId": "org_xyz",
  "data": {
    "appointment": {
      "id": "apt_123",
      "serviceId": "svc_456",
      "workerId": "usr_789",
      "customerId": "cust_101",
      "startTime": "2025-10-25T14:00:00Z",
      "endTime": "2025-10-25T14:30:00Z",
      "status": "confirmed"
    }
  }
}
```

**Webhook Delivery**
- **HTTP POST** to registered endpoint URL
- **Headers**:
  - `Content-Type: application/json`
  - `X-Webhook-Signature: <HMAC-SHA256 signature>`
  - `X-Webhook-Id: <event ID>`
  - `X-Webhook-Timestamp: <timestamp>`
- **Signature Verification**: HMAC using webhook secret (provided on registration)
- **Retry Logic**:
  - Initial attempt immediate
  - If fails: retry after 1min, 5min, 15min, 1hr, 6hr (exponential backoff)
  - Max 5 retries
  - Mark as failed if all retries exhausted
- **Response Expectations**: 2xx status within 5 seconds
- **Idempotency**: Use `X-Webhook-Id` to deduplicate on receiver side

**Webhook Management UI**
- List registered endpoints with status (active/failed)
- View recent deliveries (success/failure, response code, payload)
- Replay individual events
- Rotate webhook secrets
- Test endpoint (send test event)

---

## Data Models

### MongoDB Collections

#### Organization
```javascript
{
  _id: ObjectId,
  name: String,              // "Acme Medical Clinic"
  slug: String,              // "acme-medical" (unique, URL-safe)
  email: String,             // Primary contact email
  phone: String,             // Optional org phone
  country: String,           // "US", "CA", etc.
  timezone: String,          // "America/New_York"
  status: String,            // "pending", "active", "suspended"

  businessHours: [
    { dayOfWeek: Number, start: String, end: String } // 0=Sun, "09:00", "17:00"
  ],

  holidays: [
    { date: ISODate, name: String }
  ],

  branding: {
    logo: String,            // URL to uploaded logo
    primaryColor: String,    // "#1976d2"
    secondaryColor: String,
    customDomain: String     // Optional CNAME
  },

  features: {
    ivrEnabled: Boolean,
    emailEnabled: Boolean,
    paymentsEnabled: Boolean
  },

  twilioConfig: {
    accountSid: String,      // Optional: org-specific Twilio subaccount
    authToken: String,       // Encrypted
    messagingServiceSid: String
  },

  ivrNumberId: ObjectId,     // Reference to PhoneNumber (if IVR enabled)

  subscription: {
    tier: String,            // "free", "starter", "professional", "enterprise"
    status: String,          // "active", "trial", "canceled"
    expiresAt: ISODate
  },

  compliance: {
    dataRetentionDays: Number, // Default 730 (2 years)
    gdprEnabled: Boolean
  },

  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### User
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,           // Tenant isolation
  email: String,             // Unique per org
  passwordHash: String,      // bcrypt

  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String           // URL
  },

  role: String,              // "admin", "worker"
  status: String,            // "invited", "active", "disabled"

  auth: {
    mfaEnabled: Boolean,
    mfaSecret: String,       // Encrypted TOTP secret
    lastLoginAt: ISODate,
    lastLoginIp: String
  },

  workerProfile: {           // Null if role != "worker"
    skills: [String],        // ["spanish", "senior-care"]
    bookingEnabled: Boolean,
    bio: String,
    availabilityOverrides: [
      { type: String, date: ISODate, start: String, end: String }
      // type: "available", "unavailable", "vacation"
    ]
  },

  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### PhoneNumber
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,

  twilioSid: String,         // Twilio Phone Number SID
  e164: String,              // "+15551234567"
  friendlyName: String,      // "(555) 123-4567"
  country: String,           // "US"
  type: String,              // "worker", "ivr", "pooled"

  assignedTo: ObjectId,      // UserId (if type="worker")

  capabilities: {
    sms: Boolean,
    mms: Boolean,
    voice: Boolean
  },

  status: String,            // "active", "released"

  purchasedAt: ISODate,
  releasedAt: ISODate,
  createdAt: ISODate
}
```

#### Customer
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,

  phone: String,             // E.164 format (unique per org)
  email: String,
  name: String,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },

  tags: [String],            // ["vip", "late-payer"]

  customFields: {            // Extensible key-value
    preferredLanguage: String,
    accountNumber: String
  },

  consents: {
    smsOptIn: { granted: Boolean, at: ISODate },
    emailOptIn: { granted: Boolean, at: ISODate }
  },

  stats: {
    totalAppointments: Number,
    noShows: Number,
    lifetimeValue: Number    // Future: revenue
  },

  mergedInto: ObjectId,      // If merged, points to master customer
  mergedIds: [ObjectId],     // IDs that were merged into this one

  createdBy: ObjectId,       // UserId
  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Thread
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  customerId: ObjectId,

  channel: String,           // "sms" (future: "email", "voice")

  assignedTo: ObjectId,      // UserId (worker), null if unassigned
  assignedAt: ISODate,

  status: String,            // "open", "closed", "spam"
  tags: [String],

  lastMessageAt: ISODate,
  lastMessagePreview: String,
  unreadCount: Number,       // For assigned worker

  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Message
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  threadId: ObjectId,
  customerId: ObjectId,

  direction: String,         // "inbound", "outbound"
  from: String,              // E.164 phone
  to: String,                // E.164 phone

  body: String,              // Message text
  media: [
    { url: String, contentType: String, size: Number }
  ],

  twilioSids: {
    messageSid: String,
    accountSid: String
  },

  status: String,            // "queued", "sent", "delivered", "failed", "undelivered"
  errorCode: Number,
  errorMessage: String,

  workerId: ObjectId,        // User who sent (if outbound)
  read: Boolean,             // Read status
  readAt: ISODate,

  metadata: {
    cost: Number,            // Twilio cost
    segments: Number         // SMS segments
  },

  createdAt: ISODate,
  updatedAt: ISODate
}

// Index: { orgId: 1, threadId: 1, createdAt: -1 }
// Index: { orgId: 1, customerId: 1 }
```

#### Service
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,

  name: String,              // "30-Minute Consultation"
  description: String,

  durationMinutes: Number,   // 30
  bufferBefore: Number,      // 10 (minutes)
  bufferAfter: Number,       // 5

  price: {
    amount: Number,          // Optional: 50.00
    currency: String         // "USD"
  },

  location: String,          // "In-person" or "Virtual"

  active: Boolean,

  bookingSettings: {
    minLeadTimeHours: Number,   // Minimum advance booking (e.g., 2)
    maxLeadTimeDays: Number,    // Max days in future (e.g., 60)
    allowedWorkers: [ObjectId]  // Empty = all workers
  },

  displayOrder: Number,

  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### Appointment
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,

  serviceId: ObjectId,
  workerId: ObjectId,
  customerId: ObjectId,

  startTime: ISODate,
  endTime: ISODate,          // Calculated from service duration

  status: String,            // "pending", "confirmed", "completed", "canceled", "no_show", "rescheduled"

  customerInfo: {            // Captured at booking (may differ from customer record)
    name: String,
    email: String,
    phone: String,
    customFields: {}
  },

  notes: String,             // Internal notes
  outcomeNotes: String,      // Post-appointment notes

  rescheduleToken: String,   // JWT for self-service reschedule
  cancelToken: String,       // JWT for self-service cancel
  tokensExpireAt: ISODate,

  reminders: [
    { sentAt: ISODate, type: String, channel: String }
    // type: "24h", "2h", etc.
  ],

  rescheduledFrom: ObjectId, // Previous appointment ID
  rescheduledTo: ObjectId,   // New appointment ID

  createdBy: ObjectId,       // UserId or "system" (if booked via public portal)
  createdAt: ISODate,
  updatedAt: ISODate
}

// Index: { orgId: 1, workerId: 1, startTime: 1 }
// Index: { orgId: 1, customerId: 1 }
// Index: { orgId: 1, startTime: 1, status: 1 }
```

#### AvailabilityRule
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  workerId: ObjectId,        // Null = org-wide rule

  type: String,              // "businessHours", "override", "holiday", "vacation"

  recurrence: {
    // For recurring rules (e.g., business hours)
    rrule: String,           // iCalendar RRULE format
    // OR simplified:
    daysOfWeek: [Number],    // [1,2,3,4,5] for Mon-Fri
    startTime: String,       // "09:00"
    endTime: String          // "17:00"
  },

  dateRange: {
    // For one-off rules
    start: ISODate,
    end: ISODate
  },

  available: Boolean,        // true = available, false = blocked

  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### WebhookEndpoint
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,

  url: String,               // "https://client.com/webhook"
  secret: String,            // For HMAC signature (encrypted)

  events: [String],          // ["appointment.created", "message.received"] or ["*"]

  status: String,            // "active", "disabled"

  lastDeliveryAt: ISODate,
  lastDeliveryStatus: String, // "success", "failed"

  createdAt: ISODate,
  updatedAt: ISODate
}
```

#### WebhookDelivery
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,
  webhookEndpointId: ObjectId,

  eventType: String,
  eventId: String,           // Unique event ID (for idempotency)

  payload: {},               // Full event payload

  attempts: [
    {
      attemptedAt: ISODate,
      responseStatus: Number,
      responseBody: String,
      duration: Number         // ms
    }
  ],

  status: String,            // "pending", "delivered", "failed"
  nextRetryAt: ISODate,

  createdAt: ISODate
}

// TTL index to expire old deliveries after 30 days
```

#### AuditLog
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,

  actor: {
    userId: ObjectId,        // Or "system" for automated actions
    email: String,
    role: String
  },

  action: String,            // "create", "update", "delete", "login", "assign", etc.
  entityType: String,        // "customer", "appointment", "user", "message"
  entityId: ObjectId,

  changes: {                 // For updates, store before/after
    before: {},
    after: {}
  },

  metadata: {
    ip: String,
    userAgent: String,
    method: String,          // "API", "UI", "Webhook"
    requestId: String
  },

  createdAt: ISODate
}

// Index: { orgId: 1, createdAt: -1 }
// Index: { orgId: 1, entityType: 1, entityId: 1 }
```

#### ApiKey
```javascript
{
  _id: ObjectId,
  orgId: ObjectId,

  name: String,              // "Production Integration"
  keyHash: String,           // SHA-256 of actual key (only shown once on creation)
  keyPrefix: String,         // First 8 chars for identification

  scopes: [String],          // ["customers:read", "appointments:write", "messages:read"]

  status: String,            // "active", "revoked"

  rateLimit: {
    requestsPerHour: Number
  },

  lastUsedAt: ISODate,
  expiresAt: ISODate,

  createdBy: ObjectId,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

---

## API Specifications

### Authentication Flow

#### User Registration
```
POST /api/v1/auth/register
Body: { email, password, organizationName, country, timezone }
Response: { userId, orgId, message: "Verification email sent" }
```

#### Email Verification
```
GET /api/v1/auth/verify-email?token=<JWT>
Response: { success: true, message: "Email verified" }
```

#### Login
```
POST /api/v1/auth/login
Body: { email, password, mfaCode? }
Response: {
  accessToken: "jwt...",
  refreshToken: "jwt...",
  user: { id, email, role, orgId, orgSlug }
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh
Body: { refreshToken }
Response: { accessToken }
```

#### Password Reset
```
POST /api/v1/auth/forgot-password
Body: { email }
Response: { message: "Reset link sent" }

POST /api/v1/auth/reset-password
Body: { token, newPassword }
Response: { message: "Password reset successful" }
```

### Error Response Format

All API errors return consistent structure:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": [
      { "field": "email", "message": "Must be a valid email" }
    ],
    "requestId": "req_abc123"
  }
}
```

**Error Codes**
- `VALIDATION_ERROR` - Input validation failed (400)
- `UNAUTHORIZED` - Authentication required (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `CONFLICT` - Resource conflict (e.g., duplicate) (409)
- `RATE_LIMIT_EXCEEDED` - Too many requests (429)
- `INTERNAL_ERROR` - Server error (500)
- `EXTERNAL_SERVICE_ERROR` - Twilio/external service error (502)

### Pagination

All list endpoints support pagination:
```
GET /api/v1/customers?page=2&limit=50

Response:
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 523,
    "totalPages": 11,
    "hasNext": true,
    "hasPrev": true
  }
}
```

### Filtering & Sorting

**Filtering**
```
GET /api/v1/appointments?status=confirmed&workerId=usr_123&startDate=2025-10-21
```

**Sorting**
```
GET /api/v1/customers?sort=createdAt:desc,name:asc
```

---

## Security & Compliance

### Authentication & Authorization

#### JWT Implementation
- **Access Token**: Short-lived (15 minutes), contains user ID, org ID, role
- **Refresh Token**: Long-lived (7 days), stored in httpOnly cookie or secure storage, rotated on use
- **Claims**: `{ userId, orgId, orgSlug, role, iat, exp }`
- **Signing**: RS256 (asymmetric keys) for production

#### Multi-Factor Authentication (MFA)
- TOTP-based (Google Authenticator, Authy)
- QR code generation on enrollment
- Backup codes (one-time use)
- Enforce MFA for admins (configurable)

#### Role-Based Access Control (RBAC)

**Permission Matrix**

| Resource | Admin | Worker |
|----------|-------|--------|
| Organization settings | Full | Read |
| Users | Create, Read, Update, Delete | Read (self only) |
| Phone numbers | Full | Read (assigned) |
| Customers | Full | Full |
| Messages | Full (all) | Full (assigned threads) |
| Appointments | Full | Read/Update (assigned) |
| Services | Full | Read |
| Webhooks | Full | None |
| API Keys | Full | None |

**Middleware Implementation**
```javascript
// Protect routes with role check
router.post('/users', authenticate, authorize(['admin']), createUser);

// Tenant isolation
router.get('/customers', authenticate, tenantScope, listCustomers);
// tenantScope middleware: adds { orgId: req.user.orgId } to query
```

### Data Protection

#### Encryption
- **At Rest**: MongoDB Atlas field-level encryption for PII (phone, email, addresses)
- **In Transit**: TLS 1.3 for all connections (API, database, Twilio)
- **Secrets**: Environment variables encrypted with KMS (AWS KMS, GCP Secret Manager)

#### Sensitive Data Handling
- **Password**: bcrypt with 12 rounds
- **API Keys**: SHA-256 hash stored; plaintext shown only once on creation
- **Webhook Secrets**: Encrypted in DB; used for HMAC signature
- **Twilio Credentials**: Encrypted; never logged or exposed in responses

#### GDPR Compliance
- **Right to Access**: Export customer data via API
- **Right to Erasure**: Hard delete customer (cascade messages, appointments)
- **Right to Portability**: JSON/CSV export of all customer data
- **Consent Tracking**: Timestamp and method of consent capture
- **Data Retention**: Configurable auto-purge after X days (default 730)

#### TCPA/SMS Compliance
- **Opt-In Tracking**: Record when and how SMS consent obtained
- **Opt-Out Handling**: Auto-respond to STOP with confirmation; suppress future messages
- **Quiet Hours**: Do not send SMS outside 8AM-9PM recipient local time (configurable)
- **Content Restrictions**: Disallow prohibited content (profanity filters, etc.)

### Security Best Practices

#### Input Validation
- Validate all input with Zod/Joi schemas
- Sanitize HTML/SQL to prevent injection
- Enforce max length, type, format
- Reject unexpected fields

#### Rate Limiting
- API endpoints: 1000 req/hour per API key
- Public booking: 10 bookings/hour per IP
- Auth endpoints: 5 login attempts/15 min per IP
- Twilio webhooks: unlimited (but verify signature)

#### CORS & CSRF
- CORS: Allowlist organization subdomains
- CSRF: Synchronizer token for cookie-based auth
- SameSite cookies (Strict/Lax)

#### Headers Security
- Use `helmet.js` middleware
- CSP, HSTS, X-Frame-Options, etc.

#### Audit Logging
- Log all CRUD operations on sensitive resources
- Log auth events (login, logout, MFA, password reset)
- Log permission changes
- Store IP, user agent, timestamp
- Retention: 1 year minimum

#### Penetration Testing
- Annual third-party pen tests
- Automated scans (OWASP ZAP, Burp Suite)
- Dependency vulnerability scanning (Snyk, npm audit)

---

## Deployment & Infrastructure

### Environment Setup

#### Local Development
**Docker Compose**
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo-data:/data/db"]

  redis:
    image: redis:7
    ports: ["6379:6379"]

  api:
    build: ./api
    ports: ["5000:5000"]
    env_file: .env.local
    depends_on: [mongodb, redis]

  web:
    build: ./web
    ports: ["3000:3000"]
    env_file: .env.local

  worker:
    build: ./workers
    env_file: .env.local
    depends_on: [mongodb, redis]

volumes:
  mongo-data:
```

**Environment Variables** (`.env.local`)
```bash
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/sms-calendar-dev
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=<random-string>
JWT_REFRESH_SECRET=<random-string>

# Twilio
TWILIO_ACCOUNT_SID=<test-sid>
TWILIO_AUTH_TOKEN=<test-token>
TWILIO_WEBHOOK_BASE_URL=https://<ngrok-url>

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

**Webhook Tunneling**
```bash
# Use ngrok to expose local server to Twilio
ngrok http 5000
# Update TWILIO_WEBHOOK_BASE_URL with ngrok URL
```

#### Staging Environment
- **Hosting**: AWS/GCP/Azure
- **Database**: MongoDB Atlas M10 cluster (staging)
- **Redis**: Managed Redis (ElastiCache, MemoryStore)
- **Containers**: ECS/GKE/AKS
- **Domain**: `staging.domain.com`, `*.staging.domain.com`
- **Monitoring**: Basic logging, error tracking

#### Production Environment
**Infrastructure**
- **Compute**: Kubernetes (EKS, GKE, AKS) or managed containers
- **Database**: MongoDB Atlas M30+ with replica sets, auto-backups, point-in-time recovery
- **Cache/Queue**: Managed Redis cluster with persistence
- **Load Balancer**: Application Load Balancer with SSL termination
- **CDN**: CloudFlare for static assets, edge caching
- **Object Storage**: S3/GCS for media files (MMS images, logos)
- **DNS**: Route 53/Cloud DNS with wildcard A record for subdomains

**Scaling**
- **Horizontal**: Auto-scale API pods based on CPU (target 70%)
- **Database**: Sharding for multi-tenant data (shard key: `orgId`)
- **Redis**: Cluster mode for distributed cache
- **Background Workers**: Separate worker pools for different job types (SMS, reminders, webhooks)

**High Availability**
- **Multi-AZ**: Deploy across 3 availability zones
- **Database Replica Set**: 3-node MongoDB with automatic failover
- **Health Checks**: Liveness/readiness probes for containers
- **Circuit Breaker**: For Twilio API calls (fail fast if Twilio down)

### CI/CD Pipeline

**Git Workflow**
- **Branches**: `main` (production), `staging`, `feature/*`
- **Pull Requests**: Required reviews, automated checks
- **Commits**: Conventional commits (feat, fix, docs, etc.)

**Pipeline Stages**
1. **Lint & Format**: ESLint, Prettier
2. **Type Check**: TypeScript
3. **Unit Tests**: Jest (>80% coverage)
4. **Integration Tests**: API tests with test DB
5. **Build**: Docker images for api, web, workers
6. **Security Scan**: Trivy for container vulnerabilities, npm audit
7. **Deploy to Staging**: On merge to `staging` branch
8. **E2E Tests**: Playwright tests against staging
9. **Deploy to Production**: On merge to `main` (manual approval)

**Deployment Strategy**
- **Blue-Green**: Maintain two production environments; switch traffic
- **Canary**: Route 10% traffic to new version, monitor, then 100%
- **Rollback**: Automated rollback if error rate spikes

### Monitoring & Observability

#### Application Performance Monitoring (APM)
- **Tool**: Datadog, New Relic, or Elastic APM
- **Metrics**:
  - Request rate, latency (p50, p95, p99)
  - Error rate (4xx, 5xx)
  - Database query performance
  - External API latency (Twilio)
  - Queue depth and processing time

#### Logging
- **Centralized**: ELK stack (Elasticsearch, Logstash, Kibana) or CloudWatch Logs
- **Structured**: JSON format with correlation IDs
- **Levels**: DEBUG (dev), INFO (staging/prod), WARN, ERROR
- **Retention**: 30 days hot, 1 year archive

#### Error Tracking
- **Tool**: Sentry
- **Captures**: Unhandled exceptions, API errors, frontend errors
- **Context**: User ID, org ID, request ID, stack trace
- **Alerts**: Slack/email on new error or spike

#### Uptime Monitoring
- **Tool**: Pingdom, UptimeRobot
- **Checks**: API health endpoint (`/health`), public booking page
- **SLA Target**: 99.9% uptime (43 minutes downtime/month)
- **Alerts**: PagerDuty for critical incidents

#### Dashboards
- **Operational**: Request rate, error rate, latency, DB connections
- **Business**: Appointments booked (today/week/month), SMS sent, active orgs
- **Twilio**: SMS delivery rate, cost, failures by error code

### Backup & Disaster Recovery

**MongoDB Backups**
- **Automated**: Daily snapshots via MongoDB Atlas
- **Point-in-Time Recovery**: Up to 7 days
- **Testing**: Monthly restore drills to staging

**Redis**
- **Persistence**: RDB snapshots every 5 minutes
- **AOF**: Append-only file for durability
- **Acceptable Loss**: Up to 5 minutes of queue data (jobs will retry)

**Disaster Recovery Plan**
1. **Detect**: Monitoring alerts on service degradation
2. **Assess**: Incident commander determines severity
3. **Communicate**: Status page update, customer notifications
4. **Restore**:
   - Database: Restore from latest snapshot
   - Application: Rollback to previous stable version
   - DNS: Failover to backup region (if multi-region)
5. **Post-Mortem**: Root cause analysis, action items

**RTO/RPO Targets**
- **Recovery Time Objective (RTO)**: 1 hour (time to restore service)
- **Recovery Point Objective (RPO)**: 5 minutes (acceptable data loss)

---

## Testing Strategy

### Testing Pyramid

#### Unit Tests (70% coverage target)
- **Scope**: Individual functions, utilities, business logic
- **Tools**: Jest, Mocha
- **Examples**:
  - `calculateAvailableSlots()` - various date/worker/service combinations
  - `validatePhoneNumber()` - E.164 format validation
  - `hashApiKey()` - cryptographic functions
  - React components (isolated with mocks)

#### Integration Tests (20% coverage)
- **Scope**: API endpoints with test database
- **Tools**: Supertest, Jest
- **Setup**: Seed test data before each suite, teardown after
- **Examples**:
  - `POST /api/v1/messages` - Send SMS, verify DB insert, Twilio API called
  - `POST /api/v1/appointments` - Create appointment, check availability logic
  - `GET /api/v1/customers/:id` - Fetch customer with relations (messages, appointments)

#### End-to-End Tests (10% coverage)
- **Scope**: Critical user flows through full stack
- **Tools**: Playwright, Cypress
- **Environment**: Staging
- **Examples**:
  - User registration → email verify → login → create organization
  - Customer books appointment → receives confirmation SMS
  - Worker sends SMS → customer receives → replies → worker sees in inbox
  - Admin purchases Twilio number → assigns to worker → worker can send

### Test Data Management
- **Factories**: Use libraries like Faker.js for realistic test data
- **Fixtures**: Predefined datasets for consistent testing
- **Isolation**: Each test creates/destroys own data; no shared state
- **Twilio Mocks**: Use Twilio test credentials or mock Twilio API in unit tests

### Continuous Testing
- **Pre-commit Hooks**: Lint, type-check, unit tests (husky + lint-staged)
- **PR Checks**: All tests must pass before merge
- **Nightly Builds**: Full E2E suite against staging
- **Load Testing**: Simulate 1000 concurrent users (k6, JMeter) quarterly

### Test Coverage Goals
- **Backend**: >80% line coverage
- **Frontend**: >70% component coverage
- **Critical Paths**: 100% coverage (auth, payment flows, SMS sending, booking)

---

## Extensibility & Future Modules

### Plugin Architecture

**Design Principles**
- **Modular**: Each feature as independent module (e.g., `@app/payments`, `@app/email`)
- **Dependency Injection**: Core services injectable into modules
- **Event-Driven**: Modules subscribe to events (e.g., `appointment.created`)
- **Configuration**: Modules registered in config, enabled per organization

**Module Structure**
```
/modules
  /payments
    /api        - API routes for payments
    /models     - Payment, Invoice schemas
    /services   - Stripe integration
    /hooks      - Event listeners
    index.js    - Module entry, exports routes/hooks
```

**Module Registry**
```javascript
// server.js
const modules = [
  require('./modules/sms'),
  require('./modules/appointments'),
  require('./modules/payments'),  // Optional module
  require('./modules/email')       // Optional module
];

modules.forEach(mod => {
  if (mod.routes) app.use('/api/v1', mod.routes);
  if (mod.hooks) eventBus.register(mod.hooks);
  if (mod.init) mod.init(services); // Dependency injection
});
```

### Planned Future Modules

#### 1. Payment Processing
- **Stripe Integration**: Collect payment at booking or on completion
- **Invoicing**: Generate invoices, send via email
- **Subscriptions**: Recurring appointments with auto-billing
- **Reporting**: Revenue reports, payment analytics

#### 2. Email Communication
- **SendGrid/AWS SES**: Send emails for confirmations, reminders
- **Templates**: Customizable email templates per organization
- **Email Inbox**: Two-way email conversations (like SMS inbox)
- **Unified Comms**: Email + SMS in one timeline

#### 3. Video Consultation
- **Twilio Video API**: Launch video calls from appointment
- **Zoom/Google Meet Integration**: Auto-create meeting links
- **Recording**: Store video recordings (with consent)
- **Waiting Room**: Virtual waiting room for patients

#### 4. Advanced Analytics
- **Dashboards**: Customizable charts (appointments over time, SMS volume, conversion rates)
- **Reports**: Export CSV/PDF reports
- **Insights**: AI-powered insights (peak booking times, customer churn risk)
- **Worker Performance**: Response time, customer satisfaction

#### 5. Inventory Management
- **Resources**: Manage rooms, equipment availability
- **Booking Conflicts**: Prevent booking if resource unavailable
- **Maintenance Schedule**: Block resources for maintenance

#### 6. Staff Scheduling & Payroll
- **Shift Management**: Create shifts, assign workers
- **Time Tracking**: Clock in/out, integrate with appointments
- **Payroll Integration**: Export hours to payroll systems (Gusto, ADP)

#### 7. AI Chatbot
- **Appointment Booking**: Customers book via chat on website
- **FAQ Automation**: Answer common questions
- **Sentiment Analysis**: Flag negative customer interactions for review

#### 8. Multi-Channel Communication
- **WhatsApp Business**: Send/receive via WhatsApp (Twilio)
- **Facebook Messenger**: Integrate with Facebook pages
- **Web Chat**: Embedded chat widget for website

### Feature Flags
- Use LaunchDarkly or custom feature flag system
- Enable/disable modules per organization
- Gradual rollout of new features
- A/B testing capabilities

---

## Development Workflow

### Repository Structure

```
/saas-sms-calendar
  /api                    - Backend (Express.js)
    /src
      /config             - Configuration files
      /middleware         - Auth, RBAC, error handling
      /routes             - API route definitions
      /controllers        - Request handlers
      /services           - Business logic
      /models             - Mongoose schemas
      /utils              - Helper functions
      /workers            - Background job processors
      /validators         - Zod/Joi schemas
    /tests
    package.json
    Dockerfile

  /web                    - Frontend (React)
    /src
      /components         - Reusable UI components
      /pages              - Page components
      /hooks              - Custom React hooks
      /store              - Redux/RTK Query
      /utils
      /styles
    /public
    package.json
    Dockerfile

  /workers                - Background workers (separate service)
    /src
      /jobs               - Job definitions (SMS sender, reminder scheduler)
      /processors
    package.json
    Dockerfile

  /infra                  - Infrastructure as code
    /terraform
    /k8s

  /docs                   - Documentation
    API.md
    DEPLOYMENT.md
    CONTRIBUTING.md

  docker-compose.yml
  .env.example
  README.md
```

### Git Workflow

**Branching Strategy**
- `main` - Production-ready code
- `staging` - Pre-production testing
- `feature/<name>` - New features
- `bugfix/<name>` - Bug fixes
- `hotfix/<name>` - Urgent production fixes

**Commit Convention**
```
type(scope): subject

body (optional)

footer (optional)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(appointments): add reschedule self-service flow
fix(sms): handle Twilio webhook signature verification error
docs(api): update webhook payload examples
```

**Pull Request Process**
1. Create feature branch from `staging`
2. Develop and commit with conventional messages
3. Push and open PR to `staging`
4. Automated checks run (lint, tests, build)
5. Request review from 1+ team members
6. Address feedback, update PR
7. Approve and merge (squash commits)
8. Delete feature branch

### Code Quality Standards

**Linting**
- ESLint for JavaScript/TypeScript
- Prettier for formatting
- Husky pre-commit hooks

**Code Review Checklist**
- [ ] Follows naming conventions
- [ ] Includes unit tests (>80% coverage for new code)
- [ ] Error handling implemented
- [ ] Input validation present
- [ ] No hardcoded secrets or config
- [ ] Comments for complex logic
- [ ] API changes documented
- [ ] Database migrations included (if schema changes)

**Documentation**
- Inline JSDoc comments for functions
- README per module
- API endpoints documented in OpenAPI spec
- Architecture decision records (ADRs) for major changes

---

## Acceptance Criteria

### Must-Have for v1.0 Launch

#### Multi-Tenancy
- [ ] User can register and create organization
- [ ] Unique subdomain provisioned (`orgslug.domain.com`)
- [ ] Subdomain routing works (frontend + API)
- [ ] Data isolation enforced (no cross-tenant data access)
- [ ] Org admin can customize branding (logo, colors)

#### User Management
- [ ] Admin can invite users with roles (admin, worker)
- [ ] Email verification flow works
- [ ] JWT authentication with refresh tokens
- [ ] RBAC enforces permissions (admins see all, workers see assigned)
- [ ] MFA available for login

#### SMS Portal
- [ ] Admin can search and purchase Twilio numbers
- [ ] Admin can assign numbers to workers
- [ ] Worker sees private inbox filtered by their number
- [ ] Inbound SMS routes correctly (worker inbox vs. IVR inbox)
- [ ] Worker can send SMS from their number
- [ ] Message status updates (sent, delivered, failed)
- [ ] Conversation threading by customer works
- [ ] Shared IVR inbox allows assign/reassign
- [ ] STOP/START opt-out handling functional

#### CRM
- [ ] Customer profiles auto-created on first SMS
- [ ] Customer 360 view shows messages + appointments
- [ ] Search customers by name, phone, email
- [ ] Add tags and custom fields to customers
- [ ] Merge duplicate customer profiles

#### Appointment Scheduling
- [ ] Public booking page displays at `orgslug.domain.com`
- [ ] Customer can select service, worker, date/time
- [ ] Availability engine respects business hours, holidays, existing appointments
- [ ] Booking creates appointment record
- [ ] Confirmation SMS sent automatically
- [ ] Reminders sent at configured intervals (24h, 2h before)
- [ ] Reschedule/cancel links work (self-service)
- [ ] Admin calendar view shows all appointments
- [ ] Workers see their assigned appointments
- [ ] Manual appointment creation by admin works

#### APIs & Webhooks
- [ ] RESTful API with authentication (JWT, API keys)
- [ ] Rate limiting enforced
- [ ] Webhook endpoints can be registered
- [ ] Webhook events delivered with retries
- [ ] HMAC signature verification for webhooks
- [ ] API documentation (Swagger) accessible

#### Security & Compliance
- [ ] All connections use HTTPS/TLS
- [ ] Passwords hashed with bcrypt
- [ ] Input validation on all endpoints
- [ ] Audit logs capture sensitive actions
- [ ] GDPR: Customer data export and hard delete available
- [ ] TCPA: Opt-out suppression list active

#### Infrastructure
- [ ] Local dev environment runs via Docker Compose
- [ ] Staging environment deployed and accessible
- [ ] Production environment configured (even if not public)
- [ ] CI/CD pipeline runs tests and deploys
- [ ] Error tracking (Sentry) active
- [ ] Basic monitoring (uptime, error rate) in place

### Nice-to-Have (Post-v1.0)
- [ ] Email notifications (in addition to SMS)
- [ ] Payment processing for paid services
- [ ] Video consultation integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-language support (i18n)
- [ ] Custom domain white-labeling (CNAME)

---

## Deliverables

### Code Deliverables
1. **Monorepo** with organized structure (`/api`, `/web`, `/workers`)
2. **API Service**: Fully functional Express.js backend
3. **Frontend Application**: React + Material UI with responsive design
4. **Background Workers**: SMS sender, reminder scheduler, webhook dispatcher
5. **Database Schemas**: Mongoose models with indexes and validations
6. **Docker Configuration**: `docker-compose.yml` for local dev, Dockerfiles per service
7. **Environment Templates**: `.env.example` files with all required variables

### Documentation Deliverables
1. **README.md**: Project overview, quick start, architecture overview
2. **API Documentation**: OpenAPI 3.0 spec, hosted Swagger UI
3. **Deployment Guide**: Step-by-step for staging and production
4. **Developer Guide**: Setup, development workflow, testing, contributing
5. **User Manual**: For org admins and workers (how to use the platform)
6. **Runbooks**:
   - Onboarding a new organization
   - Configuring Twilio numbers
   - Responding to incidents
   - Database backup/restore procedures

### Testing Deliverables
1. **Test Suite**: Unit, integration, E2E tests with >80% coverage
2. **Postman Collection**: API endpoints with example requests
3. **Test Data Seeds**: Scripts to populate test database

### Infrastructure Deliverables
1. **Terraform/CloudFormation**: Infrastructure as code for cloud resources
2. **Kubernetes Manifests**: Deployment, service, ingress configs
3. **CI/CD Pipelines**: GitHub Actions/Jenkins workflows
4. **Monitoring Dashboards**: Pre-configured Grafana/Datadog dashboards

### Training Deliverables (Optional)
1. **Video Walkthrough**: Demo of key features
2. **Admin Training**: How to manage organization, users, settings
3. **Worker Training**: How to use SMS inbox, manage appointments
4. **Developer Onboarding**: Video or doc for new developers joining the team

---

## Timeline & Milestones (Example)

**Phase 1: Foundation (Weeks 1-4)**
- Setup repository, dev environment, CI/CD
- Implement authentication (register, login, JWT)
- Build multi-tenant data model and middleware
- Create basic org admin dashboard

**Phase 2: SMS Portal (Weeks 5-8)**
- Twilio integration (purchase, assign numbers, webhooks)
- Message sending/receiving
- Inbox UI (worker, IVR)
- Threading and routing logic
- Opt-out compliance

**Phase 3: CRM (Weeks 9-10)**
- Customer profiles and 360 view
- Search, tags, custom fields
- Merge duplicates

**Phase 4: Scheduling (Weeks 11-14)**
- Service and availability models
- Availability engine
- Public booking page UI
- Booking flow and confirmation
- Reminder system
- Admin calendar view

**Phase 5: APIs & Integrations (Weeks 15-16)**
- RESTful API endpoints
- API key management
- Webhooks system (register, deliver, retry)
- API documentation

**Phase 6: Security & Compliance (Weeks 17-18)**
- MFA implementation
- Audit logging
- GDPR features (export, delete)
- Security hardening (rate limiting, CORS, headers)
- Penetration testing

**Phase 7: Deployment & Testing (Weeks 19-20)**
- Staging deployment
- Full E2E test suite
- Load testing
- Production deployment
- Monitoring setup

**Phase 8: Polish & Launch (Weeks 21-22)**
- Bug fixes from testing
- User documentation
- Marketing site
- Soft launch to beta customers
- Collect feedback, iterate

**Total Estimated Time**: 5-6 months with a team of 3-4 developers

---

## Success Metrics

### Technical Metrics
- **Uptime**: 99.9%+
- **API Latency**: p95 < 500ms
- **SMS Delivery Rate**: >98%
- **Error Rate**: <1% of requests
- **Test Coverage**: >80%

### Business Metrics
- **Organizations**: 100+ active orgs in first 3 months
- **Appointments Booked**: 10,000+ in first 6 months
- **SMS Volume**: 1M+ messages in first year
- **Customer Satisfaction**: NPS >50
- **Retention**: 90% month-over-month retention

### User Experience Metrics
- **Booking Completion Rate**: >80% of started bookings complete
- **Average Booking Time**: <2 minutes
- **Worker Response Time**: <5 minutes median
- **Customer Support Tickets**: <5% of users per month

---

## Conclusion

This project represents a comprehensive, enterprise-grade SaaS platform that combines SMS communication and appointment scheduling in a multi-tenant architecture. With careful attention to security, scalability, user experience, and extensibility, this system is designed to serve organizations of all sizes while maintaining the flexibility to grow and adapt to future needs.

The modular architecture ensures that new features can be added without disrupting core functionality, while the API-first approach enables seamless integrations with third-party tools. By following industry best practices for authentication, data protection, and compliance, the platform is positioned to meet the needs of enterprises in regulated industries.

Success depends on rigorous testing, comprehensive documentation, and continuous monitoring and improvement based on real-world usage and customer feedback.

---

**Document Version**: 1.0
**Last Updated**: 2025-10-21
**Maintained By**: Development Team
**Next Review**: Monthly during development, quarterly post-launch
