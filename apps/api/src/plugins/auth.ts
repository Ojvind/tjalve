import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface AuthTokenPayload {
  sub: string; // userId
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const header = request.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) return reply.code(401).send({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    request.userId = payload.sub;
  } catch {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}
