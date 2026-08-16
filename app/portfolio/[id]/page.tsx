import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPortfolioItemById } from '@/lib/db';
import PortfolioProject from '@/components/PortfolioProject';
import { isCategoryActive } from '@/lib/active-services';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const item = await getPortfolioItemById((await params).id);
  return { title: item?.title ?? 'Portfolio project' };
}

export default async function PortfolioProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const item = await getPortfolioItemById((await params).id);
  if (!item || !isCategoryActive(item.category)) notFound();
  return <PortfolioProject item={item} />;
}
