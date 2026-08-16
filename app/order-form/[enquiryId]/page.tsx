import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getEnquiryById, getOrderFormByEnquiryId } from '@/lib/db';
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

  return <OrderFormClient enquiry={enquiry} initialOrderForm={orderForm} />;
}
