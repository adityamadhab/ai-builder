import { Request, Response } from 'express';
import { AIService } from '../services/ai.service'; 
import { validateGenerateRequest } from '../utils/validation';
import { logger } from '../utils/logger';
import { CodeService } from '../services/code.service';

export class AIController {
  static async generateCode(req: Request, res: Response): Promise<void> {
    try {
      const { error } = validateGenerateRequest(req.body);
      if (error) {
        res.status(400).json({ error: error.message });
        return;
      }

      const { prompt, userId } = req.body;

      // Generate code
      const rawCode = await AIService.generateCode(prompt);
      
      // Process code
      const processedCode = await CodeService.processCode(rawCode);
      
      // Save project
      const project = await CodeService.saveProject(processedCode, userId);

      res.json({
        success: true,
        projectId: project._id,
        files: {
          frontend: processedCode.frontend.length,
          backend: processedCode.backend.length
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