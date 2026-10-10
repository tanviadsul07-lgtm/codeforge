import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import workOrdersRoutes from './routes/workOrdersRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, error: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

// Route Mounting
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/work-orders', workOrdersRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'PathRakshak AI Full-Stack Backend Engine',
    timestamp: new Date().toISOString(),
    firebaseProject: process.env.FIREBASE_PROJECT_ID || 'pathrakshak-63a01',
    cloudinary: process.env.CLOUDINARY_CLOUD_NAME || 'configured'
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Backend Exception]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 PathRakshak AI Backend Server running on port ${PORT}`);
  console.log(`🌐 Health Endpoint: http://localhost:${PORT}/api/health`);
  console.log(`==================================================\n`);
});
