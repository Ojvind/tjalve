import bcrypt from 'bcryptjs';
import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { config } from '../config.js';
import { getDb } from '../db.js';
import { requireAuth } from '../plugins/auth.js';
import type { UserDocument } from '../models/types.js';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email?: string; password?: string };
    if (!email || !password) return reply.code(401).send({ error: 'Wrong email or password' });

    const user = await getDb().collection<UserDocument>('users').findOne({ email: email.toLowerCase() });
    const valid = Boolean(user) && (await bcrypt.compare(password, user!.passwordHash));
    if (!user || !valid) return reply.code(401).send({ error: 'Wrong email or password' });

    const token = jwt.sign({ sub: user._id!.toString(), email: user.email }, config.jwtSecret, { expiresIn: '30d' });
    return { token };
  });

  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const user = await getDb()
      .collection<UserDocument>('users')
      .findOne({ _id: new ObjectId(request.userId) as never });
    if (!user) return reply.code(404).send({ error: 'Not found' });
    return { id: user._id, email: user.email, name: user.name };
  });
}
