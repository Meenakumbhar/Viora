import { NextRequest, NextResponse } from 'next/server';
import { getEnquiryById, getOrderFormByEnquiryId, upsertOrderForm } from '@/lib/db';
import { sendOrderFormSubmittedEmail } from '@/lib/resend';
import type { ApiResponse, OrderForm, OrderFormInput, Enquiry } from '@/types/database';

// The enquiry's own UUID is the access key — no login required, matching how
// a customer reaches this from an emailed link before they may even have an
// account. It's not guessable (128-bit UUID), same trust model as portfolio
// and product links elsewhere on the site.

export async function GET(_request: NextRequest, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const { enquiryId } = await params;
    const enquiry = await getEnquiryById(enquiryId);
    if (!enquiry) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Quote not found.' }, { status: 404 });
    }

    const orderForm = await getOrderFormByEnquiryId(enquiryId);

    return NextResponse.json<ApiResponse<{ enquiry: Enquiry; orderForm: OrderForm | null }>>({
      success: true,
      data: { enquiry, orderForm },
    });
  } catch (err) {
    console.error('[order-form] GET error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const { enquiryId } = await params;
    const enquiry = await getEnquiryById(enquiryId);
    if (!enquiry) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Quote not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const submit = body?.submit === true;
    const input: OrderFormInput = body?.form ?? {};

    if (submit && !input.deceased_name?.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Please enter the name of the deceased before submitting.' },
        { status: 400 }
      );
    }

    const orderForm = await upsertOrderForm(enquiryId, input, submit);

    if (submit) {
      await sendOrderFormSubmittedEmail(enquiry, orderForm).catch((err) => {
        console.error('[order-form] submission-notice email failed:', err);
      });
    }

    return NextResponse.json<ApiResponse<OrderForm>>({ success: true, data: orderForm });
  } catch (err) {
    console.error('[order-form] POST error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
