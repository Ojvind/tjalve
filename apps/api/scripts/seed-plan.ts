import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { MongoClient } from 'mongodb';
import type { PlanDocument, UserDocument } from '../src/models/types.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const email = arg('user')?.toLowerCase();
  const planPath = arg('plan');

  if (!email || !planPath) {
    console.error('Usage: npm run seed-plan -- --user <email> --plan <path-to-plan.json>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Missing required env var: DATABASE_URL');

  const raw = JSON.parse(readFileSync(planPath, 'utf-8')) as Omit<PlanDocument, 'userId' | 'updatedAt'>;
  if (!raw.slug) throw new Error('Plan JSON must have a "slug" field');

  const client = new MongoClient(databaseUrl);
  await client.connect();
  const db = client.db();

  const user = await db.collection<UserDocument>('users').findOne({ email });
  if (!user) throw new Error(`No user found for ${email}. Run seed-user first.`);

  const plan: PlanDocument = { ...raw, userId: user._id!.toString(), updatedAt: new Date().toISOString() };

  await db
    .collection<PlanDocument>('plans')
    .updateOne({ userId: plan.userId, slug: plan.slug }, { $set: plan }, { upsert: true });

  console.log(`Seeded plan "${plan.title}" (${plan.sessions.length} sessions) for ${email}`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
