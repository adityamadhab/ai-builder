import { Request } from 'express';
import { IUser } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export interface CodeFile {
  path: string;
  code: string;
}

export interface GeneratedCode {
  frontend: CodeFile[];
  backend: CodeFile[];
  adminPanel: CodeFile[];
}

export interface APIError {
  code: number;
  message: string;
  details?: string;
}