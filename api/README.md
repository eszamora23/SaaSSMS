# SaaS SMS Calendar - API Server

Enterprise-grade backend API for the SMS Contact Center & Appointment Scheduling SaaS platform.

## Project Status

✅ **Completed:**
- Project structure and directory layout
- Package.json with all required dependencies
- Environment configuration (.env.example)
- Utility functions (logger, errors, asyncHandler, tokens, dates, phone, pagination)
- Database connection (MongoDB with Mongoose)
- Redis connection for caching and queues
- Core Mongoose Models:
  - Organization (multi-tenant organizations)
  - User (admins and workers with authentication)
  - Customer (CRM contacts with opt-in tracking)
  - Message (SMS messages)
  - Service (bookable services)
  - Appointment (scheduled appointments)

🚧 **In Progress:**
- Additional models (PhoneNumber, Thread, WebhookEndpoint, etc.)
- Middleware implementation
- Authentication services and controllers
- API routes and controllers
- Twilio integration
- Socket.io real-time features
- Background workers and job queues

## Quick Start

### Prerequisites
- Node.js 18+ and npm 9+
- MongoDB (local or MongoDB Atlas)
- Redis
- Twilio account (for SMS features)

### Installation

1. **Install dependencies:**
```bash
cd api
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

3. **Start MongoDB and Redis** (if running locally):
```bash
# Using Docker Compose (recommended)
docker-compose up -d mongodb redis

# Or start manually
mongod --dbpath ./data/db
redis-server
```

4. **Run development server:**
```bash
npm run dev
```

5. **Run background worker:**
```bash
npm run worker:dev
```

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_ACCESS_SECRET` - Secret for JWT access tokens
- `JWT_REFRESH_SECRET` - Secret for JWT refresh tokens
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token

## Project Structure

```
api/
├── src/
│   ├── config/          # Configuration files
│   │   ├── index.js     # Central config export
│   │   ├── redis.js     # Redis connection
│   │   ├── jwt.js       # JWT configuration
│   │   └── twilio.js    # Twilio configuration
│   ├── middleware/      # Express middleware (auth, RBAC, error handling)
│   ├── models/          # Mongoose data models ✅
│   │   ├── Organization.js
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Message.js
│   │   ├── Service.js
│   │   ├── Appointment.js
│   │   └── index.js
│   ├── routes/          # API route definitions
│   │   └── v1/          # API version 1
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic layer
│   ├── validators/      # Input validation schemas
│   ├── utils/           # Helper functions ✅
│   │   ├── logger.js
│   │   ├── errors.js
│   │   ├── asyncHandler.js
│   │   ├── tokenGenerator.js
│   │   ├── phoneUtils.js
│   │   ├── dateUtils.js
│   │   ├── pagination.js
│   │   └── response.js
│   ├── jobs/            # Background job definitions
│   ├── sockets/         # Socket.io handlers
│   ├── db/              # Database utilities ✅
│   │   └── connection.js
│   ├── app.js           # Express app setup (pending)
│   ├── server.js        # HTTP server (pending)
│   └── worker.js        # Background worker (pending)
├── tests/               # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json         # ✅
├── .env.example         # ✅
└── README.md            # This file
```

## Key Features

### Multi-Tenant Architecture
- Strict data isolation per organization
- Subdomain-based tenant identification
- Organization-scoped queries and operations

### Authentication & Authorization
- JWT-based authentication (access + refresh tokens)
- Role-based access control (admin, worker)
- Password hashing with bcrypt (12 rounds)
- MFA support (TOTP)

### SMS Communication
- Twilio integration for SMS sending/receiving
- Per-worker phone number assignment
- Shared IVR inbox for unassigned messages
- Opt-in/opt-out compliance tracking
- Message threading and history

### Appointment Scheduling
- Calendly-like booking system
- Real-time slot availability calculation
- Multi-timezone support
- Automated reminders (SMS/Email)
- Reschedule/cancel self-service

### CRM Functionality
- Customer 360-degree view
- Interaction history tracking
- Custom fields and tags
- Customer lifecycle stats (appointments, no-shows, LTV)

## Data Models

### Organization
Multi-tenant organization entity with:
- Unique slug for subdomain
- Business hours and holidays
- Branding configuration
- Subscription and compliance settings

### User
System users (admins and workers) with:
- Email/password authentication
- Role-based permissions
- Worker profiles (for workers only)
- Availability overrides

### Customer
CRM contacts with:
- E.164 phone number (unique per org)
- SMS/Email opt-in tracking
- Interaction statistics
- Custom fields and tags

### Message
SMS messages with:
- Inbound/outbound direction
- Twilio integration (message SID, status)
- Thread grouping
- Media attachments (MMS)

### Service
Bookable services with:
- Duration and buffer times
- Lead time restrictions
- Worker assignment
- Pricing (optional)

### Appointment
Scheduled appointments with:
- Service, worker, and customer references
- Start/end times
- Status tracking (pending, confirmed, completed, canceled, no_show)
- Reminder tracking
- Reschedule/cancel tokens

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run worker` - Start background worker
- `npm run worker:dev` - Start background worker with hot reload
- `npm test` - Run all tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues
- `npm run seed` - Seed database with sample data

## Next Steps

To complete the server implementation:

1. **Create remaining models:**
   - PhoneNumber
   - Thread
   - WebhookEndpoint
   - ApiKey
   - AuditLog

2. **Implement middleware:**
   - Authentication (JWT verification)
   - Authorization (RBAC)
   - Tenant scoping
   - Error handler
   - Rate limiting
   - Input validation

3. **Build services:**
   - authService (register, login, refresh)
   - twilioService (send SMS, manage numbers)
   - availabilityService (slot calculation)
   - messageService (SMS processing)
   - appointmentService (booking logic)

4. **Create controllers and routes:**
   - Auth endpoints (/api/v1/auth/*)
   - Resource endpoints (/api/v1/customers, /api/v1/appointments, etc.)
   - Twilio webhooks (/webhooks/twilio/*)

5. **Set up real-time features:**
   - Socket.io server
   - Message event handlers
   - Typing indicators

6. **Configure background workers:**
   - Bull queue setup
   - SMS sending job
   - Reminder scheduling job
   - Webhook delivery job

7. **Create main server files:**
   - app.js (Express setup)
   - server.js (HTTP server + Socket.io)
   - worker.js (Background worker process)

## Documentation

- [PROJECT.md](../PROJECT.md) - Overall project specification
- [SERVER-SPECIFICATION.md](../SERVER-SPECIFICATION.md) - Detailed server architecture
- [CLIENT-UI-SPECIFICATION.md](../CLIENT-UI-SPECIFICATION.md) - Frontend specification

## License

MIT
