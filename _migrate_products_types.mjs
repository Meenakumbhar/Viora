import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS type_slug TEXT`;
await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS type_label TEXT`;
console.log('✅ type_slug/type_label columns added (or already existed)');

await sql`UPDATE products SET type_slug = slug WHERE type_slug IS NULL`;
await sql`UPDATE products SET type_label = title WHERE type_label IS NULL`;
console.log('✅ backfilled type_slug/type_label from slug/title on existing rows');

await sql`ALTER TABLE products ALTER COLUMN type_slug SET NOT NULL`;
await sql`ALTER TABLE products ALTER COLUMN type_label SET NOT NULL`;
console.log('✅ type_slug/type_label locked to NOT NULL');

await sql`CREATE INDEX IF NOT EXISTS idx_products_type_slug ON products(type_slug, published)`;
console.log('✅ idx_products_type_slug created');

const rows = await sql`SELECT slug, type_slug, type_label FROM products ORDER BY slug`;
console.log(`✅ ${rows.length} products now have types:`);
console.table(rows);
