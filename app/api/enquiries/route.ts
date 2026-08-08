import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
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

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('enquiries')
      .insert({
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        country: body.country?.trim() || null,
        service_type: body.service_type,
        event_date: body.event_date || null,
        quantity_estimate: body.quantity_estimate || null,
        description: body.description?.trim() || null,
        source: body.source || 'website',
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('[enquiries] insert error:', error.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to submit your enquiry. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Enquiry>>(
      {
        success: true,
        data,
        message: "Your enquiry has been received. We'll be in touch within 1 business day.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[enquiries] error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
