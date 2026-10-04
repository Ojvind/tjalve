import { buildApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';

async function main() {
  await connectDb();
  const app = buildApp();
  await app.listen({ port: config.port, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
