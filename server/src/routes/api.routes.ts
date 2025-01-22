import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/generate', 
  rateLimiter,
  AIController.generateCode
);

router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

export default router;