import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

await sql`
CREATE TABLE IF NOT EXISTS product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_label TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (product_id, size_label)
)
`;
console.log('✅ product_prices table created (or already existed)');

await sql`
CREATE TABLE IF NOT EXISTS customer_product_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size_label TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, product_id, size_label)
)
`;
console.log('✅ customer_product_prices table created (or already existed)');

const rows = await sql`
  SELECT table_name FROM information_schema.tables
  WHERE table_name IN ('product_prices', 'customer_product_prices')
  ORDER BY table_name
`;
console.log('✅ verification:');
console.table(rows);
