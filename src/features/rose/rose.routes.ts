// rose.routes.ts
import { Router } from 'express';
import { RoseController } from './rose.controller';
import { RoseService } from './rose.service';
import { RoseValidation } from './rose.validation';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../../middleware/auth.middleware';
import { rateLimiter } from './rose.middleware';

export function createRoseRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const roseService = new RoseService(prisma);
  const roseController = new RoseController(roseService);

  // All routes require authentication
  router.use(authMiddleware);

  // Send a rose
  router.post(
    '/send',
    rateLimiter({ windowMs: 60000, max: 10 }), // 10 requests per minute
    RoseValidation.sendRose,
    roseController.sendRose
  );

  // Get rose balance
  router.get(
    '/balance',
    rateLimiter({ windowMs: 60000, max: 30 }),
    roseController.getBalance
  );

  // Get rose history
  router.get(
    '/history',
    rateLimiter({ windowMs: 60000, max: 30 }),
    RoseValidation.getHistory,
    roseController.getHistory
  );

  return router;
}