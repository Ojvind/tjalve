import { Db, MongoClient } from 'mongodb';
import { config } from './config.js';

let db: Db;

export async function connectDb(): Promise<Db> {
  const client = new MongoClient(config.databaseUrl);
  await client.connect();
  db = client.db();
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('plans').createIndex({ userId: 1, slug: 1 }, { unique: true });
  await db.collection('progress').createIndex({ userId: 1, planId: 1, sessionId: 1 }, { unique: true });
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected yet');
  return db;
}
