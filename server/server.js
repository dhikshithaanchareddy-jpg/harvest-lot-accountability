// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { authMiddleware } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const lotRoutes = require('./routes/lotRoutes');
const conditionCheckRoutes = require('./routes/conditionCheckRoutes');
const lineageRoutes = require('./routes/lineageRoutes');
const dispatchRoutes = require('./routes/dispatchRoutes');
const spoilageRoutes = require('./routes/spoilageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { isConfigured, supabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Global Auth Context Middleware
app.use(authMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/condition-checks', conditionCheckRoutes);
app.use('/api/lineage', lineageRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/spoilage', spoilageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/public', publicRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Harvest Lot Freshness and Spoilage Accountability Register',
    database: {
      provider: isConfigured ? 'Supabase PostgreSQL Cloud' : 'Local PostgreSQL Schema Engine',
      supabase_connected: isConfigured
    },
    version: '1.0.0'
  });
});

// Single Page Application Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Centralized error handling
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` Harvest Lot Freshness and Spoilage Accountability Register`);
    console.log(` Listening on port: http://localhost:${PORT}`);
    console.log(` Database: ${isConfigured ? 'Supabase PostgreSQL Cloud' : 'Local PostgreSQL Engine (Seed Ready)'}`);
    console.log(`================================================================`);
  });
}

module.exports = app;
