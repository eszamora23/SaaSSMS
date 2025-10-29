# SaaS SMS Calendar - Client Application

Modern React client application for the Enterprise SMS Contact Center & Appointment Scheduling platform.

## Features

- 🎨 Material-UI v5 design system
- 📱 Fully responsive (mobile-first)
- 🔐 JWT authentication with auto-refresh
- ⚡ Real-time updates with Socket.IO
- 📅 Appointment scheduling interface
- 💬 SMS messaging inbox
- 👥 Customer management (CRM)
- 🌐 Public booking pages (Calendly-like)
- 🎯 Role-based access control
- 🔄 Redux Toolkit state management
- ⚡ Vite for fast development

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Material-UI v5
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **API Client**: Axios
- **Real-time**: Socket.IO Client
- **Date Handling**: Luxon

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Running API server (see ../api/README.md)

### Installation

1. Install dependencies:
   ```bash
   cd client
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:3000

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   ├── common/      # Shared components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── messages/    # SMS messaging interface
│   │   ├── appointments/# Scheduling components
│   │   ├── customers/   # CRM components
│   │   ├── public/      # Public booking pages
│   │   └── layout/      # Layout components
│   ├── pages/           # Page components
│   ├── store/           # Redux store & slices
│   ├── services/        # API services
│   ├── utils/           # Utility functions
│   ├── hooks/           # Custom React hooks
│   ├── theme/           # MUI theme configuration
│   ├── App.jsx          # Main App component
│   └── main.jsx         # Entry point
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Key Features

### Authentication
- Login/Registration
- JWT token management
- Auto token refresh
- Protected routes

### Dashboard
- Statistics overview
- Recent activity
- Quick actions
- Real-time updates

### SMS Messaging
- Conversation threads
- Real-time message updates
- Media attachments (MMS)
- Typing indicators
- Opt-in/opt-out management

### Appointments
- Calendar view
- Available slots display
- Booking creation
- Reschedule/cancel
- Appointment reminders

### Customers (CRM)
- Customer list with search
- Customer profiles
- Interaction history
- Custom fields and tags
- Opt-in consent tracking

### Public Booking
- Organization profile
- Service selection
- Worker selection
- Availability calendar
- Booking confirmation

## Environment Variables

See `.env.example` for all available variables.

## Building for Production

```bash
npm run build
```

The production build will be created in the `dist/` directory.

## Deployment

Deploy the contents of `dist/` to your hosting provider:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy --prod`
- **AWS S3**: Configure as static website
- **Nginx**: Serve static files from `dist/`

## License

Proprietary - All rights reserved
