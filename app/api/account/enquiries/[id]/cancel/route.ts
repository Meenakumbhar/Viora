import { NextRequest, NextResponse } from 'next/server';
import { getEnquiryById, getUserById, getOrderByEnquiryId, cancelEnquiry } from '@/lib/db';
import { auth } from '@/lib/auth';
import type { ApiResponse, Enquiry } from '@/types/database';

// POST /api/account/enquiries/[id]/cancel — a customer withdrawing their own
// placed enquiry, only while it's still just a quote (see deriveDisplayStage
// in lib/order-stage.ts — 'enquiry_received' only applies pre-order).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await getUserById(session.user.id);
    if (!user) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const enquiry = await getEnquiryById(id);
    if (!enquiry) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Enquiry not found.' }, { status: 404 });
    }
    if (enquiry.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden.' }, { status: 403 });
    }

    if (enquiry.status === 'cancelled') {
      return NextResponse.json<ApiResponse<Enquiry>>({ success: true, data: enquiry });
    }

    // Once staff have started an order against this enquiry, it's too late
    // to just withdraw it — the customer needs to contact the studio instead.
    const existingOrder = await getOrderByEnquiryId(id);
    if (existingOrder) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'This enquiry has already become an order and can no longer be cancelled here.' },
        { status: 409 }
      );
    }

    const updated = await cancelEnquiry(id);
    if (!updated) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Something went wrong.' }, { status: 500 });
    }

    return NextResponse.json<ApiResponse<Enquiry>>({ success: true, data: updated });
  } catch (err) {
    console.error('[account/enquiries/:id/cancel] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
