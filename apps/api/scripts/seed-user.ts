import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import type { UserDocument } from '../src/models/types.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const email = arg('email')?.toLowerCase();
  const name = arg('name');
  const password = arg('password');

  if (!email || !name || !password) {
    console.error('Usage: npm run seed-user -- --email <email> --name <name> --password <password>');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Missing required env var: DATABASE_URL');

  const client = new MongoClient(databaseUrl);
  await client.connect();
  const db = client.db();
  const users = db.collection<UserDocument>('users');

  const passwordHash = bcrypt.hashSync(password, 10);
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne({ email }, { $set: { name, passwordHash } });
    console.log(`Updated user ${email}`);
  } else {
    await users.insertOne({ email, name, passwordHash, createdAt: new Date().toISOString() });
    console.log(`Created user ${email}`);
  }

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
