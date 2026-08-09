import { NextRequest, NextResponse } from 'next/server';
import { insertEnquiry } from '@/lib/db';
import type { EnquiryPayload, ApiResponse, Enquiry } from '@/types/database';

// POST /api/enquiries — Submit a new quote/contact enquiry
export async function POST(request: NextRequest) {
  try {
    const body: EnquiryPayload = await request.json();

    if (!body.name?.trim() || !body.email?.trim() || !body.service_type?.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Name, email, and service type are required.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const enquiry = await insertEnquiry(body);

    return NextResponse.json<ApiResponse<Enquiry>>(
      {
        success: true,
        data: enquiry,
        message: "Your enquiry has been received. We'll be in touch within 1 business day.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[enquiries] error:', err);
    const message =
      err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
