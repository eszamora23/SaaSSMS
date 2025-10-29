# SaaS SMS Calendar

Multi-tenant booking and appointment system with SMS reminders, supporting any type of reservation: services, rooms, vehicles, equipment, and more.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SaaS-SMS-Calendar
   ```

2. **Install all dependencies** (root, API, and client)
   ```bash
   npm run install:all
   ```

3. **Configure environment variables**

   Create `.env` files in both `api` and `client` directories:

   **api/.env**
   ```env
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/saas-sms-calendar
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/saas-sms-calendar

   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_REFRESH_SECRET=your-refresh-token-secret

   # Optional: Twilio for SMS
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token

   # Optional: Email service
   EMAIL_FROM=noreply@yourdomain.com
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email
   SMTP_PASSWORD=your_password
   ```

   **client/.env**
   ```env
   VITE_API_URL=http://localhost:4000
   ```

4. **Run the development servers**
   ```bash
   npm run dev
   ```

   This will start both the API server (port 4000) and the client (port 3000) simultaneously!

## 📜 Available Commands

From the **root directory**:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both API and client in development mode 🔥 |
| `npm run dev:api` | Start only the API server |
| `npm run dev:client` | Start only the client |
| `npm run install:all` | Install dependencies for root, API, and client |
| `npm run build` | Build both API and client for production |
| `npm run start` | Start both in production mode |
| `npm run clean` | Remove all node_modules |
| `npm run test` | Run API tests |

From the **api directory**:

```bash
cd api
npm run dev          # Start API with nodemon
npm run start        # Start API in production
npm test             # Run tests
npm run lint         # Run ESLint
```

From the **client directory**:

```bash
cd client
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 🌐 Accessing the Application

### Main Domain (Registration)
- **http://localhost:3000** - Register new organizations

### Subdomain Access (Organization-specific)

After registering an organization (e.g., "test"), access it via:

- **http://test.localhost:3000** - Public booking page
- **http://test.localhost:3000/login** - Staff/admin login
- **http://test.localhost:3000/dashboard** - Dashboard (after login)

> **Note:** Some browsers may not support `*.localhost` subdomains. Use [lvh.me](http://lvh.me) as an alternative:
> - http://test.lvh.me:3000

## 🏗️ Project Structure

```
SaaS-SMS-Calendar/
├── api/                      # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   └── utils/            # Utility functions
│   ├── .env                  # API environment variables
│   └── package.json
│
├── client/                   # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Redux store
│   │   ├── services/         # API services
│   │   └── utils/            # Utility functions
│   ├── .env                  # Client environment variables
│   └── package.json
│
├── package.json              # Root package.json (for concurrent dev)
├── FLEXIBLE-BOOKING-SYSTEM.md # Booking system documentation
└── README.md                 # This file

```

## 🎯 Features

### Multi-Tenant System
- ✅ Subdomain-based tenant isolation
- ✅ Custom branding per organization
- ✅ Organization-specific settings

### Flexible Booking System
- ✅ Supports ANY bookable resource:
  - Services (appointments, consultations)
  - Rooms (hotel, conference, office)
  - Vehicles (cars, trucks, bikes)
  - Equipment (tools, cameras, sports gear)
  - Properties (apartments, houses)
  - Facilities (gyms, courts, pools)
- ✅ **Overbooking prevention** with multi-layer validation
- ✅ Business hours management
- ✅ Holiday/blocked date support
- ✅ Buffer times (setup/cleanup)
- ✅ Lead time restrictions
- ✅ Resource capacity tracking

### Appointment Management
- ✅ Public booking page per organization
- ✅ Real-time availability checking
- ✅ Customer management
- ✅ SMS reminders (Twilio integration)
- ✅ Email notifications
- ✅ Calendar view

### Communication
- ✅ SMS messaging (Twilio)
- ✅ Thread-based conversations
- ✅ Message templates
- ✅ Automated reminders

### Admin Dashboard
- ✅ Appointment management
- ✅ Customer database
- ✅ Service configuration
- ✅ User/staff management
- ✅ Analytics and reporting

## 📖 Documentation

- **[Flexible Booking System Guide](./FLEXIBLE-BOOKING-SYSTEM.md)** - Complete guide to the booking system, overbooking prevention, and resource configuration
- **[Subdomain Setup Guide](./SUBDOMAIN-SETUP.md)** - How to configure subdomains in development and production
- **API Documentation** - Available at `/api-docs` when server is running

## 🔧 Configuration

### Booking System Configuration

Each organization can customize:
- Business hours (per day of week)
- Holidays and blocked dates
- Service duration and buffer times
- Lead time restrictions (min/max booking advance)
- Resource availability schedules

See [FLEXIBLE-BOOKING-SYSTEM.md](./FLEXIBLE-BOOKING-SYSTEM.md) for detailed configuration examples.

## 🧪 Testing

### Create Test Data

You can create test organizations and services through:

1. **Registration page** - http://localhost:3000
2. **Database seeding** (coming soon)
3. **API directly**

### Test Accounts

After registering an organization, you'll have an admin account. You can:
- Login at `http://yourorg.localhost:3000/login`
- Access dashboard
- Create services
- Add team members

## 🚀 Production Deployment

### API Deployment

1. Build the API:
   ```bash
   cd api
   npm run build
   ```

2. Set production environment variables

3. Deploy to your hosting service (Heroku, Railway, DigitalOcean, AWS, etc.)

### Client Deployment

1. Build the client:
   ```bash
   cd client
   npm run build
   ```

2. Deploy the `dist` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Your own server with Nginx

### Subdomain Setup in Production

See [SUBDOMAIN-SETUP.md](./SUBDOMAIN-SETUP.md) for:
- DNS configuration (wildcard A records)
- SSL certificates (Let's Encrypt wildcard certs)
- Nginx configuration
- Reverse proxy setup

## 🐛 Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution:** Make sure MongoDB is running locally or update `MONGODB_URI` with your Atlas connection string.

### Issue: "Subdomain not working in browser"
**Solution:**
- Chrome/Edge: Should work with `*.localhost`
- Firefox: May need to enable `network.dns.localDomains` in `about:config`
- Alternative: Use `*.lvh.me` instead (points to 127.0.0.1)

### Issue: "API returns 404"
**Solution:** Check that API server is running on port 4000 and `VITE_API_URL` is correctly set.

### Issue: "CORS errors"
**Solution:** Verify `CORS_ORIGIN` in API `.env` includes your client URL.

## 📝 Development Workflow

1. **Start development servers:**
   ```bash
   npm run dev
   ```

2. **Make changes** to API or client code - both will auto-reload

3. **Test changes:**
   - Main domain: http://localhost:3000
   - Subdomain: http://test.localhost:3000

4. **Commit changes** following conventional commits:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Add your license here]

## 🙏 Acknowledgments

- Built with Node.js, Express, React, and MongoDB
- Uses Twilio for SMS functionality
- Material-UI for frontend components
- Socket.IO for real-time updates

---

**Questions or Issues?** Open an issue or contact the development team.

**Last Updated:** 2025-10-22
# SaaSSMS
