import { ErrorRequestHandler } from 'express';
import { APIError } from '../types';
import { logger } from '../utils/logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
    return;
  }

  if (err.name === 'MongoServerError') {
    res.status(400).json({
      error: 'Database Error',
      details: 'Duplicate key violation'
    });
    return;
  }

  const apiError: APIError = {
    code: 500,
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  res.status(apiError.code).json(apiError);
};