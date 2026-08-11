import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const total = await sql`SELECT COUNT(*) FROM orders`;
const all = await sql`SELECT id, customer_name, customer_email, service_type, status, created_at FROM orders ORDER BY created_at DESC LIMIT 20`;
const users = await sql`SELECT id, email, name, email_verified FROM users ORDER BY created_at DESC LIMIT 20`;

console.log(JSON.stringify({ totalOrders: total[0], orders: all, users }, null, 2));
