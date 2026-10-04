import { FastifyInstance } from 'fastify';
import { getDb } from '../db.js';
import { requireAuth } from '../plugins/auth.js';
import type { ProgressDocument } from '../models/types.js';

// Same rule as plans.ts: userId always comes from the verified session
// (request.userId), never from the request body or query string.
export async function progressRoutes(app: FastifyInstance) {
  app.get('/progress', { preHandler: requireAuth }, async (request, reply) => {
    const { planId } = request.query as { planId?: string };
    if (!planId) return reply.code(400).send({ error: 'planId is required' });
    const entries = await getDb()
      .collection<ProgressDocument>('progress')
      .find({ userId: request.userId, planId })
      .toArray();
    return { entries };
  });

  app.post('/progress/toggle', { preHandler: requireAuth }, async (request, reply) => {
    const { planId, sessionId, note } = request.body as { planId?: string; sessionId?: string; note?: string };
    if (!planId || !sessionId) return reply.code(400).send({ error: 'planId and sessionId are required' });

    const collection = getDb().collection<ProgressDocument>('progress');
    const filter = { userId: request.userId!, planId, sessionId };
    const existing = await collection.findOne(filter);

    if (existing) {
      await collection.deleteOne(filter);
      return { done: false };
    }

    const doneAt = new Date().toISOString();
    await collection.insertOne({ ...filter, doneAt, note });
    return { done: true, doneAt, note };
  });
}
