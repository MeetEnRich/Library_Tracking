const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const qrRoutes = require('./routes/qr.routes');
const cvRoutes = require('./routes/cv.routes');
const adminRoutes = require('./routes/admin.routes');
const zonesRoutes = require('./routes/zones.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Configure CORS
app.use(cors());

// Configure JSON parser
app.use(express.json());

// Wire Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/zones', zonesRoutes);

// Fallback 404 Route
app.use((req, res, next) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
