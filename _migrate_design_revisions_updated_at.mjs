import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE design_revisions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ`;
console.log('✅ updated_at column added (or already existed)');

await sql`UPDATE design_revisions SET updated_at = created_at WHERE updated_at IS NULL`;
console.log('✅ backfilled updated_at from created_at on existing rows');

await sql`ALTER TABLE design_revisions ALTER COLUMN updated_at SET NOT NULL`;
await sql`ALTER TABLE design_revisions ALTER COLUMN updated_at SET DEFAULT NOW()`;
console.log('✅ updated_at locked to NOT NULL with a default of NOW()');

const rows = await sql`SELECT id, version, status, created_at, updated_at FROM design_revisions ORDER BY created_at DESC LIMIT 5`;
console.log(`✅ sample rows:`);
console.table(rows);
