import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';

export const sanitizeInput = [
  // Sanitize MongoDB operator injections
  mongoSanitize({
    replaceWith: '_'
  }),

  // Sanitize XSS attacks
  xss(),

  // Custom sanitization
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = req.body[key].trim();
        }
      });
    }
    next();
  }
];