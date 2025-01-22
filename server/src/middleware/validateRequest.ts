import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { APIError } from '../types';
import { logger } from '../utils/logger';

export const validateRequest = (schema: ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        logger.error('Validation failed:', errors);
        res.status(400).json({ 
          error: 'Invalid request data',
          details: errors 
        });
      } else {
        next(error);
      }
    }
  };