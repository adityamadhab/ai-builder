import { GeneratedCode } from '../types/index';
import Project from '../models/project.model';
import { logger } from '../utils/logger';
import { CodeParser } from '../utils/codeParser';
import * as fs from 'fs/promises';
import * as path from 'path';

export class CodeService {
  static async processCode(rawCode: GeneratedCode) {
    try {
      // Validate and sanitize code
      const processedCode = CodeParser.sanitizeCode(rawCode);
      
      // Create directories and files
      await this.createProjectFiles(processedCode);

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

  private static async createProjectFiles(code: GeneratedCode) {
    try {
      // Create base directories
      const baseDir = path.join(process.cwd(), 'generated');
      await fs.mkdir(baseDir, { recursive: true });

      // Create files and their parent directories
      for (const [section, files] of Object.entries(code.files)) {
        for (const file of files) {
          const filePath = path.join(baseDir, file.path);
          
          // Create parent directory if it doesn't exist
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          
          // Write file content
          await fs.writeFile(filePath, file.content, 'utf8');
          logger.info(`Created file: ${filePath}`);
        }
      }

      logger.info('Successfully created all project files');
    } catch (error) {
      logger.error('Error creating project files:', error);
      throw new Error('Failed to create project files');
    }
  }
}