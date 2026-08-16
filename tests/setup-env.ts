// Vitest doesn't load .env.local the way Next.js does — read it directly so
// integration tests (Drizzle) can reach the real dev database.
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '../.env.local');

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue; // real env (e.g. CI secrets) wins
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}
