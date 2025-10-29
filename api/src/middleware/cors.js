/**
 * CORS Configuration Middleware
 */

const cors = require('cors');
const config = require('../config');

/**
 * CORS options
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured client URLs
    const allowedOrigins = [
      config.clientUrl,
      config.adminUrl,
      'http://localhost:3000',
      'http://localhost:3001',
    ];

    // Allow all subdomains in development
    if (config.env === 'development') {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Check for subdomain pattern
      const subdomainPattern = /^https?:\/\/[\w-]+\.[\w-]+\.\w+$/;
      if (subdomainPattern.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },

  credentials: true, // Allow credentials (cookies, authorization headers)

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
  ],

  exposedHeaders: ['X-Request-Id', 'X-Total-Count', 'RateLimit-Limit', 'RateLimit-Remaining'],

  maxAge: 86400, // Cache preflight request for 24 hours
};

module.exports = cors(corsOptions);
