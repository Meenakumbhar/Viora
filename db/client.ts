import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as appSchema from './schema';
import * as authSchema from './auth-schema';

const schema = { ...appSchema, ...authSchema };

const DATABASE_URL = process.env.DATABASE_URL;

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Same nullable-if-unconfigured shape as lib/db.ts's getDb() — callers check
// for null and fall back to static seed data when DATABASE_URL isn't set.
export function getDrizzle() {
  if (!DATABASE_URL) return null;
  if (!dbInstance) {
    dbInstance = drizzle(neon(DATABASE_URL), { schema });
  }
  return dbInstance;
}
