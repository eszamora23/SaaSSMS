# SaaS SMS Calendar - Quick Start Guide

## 🚀 Get Running in 5 Minutes

Follow these steps to get your SaaS SMS Calendar platform up and running.

## Prerequisites

Before you begin, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ MongoDB running (locally or Atlas)
- ✅ Redis running (locally or cloud)
- ✅ A code editor (VS Code recommended)

## Step 1: Install Backend Dependencies

```bash
cd api
npm install
```

## Step 2: Configure Backend Environment

```bash
cd api
cp .env.example .env
```

Edit `api/.env` with your credentials:

```env
# Minimum required configuration
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/saas-sms-calendar

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets (change these!)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this

# URLs
CLIENT_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# Twilio (Optional - for SMS features)
# TWILIO_ACCOUNT_SID=your-account-sid
# TWILIO_AUTH_TOKEN=your-auth-token
# TWILIO_WEBHOOK_BASE_URL=https://your-domain.com
```

## Step 3: Start Backend Server

In the `api/` directory:

```bash
# Terminal 1 - API Server
npm run dev

# Terminal 2 - Background Worker
npm run worker
```

You should see:
```
╔═══════════════════════════════════════════════╗
║   SaaS SMS Calendar API Server               ║
║   Port:        4000                           ║
║   MongoDB:     Connected                      ║
║   Socket.IO:   Enabled                        ║
╚═══════════════════════════════════════════════╝
```

## Step 4: Install Frontend Dependencies

In a new terminal:

```bash
cd client
npm install
```

## Step 5: Configure Frontend Environment

```bash
cd client
cp .env.example .env
```

The defaults should work:

```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_APP_NAME=SaaS SMS Calendar
```

## Step 6: Start Frontend

In the `client/` directory:

```bash
npm run dev
```

You should see:
```
  VITE ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

## Step 7: Access the Application

1. **Open your browser** to http://localhost:3000

2. **Register a new organization**:
   - Click "Sign Up"
   - Fill in the form:
     - Organization Name: "My Company"
     - Email: "admin@mycompany.com"
     - Password: "SecurePass123!"
   - Click "Sign Up"

3. **Login**:
   - Use the email and password you just created
   - Click "Sign In"

4. **Explore the Dashboard**:
   - View your organization stats
   - Navigate through the menu:
     - Dashboard
     - Messages
     - Appointments
     - Customers
     - Services
     - Settings

## Verify Everything Works

### Check API Health

Open http://localhost:4000/health

You should see:
```json
{
  "status": "ok",
  "service": "SaaS SMS Calendar API",
  "timestamp": "2025-01-21T..."
}
```

### Check Socket.IO Connection

After logging in, open browser DevTools (F12) → Console

You should see:
```
Socket connected: <socket-id>
```

### Test the API

Try creating a customer via the API:

```bash
# Get your access token from localStorage in browser DevTools

curl -X POST http://localhost:4000/api/v1/customers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+15551234567",
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

## Optional: Configure Twilio for SMS

If you want SMS functionality:

1. **Sign up for Twilio** (https://www.twilio.com)

2. **Get credentials**:
   - Account SID
   - Auth Token

3. **Purchase a phone number** with SMS capability

4. **Update `api/.env`**:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WEBHOOK_BASE_URL=https://your-domain.com
```

5. **Configure webhooks in Twilio console**:
   - SMS Inbound: `https://your-domain.com/webhooks/twilio/sms/inbound`
   - SMS Status: `https://your-domain.com/webhooks/twilio/sms/status`

6. **Restart the API server**

## Directory Structure

```
SaaS-SMS-Calendar/
├── api/              # Backend server
│   ├── src/
│   ├── package.json
│   ├── .env         # Your config
│   └── README.md
│
├── client/          # Frontend app
│   ├── src/
│   ├── package.json
│   ├── .env         # Your config
│   └── README.md
│
├── PROJECT-SUMMARY.md    # Complete overview
└── QUICK-START.md        # This file
```

## Common Issues & Solutions

### MongoDB Connection Error

**Error**: `MongooseError: MongooseServerSelectionError`

**Solution**:
```bash
# Start MongoDB locally
mongod --dbpath ./data/db

# Or use MongoDB Atlas and update MONGODB_URI in .env
```

### Redis Connection Error

**Error**: `Error: Redis connection failed`

**Solution**:
```bash
# Start Redis locally
redis-server

# Or use Redis Cloud and update REDIS_HOST/PORT in .env
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::4000`

**Solution**:
```bash
# Kill the process on port 4000
# On Mac/Linux:
lsof -ti:4000 | xargs kill

# On Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

### Frontend Can't Connect to API

**Solution**:
1. Verify API is running on port 4000
2. Check `client/.env` has correct `VITE_API_URL`
3. Clear browser cache and reload

## Next Steps

Once everything is running:

1. **Create Services** - Set up bookable services
2. **Add Users** - Invite team members (workers)
3. **Configure Phone Numbers** - If using SMS
4. **Test Appointments** - Create and manage bookings
5. **Explore the API** - Check `api/README.md` for endpoints

## Need Help?

- **API Documentation**: See `api/README.md`
- **Client Documentation**: See `client/README.md`
- **Implementation Guide**: See `client/IMPLEMENTATION.md`
- **Full Overview**: See `PROJECT-SUMMARY.md`

## What's Working

✅ User authentication (login/register)
✅ Dashboard with live stats
✅ Organization management
✅ API endpoints for all features
✅ Real-time Socket.IO connection
✅ Background job processing
✅ Multi-tenant architecture
✅ Complete backend implementation

## What to Build Next

The frontend has stub pages that need full UI implementation:
- SMS messaging interface
- Appointment calendar view
- Customer management UI
- Service configuration UI
- Public booking flow
- Settings pages

Refer to `client/IMPLEMENTATION.md` for detailed next steps.

---

## You're All Set! 🎉

Your Enterprise SaaS SMS Calendar platform is now running!

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **API Health**: http://localhost:4000/health

Happy coding! 🚀
