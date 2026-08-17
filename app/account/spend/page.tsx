import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserById, getOrdersByEmail, getEnquiriesByEmail } from '@/lib/db';
import { auth } from '@/lib/auth';
import UserLogoutButton from '@/components/ui/UserLogoutButton';
import AccountShell from '@/components/dashboard/AccountShell';
import SpendSummary, { type MonthlySpend, type CategorySpend, type ProviderSpend } from '@/components/dashboard/SpendSummary';
import { serviceTypeToCategory, CATEGORY_ACCENT, CATEGORY_LABELS } from '@/lib/order-category';
import type { DisplayStage } from '@/components/ui/OrderStepper';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Spend sheet',
  robots: { index: false, follow: false },
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SPEND_MONTHS = 6;

export default async function SpendPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/login');

  const user = await getUserById(session.user.id);
  if (!user) redirect('/login');

  const [orders, enquiries] = await Promise.all([
    getOrdersByEmail(user.email),
    getEnquiriesByEmail(user.email),
  ]);

  const paidOrders = orders.filter((o) => o.payment_status === 'paid' && o.payment_amount !== null);
  const unpaidOrders = orders.filter((o) => o.payment_status !== 'paid' && o.payment_amount !== null && o.payment_amount > 0);

  const totalSpent = paidOrders.reduce((sum, o) => sum + (o.payment_amount ?? 0), 0);
  const totalPending = unpaidOrders.reduce((sum, o) => sum + (o.payment_amount ?? 0), 0);
  const avgOrderValue = paidOrders.length > 0 ? totalSpent / paidOrders.length : 0;

  const convertedEnquiryIds = new Set(orders.filter((o) => o.enquiry_id).map((o) => o.enquiry_id as string));
  const placedCount = enquiries.filter((e) => !convertedEnquiryIds.has(e.id)).length;

  const statusCounts: Partial<Record<DisplayStage, number>> = { placed: placedCount };
  for (const order of orders) {
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1;
  }

  const now = new Date();
  const byMonth: MonthlySpend[] = Array.from({ length: SPEND_MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (SPEND_MONTHS - 1 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }).map(({ year, month }) => {
    const amount = paidOrders
      .filter((o) => {
        const created = new Date(o.created_at);
        return created.getFullYear() === year && created.getMonth() === month;
      })
      .reduce((sum, o) => sum + (o.payment_amount ?? 0), 0);
    return { label: MONTH_LABELS[month], fullLabel: `${MONTH_FULL[month]} ${year}`, amount };
  });

  const categoryTotals = new Map<string, number>();
  for (const order of paidOrders) {
    const category = serviceTypeToCategory(order.service_type);
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + (order.payment_amount ?? 0));
  }
  const byCategory: CategorySpend[] = Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      label: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS],
      amount,
      color: CATEGORY_ACCENT[category as keyof typeof CATEGORY_ACCENT],
    }))
    .sort((a, b) => b.amount - a.amount);

  const providerTotals = new Map<string, { count: number; amount: number }>();
  for (const order of paidOrders) {
    if (!order.payment_provider) continue;
    const existing = providerTotals.get(order.payment_provider) ?? { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += order.payment_amount ?? 0;
    providerTotals.set(order.payment_provider, existing);
  }
  const PROVIDER_LABELS: Record<string, string> = { paypal: 'PayPal', razorpay: 'Razorpay' };
  const byProvider: ProviderSpend[] = Array.from(providerTotals.entries()).map(([provider, data]) => ({
    provider: provider === 'paypal' || provider === 'razorpay' ? provider : null,
    label: PROVIDER_LABELS[provider] ?? provider,
    count: data.count,
    amount: data.amount,
  }));

  return (
    <AccountShell
      userName={user.name ? user.name : 'Welcome back'}
      memberSince={new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
      logoutSlot={<UserLogoutButton />}
    >
      {orders.length === 0 ? (
        <p className="border border-dashed border-border px-5 py-8 text-center font-body text-body-base text-text-muted">
          Nothing to show yet — your spend sheet fills in once you place an order.
        </p>
      ) : (
        <SpendSummary
          totalSpent={totalSpent}
          totalPending={totalPending}
          avgOrderValue={avgOrderValue}
          byMonth={byMonth}
          byCategory={byCategory}
          byProvider={byProvider}
          statusCounts={statusCounts}
        />
      )}
    </AccountShell>
  );
}
