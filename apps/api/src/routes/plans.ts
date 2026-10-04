import { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { requireAuth } from '../plugins/auth.js';
import type { PlanDocument } from '../models/types.js';

// Every query here is scoped by request.userId, which comes only from the
// verified JWT (see plugins/auth.ts). Nothing in these routes ever reads a
// user id from params, query string or body — that is the whole guarantee
// that one user can't see another user's plan.
export async function planRoutes(app: FastifyInstance) {
  app.get('/plans', { preHandler: requireAuth }, async (request) => {
    const plans = await getDb()
      .collection<PlanDocument>('plans')
      .find({ userId: request.userId })
      .project({ sessions: 0 })
      .toArray();
    return { plans };
  });

  app.get('/plans/:slug', { preHandler: requireAuth }, async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const plan = await getDb().collection<PlanDocument>('plans').findOne({ userId: request.userId, slug });
    if (!plan) return reply.code(404).send({ error: 'Not found' });
    return plan;
  });
}
