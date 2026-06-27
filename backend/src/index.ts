import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.use(morgan('dev'));

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

// Root Ping Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Centralized Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`NITM MessTrack Server Running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`API Docs:     http://localhost:${PORT}/api-docs`);
  console.log(`=============================================`);
});
