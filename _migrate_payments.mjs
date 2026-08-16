import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'`;
await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2)`;
await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id TEXT`;
console.log('✅ Payment columns added to orders table');
