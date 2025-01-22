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
  structure: {
    frontend: string[];
    backend: string[];
  };
  files: {
    frontend: CodeFile[];
    backend: CodeFile[];
  };
}

export interface APIError {
  code: number;
  message: string;
  details?: string;
}