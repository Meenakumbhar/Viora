import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS staff_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  )
`;
console.log('✅ staff_activity table created (or already existed)');

await sql`CREATE INDEX IF NOT EXISTS idx_staff_activity_created_at ON staff_activity(created_at DESC)`;
await sql`CREATE INDEX IF NOT EXISTS idx_staff_activity_order_id ON staff_activity(order_id)`;
console.log('✅ indexes created');

const count = await sql`SELECT COUNT(*) FROM staff_activity`;
console.log(`✅ staff_activity ready — ${count[0].count} rows`);
