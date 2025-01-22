import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { connectDB } from './config/database';
import apiRoutes from './routes/api.routes';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders } from './middleware/securityHeaders';
import { requestLogger } from './middleware/requestLogger';
import { sanitizeInput } from './middleware/sanitize';
import { logger } from './utils/logger';

config();

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(securityHeaders);
app.use(requestLogger);
app.use(sanitizeInput);

// Database
connectDB();

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/v1', apiRoutes);

// Error Handling
app.use(errorHandler);

export default app;