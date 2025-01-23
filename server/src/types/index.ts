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
  content: string;
}

export interface GeneratedCode {
  files: {
    frontend: CodeFile[];
    backend: CodeFile[];
    admin: CodeFile[];
  };
}

export interface APIError {
  code: number;
  message: string;
  details?: string;
}