import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Admin pages get their own isolated layout — no Nav or Footer from the root layout
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
