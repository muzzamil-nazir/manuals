const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');

// Helmet security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Rate limiter for uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 uploads per hour
  message: 'Too many uploads, please try again later.',
});

// Rate limiter for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit to 5 registrations per IP per hour
  message: 'Too many accounts created from this IP, please try again later.',
});

// Input validation middleware
function validateInput(req, res, next) {
  // Validate email if present
  if (req.body.email && !validator.isEmail(req.body.email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format.' });
  }

  // Validate name length
  if (req.body.name) {
    const name = req.body.name.trim();
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'Name must be between 2 and 100 characters.' });
    }
  }

  // Validate password strength
  if (req.body.password) {
    if (req.body.password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }
  }

  // Sanitize inputs to prevent XSS
  if (req.body.name) {
    req.body.name = validator.trim(req.body.name);
  }
  if (req.body.email) {
    req.body.email = validator.trim(req.body.email).toLowerCase();
  }

  next();
}

// File upload security validation
function validateFileUpload(req, res, next) {
  if (!req.file) {
    return next();
  }

  // List of blocked extensions
  const blockedExtensions = [
    'exe', 'bat', 'cmd', 'sh', 'bash', 'ps1',
    'scr', 'vbs', 'com', 'pif', 'msi', 'jar',
    'app', 'deb', 'rpm', 'dmg', 'pkg',
  ];

  const fileExtension = req.file.originalname.split('.').pop().toLowerCase();

  if (blockedExtensions.includes(fileExtension)) {
    // Delete the uploaded file
    const fs = require('fs').promises;
    fs.unlink(req.file.path).catch(console.error);

    return res.status(400).json({
      success: false,
      message: `Executable files (.${fileExtension}) are not allowed for security reasons.`,
    });
  }

  // Validate file size is not suspiciously small (0 bytes) or corrupt
  if (req.file.size === 0) {
    const fs = require('fs').promises;
    fs.unlink(req.file.path).catch(console.error);

    return res.status(400).json({
      success: false,
      message: 'Uploaded file is empty. Please upload a valid file.',
    });
  }

  next();
}

// Get user IP for logging
function getUserIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    null
  );
}

// Secure headers for all requests
function setSecureHeaders(req, res, next) {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}

module.exports = {
  securityHeaders,
  apiLimiter,
  loginLimiter,
  uploadLimiter,
  registerLimiter,
  validateInput,
  validateFileUpload,
  getUserIP,
  setSecureHeaders,
};
