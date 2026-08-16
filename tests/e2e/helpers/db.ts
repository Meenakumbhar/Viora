import '../../setup-env';
import { eq } from 'drizzle-orm';
import { getDrizzle } from '@/db/client';
import { user } from '@/db/auth-schema';
import { orders } from '@/db/schema';

function requireDb() {
  const db = getDrizzle();
  if (!db) throw new Error('DATABASE_URL is not set — e2e tests require a real database connection.');
  return db;
}

// Better Auth issues a session cookie only after email verification. E2E
// tests can't click a real inbox link, so sign up via the real API (to get
// real password hashing) and then flip this flag directly — the same
// shortcut used for manual verification throughout this project's testing.
export async function verifyTestUser(email: string) {
  const db = requireDb();
  await db.update(user).set({ emailVerified: true }).where(eq(user.email, email));
}

export async function deleteTestUser(email: string) {
  const db = requireDb();
  await db.delete(user).where(eq(user.email, email));
}

export async function createTestOrder(customerEmail: string, paymentAmount: number): Promise<string> {
  const db = requireDb();
  const rows = await db
    .insert(orders)
    .values({
      customer_name: 'Playwright Runner',
      customer_email: customerEmail,
      service_type: 'E2E test order',
      status: 'pending',
      payment_status: 'unpaid',
      payment_amount: paymentAmount.toString(),
    })
    .returning();
  return rows[0].id;
}

export async function deleteTestOrder(id: string) {
  const db = requireDb();
  await db.delete(orders).where(eq(orders.id, id));
}
