import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/students.routes.js';
import leaveRoutes from './routes/leaves.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import semesterRoutes from './routes/semesters.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { prisma } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

// trust proxy configuration for rate limiters and secure cookies in production
app.set('trust proxy', 1);

// HTTP Response Compression
app.use(compression());

// Security Middlewares
app.use(helmet());

// Cross-Origin Resource Sharing (CORS) setup
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL;
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate Limiting (prevent brute force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    errorCode: 'RATE_LIMIT_ERROR'
  }
});
app.use('/api', limiter);

// Request Parsing & Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Swagger Documentation API Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NITM MessTrack API Documentation',
      version: '1.0.0',
      description: 'REST API for NIT Meghalaya Mess Fee Tracker and Refund System'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API Routes Mapping
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/semesters', semesterRoutes);

// Root Ping Endpoint (health check)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 Fallback Middleware
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    errorCode: 'NOT_FOUND'
  });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`NITM MessTrack Server Running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`API Docs:     http://localhost:${PORT}/api-docs`);
  console.log(`=============================================`);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    prisma.$disconnect()
      .then(() => {
        console.log('Database disconnected.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error during database disconnection:', err);
        process.exit(1);
      });
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  process.exit(1);
});
