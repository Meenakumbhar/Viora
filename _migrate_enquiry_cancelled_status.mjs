import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// The live enquiries.status column has a CHECK constraint limiting it to
// ('new', 'read', 'replied', 'converted') — customers can now cancel a
// placed enquiry (before it's turned into an order), so 'cancelled' needs
// to be an allowed value too.
await sql`ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_status_check`;
console.log('✅ dropped old enquiries_status_check constraint');

await sql`ALTER TABLE enquiries ADD CONSTRAINT enquiries_status_check CHECK (status IN ('new', 'read', 'replied', 'converted', 'cancelled'))`;
console.log('✅ added enquiries_status_check constraint with cancelled included');

const rows = await sql`
  SELECT conname, pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
  WHERE conrelid = 'enquiries'::regclass AND conname = 'enquiries_status_check'
`;
console.log('✅ verification:');
console.table(rows);
