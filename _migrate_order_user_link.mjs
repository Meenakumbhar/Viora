import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Adds a real user_id link on orders and enquiries (previously matched to
// an account only by comparing customer_email to the user's email — a
// loose text match, not a foreign key). Existing rows are backfilled by
// that same email match; going forward, lib/db.ts sets user_id directly at
// creation time whenever the customer is logged in.

await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id text REFERENCES "user"(id) ON DELETE SET NULL`;
await sql`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS user_id text REFERENCES "user"(id) ON DELETE SET NULL`;

await sql`CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders(user_id)`;
await sql`CREATE INDEX IF NOT EXISTS enquiries_user_id_idx ON enquiries(user_id)`;

const backfilledOrders = await sql`
  UPDATE orders o SET user_id = u.id
  FROM "user" u
  WHERE lower(o.customer_email) = lower(u.email) AND o.user_id IS NULL
  RETURNING o.id
`;
const backfilledEnquiries = await sql`
  UPDATE enquiries e SET user_id = u.id
  FROM "user" u
  WHERE lower(e.email) = lower(u.email) AND e.user_id IS NULL
  RETURNING e.id
`;

console.log(`Backfilled ${backfilledOrders.length} order(s), ${backfilledEnquiries.length} enquiry(ies).`);
