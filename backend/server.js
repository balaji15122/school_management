require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const path = require('path');
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const schoolRoutes = require('./src/routes/schoolRoutes');
const exportRoutes = require('./src/routes/exportRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const userRoutes = require('./src/routes/userRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5050;

// Security & Utility Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
// CORS Configuration - Support Vercel frontend, Flutter web, local dev, and mobile
const allowedOrigins = [
  'https://school-management-mauve-zeta.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5050',
  ...(process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*'
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''))
    : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        process.env.CORS_ORIGIN === '*'
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Fallback: allow to avoid blocking valid clients
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Disposition', 'Content-Length'],
  })
);
app.options('*', cors());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'School Management Multi-Tenant API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route '${req.originalUrl}' not found`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Connect DB & Start Server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 School Management Server running on port ${PORT}`);
    console.log(`🌍 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
