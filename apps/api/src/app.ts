import cors from '@fastify/cors';
import Fastify from 'fastify';
import { authRoutes } from './routes/auth.js';
import { planRoutes } from './routes/plans.js';
import { progressRoutes } from './routes/progress.js';

export function buildApp() {
  const app = Fastify({ logger: !process.env.VITEST });
  app.register(cors, { origin: true });
  app.register(authRoutes);
  app.register(planRoutes);
  app.register(progressRoutes);
  app.get('/health', async () => ({ ok: true }));
  return app;
}
