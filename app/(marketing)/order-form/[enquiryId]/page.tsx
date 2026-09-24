import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEnquiryById } from '@/lib/data/enquiries';
import { getOrderFormByEnquiryId } from '@/lib/data/order-forms';
import { getProducts } from '@/lib/data/products';
import { getPortfolioItems } from '@/lib/data/portfolio';
import OrderFormClient from '@/components/OrderFormClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Form',
  robots: { index: false, follow: false },
};

export default async function OrderFormPage({
  params,
}: {
  params: Promise<{ enquiryId: string }>;
}) {
  const { enquiryId } = await params;
  const enquiry = await getEnquiryById(enquiryId);

  if (!enquiry) {
    notFound();
  }

  const orderForm = await getOrderFormByEnquiryId(enquiryId);
  const products = await getProducts();
  const portfolioItems = await getPortfolioItems();

  return (
    <OrderFormClient
      enquiry={enquiry}
      initialOrderForm={orderForm}
      products={products}
      portfolioItems={portfolioItems}
    />
  );
}
