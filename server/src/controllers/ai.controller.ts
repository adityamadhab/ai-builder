import { Request, Response } from 'express';
import { AIService } from '../services/ai.service'; 
import { validateGenerateRequest } from '../utils/validation';
import { logger } from '../utils/logger';
import { CodeService } from '../services/code.service';
import * as path from 'path';

export class AIController {
  static async generateCode(req: Request, res: Response): Promise<void> {
    try {
      const { error } = validateGenerateRequest(req.body);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      const { prompt } = req.body;

      // Generate code
      const rawCode = await AIService.generateCode(prompt);
      
      // Process code and create files
      const processedCode = await CodeService.processCode(rawCode);
      
      // Get base directory path
      const baseDir = path.join(process.cwd(), 'generated');
      
      res.json({
        success: true,
        baseDirectory: baseDir,
        files: {
          frontend: processedCode.files.frontend.length,
          backend: processedCode.files.backend.length,
          admin: processedCode.files.admin.length
        },
        generatedFiles: {
          frontend: processedCode.files.frontend.map(f => ({
            path: path.join(baseDir, f.path),
            relativePath: f.path
          })),
          backend: processedCode.files.backend.map(f => ({
            path: path.join(baseDir, f.path),
            relativePath: f.path
          })),
          admin: processedCode.files.admin.map(f => ({
            path: path.join(baseDir, f.path),
            relativePath: f.path
          }))
        }
      });

    } catch (error) {
      logger.error('Generation error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Failed to generate code'
      });
    }
  }
}