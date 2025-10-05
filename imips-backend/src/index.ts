import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import slowDown from 'express-slow-down';

dotenv.config();

import { initDB } from './utils/db';
import { requestLogger } from './middlewares/requestLogger.middleware';
import logger from './utils/logger';

import authController from './controllers/auth.controller';
import usersController from './controllers/users.controller';
import inventoryController from './controllers/inventory.controller';
import inquiriesController from './controllers/inquiries.controller';
import emailsController from './controllers/emails.controller';
import ordersController from './controllers/orders.controller';
import backupController from './controllers/backup.controller';
import discountsController from './controllers/discounts.controller';
import { ImageUtils } from './utils/imageUtils';

const app = express();
const PORT = process.env.PORT || 4000;

// =============================================
// INITIALIZATION
// =============================================

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log application startup
logger.info('Application starting', {
  environment: process.env.NODE_ENV || 'development',
  port: PORT,
  nodeVersion: process.version
});

// Initialize image directories on startup
ImageUtils.initializeDirectories().then(() => {
  console.log('📁 Image directories initialized');
}).catch(error => {
  console.error('❌ Failed to initialize image directories:', error);
});

// Serve static files from uploads and public directories
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
app.use(express.static(path.join(process.cwd(), 'public')));


// =============================================
// SECURITY MIDDLEWARE
// =============================================

// Request logging (should be first middleware)
app.use(requestLogger);

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS with specific options
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400 // 24 hours
}));

// =============================================
// RATE LIMITING CONFIGURATION (SIMPLIFIED)
// =============================================

// General rate limiting for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aggressive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  skipSuccessfulRequests: true, // Only count failed attempts
  standardHeaders: true
});

// Strict rate limiting for sensitive operations
const sensitiveOpsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 sensitive operations per 5 minutes
  message: {
    error: 'Too many sensitive operations',
    message: 'Please slow down your requests.'
  },
  standardHeaders: true
});

// Slow down middleware
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per 15 minutes, then start delaying
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 100; // Add 100ms delay per request after limit
  },
  maxDelayMs: 2000, // Maximum delay of 2 seconds
  validate: { delayMs: false } // Suppress the warning
});

// Apply general rate limiting and speed limiting
app.use(generalLimiter);
app.use(speedLimiter);

// =============================================
// BODY PARSING & FILE SERVING
// =============================================

// Body parsing middleware with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images with path traversal protection
app.use('/uploads', (req, res, next) => {
  // Basic path traversal protection
  if (req.path.includes('../') || req.path.includes('..\\')) {
    return res.status(404).json({ error: 'File not found' });
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// =============================================
// CUSTOM SECURITY MIDDLEWARE
// =============================================

// Path traversal protection middleware
const pathTraversalProtection = (req: any, res: any, next: any) => {
  const urlPath = req.path;

  // Block common path traversal patterns
  const traversalPatterns = [
    '../', '..\\', '/./', '\\.\\', '~/', '~\\',
    '\\\\', '//', './../', '.\\..\\'
  ];

  for (const pattern of traversalPatterns) {
    if (urlPath.includes(pattern)) {
      console.warn(`Path traversal attempt blocked: ${urlPath} from IP: ${req.ip}`);
      return res.status(404).json({
        error: 'Path not found',
        message: 'The requested resource does not exist'
      });
    }
  }

  // Block attempts to access sensitive files
  const sensitivePatterns = [
    /\.env/, /\.git/, /\.htaccess/, /\.htpasswd/, /web\.config/,
    /passwd/, /shadow/, /etc\/passwd/, /etc\/shadow/,
    /config\.json/, /package\.json/, /tsconfig\.json/,
    /\.sql/, /\.db/, /database\./
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(urlPath)) {
      console.warn(`Sensitive file access attempt blocked: ${urlPath} from IP: ${req.ip}`);
      return res.status(404).json({
        error: 'Path not found',
        message: 'The requested resource does not exist'
      });
    }
  }

  next();
};

// Under maintenance middleware
const maintenanceMiddleware = (req: any, res: any, next: any) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Allow health checks and auth during maintenance
    const allowedPaths = ['/api/auth/login', '/health', '/api/auth/register'];
    if (!allowedPaths.some(path => req.path.startsWith(path))) {
      return res.status(503).json({
        error: 'Service temporarily unavailable for maintenance',
        message: 'We are performing maintenance and will be back shortly.',
        retryAfter: 3600
      });
    }
  }
  next();
};

