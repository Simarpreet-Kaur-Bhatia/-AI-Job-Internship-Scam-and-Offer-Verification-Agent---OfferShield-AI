require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const { port, nodeEnv, frontendUrl } = require('./config/config');

const authRoutes = require('./routes/authRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Connect to database
connectDB();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow serving frontend
}));

// CORS
app.use(cors({
  origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'null'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'x-session-id'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many verification requests. Please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/verify', verifyLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Static files - serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'OfferShield AI API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API endpoint not found.' });
  }
});

// Global error handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`\n🛡️  OfferShield AI Server running on port ${port}`);
  console.log(`📍 Environment: ${nodeEnv}`);
  console.log(`🌐 API: http://localhost:${port}/api`);
  console.log(`🖥️  Frontend: http://localhost:${port}\n`);
});

module.exports = app;
