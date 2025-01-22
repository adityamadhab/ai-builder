import { GeneratedCode } from '../types/index';
import Project from '../models/project.model';
import { logger } from '../utils/logger';
import { CodeParser } from '../utils/codeParser';

export class CodeService {
  static async processCode(rawCode: GeneratedCode) {
    try {
      // Validate and sanitize code
      const processedCode = CodeParser.sanitizeCode(rawCode);
      
      // Additional processing logic
      return {
        ...processedCode,
        createdAt: new Date()
      };
    } catch (error) {
      logger.error('Code processing error:', error);
      throw new Error('Invalid code structure');
    }
  }

  static async saveProject(code: GeneratedCode, userId: string) {
    try {
      const project = new Project({
        name: 'New Project',
        owner: userId,
        ...code
      });

      await project.save();
      return project;
    } catch (error) {
      logger.error('Database save error:', error);
      throw new Error('Failed to save project');
    }
  }
}