// SQL injection protection middleware
const sqlInjectionProtection = (req: any, res: any, next: any) => {
  const bodyString = JSON.stringify(req.body).toLowerCase();
  const queryString = JSON.stringify(req.query).toLowerCase();

  const sqlPatterns = [
    'drop table', 'insert into', 'update set', 'delete from',
    'union select', 'or 1=1', 'and 1=1', 'exec ', 'xp_', 'sp_',
    'select *', 'information_schema', 'version()', 'benchmark('
  ];

  for (const pattern of sqlPatterns) {
    if (bodyString.includes(pattern) || queryString.includes(pattern)) {
      console.warn(`SQL injection attempt detected from IP: ${req.ip}`);
      return res.status(400).json({
        error: 'Invalid request',
        message: 'The request contains suspicious patterns'
      });
    }
  }

  next();
};

// XSS protection middleware
const xssProtection = (req: any, res: any, next: any) => {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Basic XSS prevention
      return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key] = sanitize(obj[key]);
        return acc;
      }, {} as any);
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);

  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// =============================================
// APPLY SECURITY MIDDLEWARE
// =============================================

app.use(pathTraversalProtection);
app.use(maintenanceMiddleware);
app.use(sqlInjectionProtection);
app.use(xssProtection);

// CSRF protection (enable for production)
const csrfProtection = process.env.NODE_ENV === 'production'
  ? csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  })
  : (req: any, res: any, next: any) => next();

// CSRF token endpoint
app.get('/api/csrf-token', csrfProtection, (req: any, res: any) => {
  res.json({
    csrfToken: req.csrfToken(),
    message: 'Use this token in your X-CSRF-Token header for non-GET requests'
  });
});

// Apply CSRF protection to all routes except GET, HEAD, OPTIONS and auth
app.use((req: any, res: any, next: any) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path.startsWith('/api/auth/')) {
    return next();
  }
  csrfProtection(req, res, next);
});

// =============================================
// ROUTES WITH ENHANCED SECURITY
// =============================================

// Auth routes with aggressive rate limiting
app.use('/api/auth', authLimiter, authController);

// Sensitive operations with strict rate limiting
app.use('/api/backup', sensitiveOpsLimiter, backupController);
app.use('/api/users', sensitiveOpsLimiter, usersController);

// Other protected routes
app.use('/api/inventory', inventoryController);
app.use('/api/inquiries', inquiriesController);
app.use('/api/emails', emailsController);
app.use('/api/orders', ordersController);
app.use('/api/discounts', discountsController);

// =============================================
// ERROR HANDLING MIDDLEWARE
// =============================================

// 404 handler for undefined routes
app.use('*', (req, res) => {
  console.warn(`404 - Route not found: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'The requested resource does not exist',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // CSRF errors
  if (error.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      error: 'Invalid CSRF token',
      message: 'Form submission rejected for security reasons'
    });
  }

  // Rate limit errors
  if (error.statusCode === 429) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later'
    });
  }

  // Generic error response
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(error.status || 500).json({
    error: isProduction ? 'Internal server error' : error.message,
    message: isProduction ? 'Something went wrong. Please try again later.' : error.message,
    ...(!isProduction && { stack: error.stack })
  });
});

// =============================================
// SERVER STARTUP
// =============================================

initDB({ seedData: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    if (process.env.MAINTENANCE_MODE === 'true') {
      console.log('⚠️  MAINTENANCE MODE: ENABLED');
    }
  });
}).catch((error) => {
  console.error('❌ Failed to initialize database:', error);
  process.exit(1);
});