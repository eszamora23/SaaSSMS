# SaaS SMS Calendar - Setup Guide

## Current Status

Your app is **ALREADY RUNNING** in development mode:

- **API Server**: http://localhost:4000
  - API Endpoints: http://localhost:4000/api/v1
  - Health Check: http://localhost:4000/health
  - MongoDB: ✅ Connected

- **Client (React)**: http://localhost:3000
  - Vite Dev Server: ✅ Running
  - Hot Module Replacement: ✅ Enabled

## Quick Start (If Not Already Running)

### Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** - Either:
   - MongoDB Atlas (cloud) - Currently configured
   - Local MongoDB instance
3. **Redis** (Optional) - For background jobs and rate limiting

### Step 1: Install Dependencies

```bash
# Install API dependencies
cd api
npm install

# Install Client dependencies
cd ../client
npm install
```

### Step 2: Configure Environment Variables

#### API (.env file in /api directory)

```env
# Server Configuration
NODE_ENV=development
PORT=4000
API_URL=http://localhost:4000

# MongoDB (You already have this configured)
MONGODB_URI=your_mongodb_connection_string

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (Optional - app works without it)
REDIS_URL=redis://localhost:6379

# Twilio (Optional - configure via Settings UI)
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid

# Email (Optional)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# SMTP_FROM=noreply@yourdomain.com
```

#### Client (.env file in /client directory)

```env
VITE_API_URL=http://localhost:4000
```

### Step 3: Run the Application

#### Option 1: Run Both Servers Separately

```bash
# Terminal 1 - Start API Server
cd api
npm run dev

# Terminal 2 - Start Client
cd client
npm run dev
```

#### Option 2: Kill and Restart (if already running)

```bash
# Windows - Stop all Node processes
taskkill /F /IM node.exe

# Then start again
cd api && npm run dev
cd client && npm run dev
```

## Accessing the Application

1. **Open your browser**: http://localhost:3000

2. **Register a new account**:
   - Go to the registration page
   - Fill in organization details
   - Create your admin account

3. **Configure Twilio** (Optional):
   - Login to your account
   - Go to **Settings → Integrations**
   - Follow the interactive wizard to:
     - Enter Twilio credentials
     - Validate credentials
     - Fetch phone numbers
     - Import and configure numbers

## Common Issues & Solutions

### Issue: API Server Crashes

**Error**: `app.use() requires a middleware function` or `Route.get() requires a callback`

**Solution**: This is usually from old cached code. The server will automatically restart when you save any file. If not:

```bash
cd api
npm install
npm run dev
```

### Issue: Client Import Errors

**Error**: `Failed to resolve import "@mui/material/icons-material"`

**Solution**: This is a Vite cache issue. Clear the cache:

```bash
cd client
rm -rf node_modules/.vite
npm run dev
```

### Issue: Redis Connection Errors

**Status**: ⚠️ Warning (not critical)

**Message**: `connect ECONNREFUSED 127.0.0.1:6379`

**Explanation**: The app works without Redis. Redis is optional and used for:
- Background job queues (SMS sending, reminders)
- Rate limiting

**To fix (if you want Redis)**:

```bash
# Windows (using Chocolatey)
choco install redis-64

# Or use Docker
docker run -d -p 6379:6379 redis:alpine

# Or use a cloud Redis service like Redis Labs
```

### Issue: MongoDB Connection Errors

**Error**: `MongooseError: Operation buffering timed out`

**Solution**: Check your MongoDB connection string in `api/.env`:

```env
# For MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# For Local MongoDB
MONGODB_URI=mongodb://localhost:27017/saas-sms-calendar
```

### Issue: Port Already in Use

**Error**: `Port 3000/4000 is in use`

**Solution**:

```bash
# Windows - Find and kill process using port
netstat -ano | findstr :3000
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Or change the port in .env files
```

## Project Structure

```
SaaS-SMS-Calendar/
├── api/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── utils/         # Helper functions
│   ├── .env               # API environment variables
│   └── package.json
│
└── client/                # Frontend (React + Vite)
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/         # Page components
    │   ├── services/      # API client
    │   ├── store/         # Redux store
    │   └── utils/         # Helper functions
    ├── .env               # Client environment variables
    └── package.json
```

## Available Scripts

### API

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Client

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- ✅ Multi-tenant SaaS architecture
- ✅ SMS messaging with Twilio integration
- ✅ Calendar and appointment management
- ✅ Customer management (CRM)
- ✅ Thread-based messaging inbox
- ✅ Service configuration
- ✅ User/worker management
- ✅ Phone number management
- ✅ Real-time updates (Socket.IO)
- ✅ JWT authentication
- ✅ Role-based access control

## Next Steps

1. **Create your first organization** - Register at http://localhost:3000/register

2. **Configure Twilio** - Go to Settings → Integrations

3. **Add services** - Define the services you offer

4. **Add customers** - Import or create customer records

5. **Start messaging** - Send and receive SMS messages

## Documentation

- [API Documentation](./api/README.md)
- [Client Documentation](./client/README.md)
- [Twilio Integration Guide](./docs/twilio-setup.md)

## Support

If you encounter any issues:

1. Check the console logs for both API and Client
2. Verify environment variables are set correctly
3. Ensure MongoDB is accessible
4. Check that ports 3000 and 4000 are available

## Current Running Status

Check if servers are running:

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# You should see processes listening on these ports
```

Visit http://localhost:3000 in your browser to access the application!
