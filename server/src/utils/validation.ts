import { z } from 'zod';

export const generateRequestSchema = z.object({
  prompt: z.string().min(10).max(1000),
  userId: z.string().optional(),
  stack: z.enum(['MERN']).default('MERN')
});

export const validateGenerateRequest = (data: unknown) => 
  generateRequestSchema.safeParse(data);