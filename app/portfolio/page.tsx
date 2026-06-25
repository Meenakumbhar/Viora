import type { Metadata } from 'next';
import PortfolioPageContent from '@/components/PortfolioPageContent';
import { getPortfolioItems } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'View our portfolio of custom wedding invitations, memorial booklets, sports team programmes, and corporate branding work.',
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const items = await getPortfolioItems();
  const normalizedCategory = typeof category === 'string' ? category.toLowerCase() : 'all';

  return (
    <PortfolioPageContent
      key={normalizedCategory}
      initialItems={items}
      initialCategory={normalizedCategory}
    />
  );
}
