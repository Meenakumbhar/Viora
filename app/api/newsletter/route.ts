import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { SubscriberPayload, ApiResponse, Subscriber } from '@/types/database';

// POST /api/newsletter — Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const body: SubscriberPayload = await request.json();

    if (!body.email?.trim()) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Email address is required.' },
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

    const supabase = await createClient();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, active')
      .eq('email', body.email.trim().toLowerCase())
      .single();

    if (existing) {
      if (existing.active) {
        return NextResponse.json<ApiResponse>(
          { success: true, data: null, message: 'You\'re already on our list!' },
          { status: 200 }
        );
      }
      // Reactivate if previously unsubscribed
      const { error: updateError } = await supabase
        .from('subscribers')
        .update({ active: true })
        .eq('id', existing.id);

      if (updateError) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: 'Failed to resubscribe. Please try again.' },
          { status: 500 }
        );
      }
      return NextResponse.json<ApiResponse>(
        { success: true, data: null, message: 'Welcome back! You\'ve been resubscribed.' },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email: body.email.trim().toLowerCase(),
        first_name: body.first_name?.trim() || null,
        country: body.country?.trim() || null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[newsletter] Supabase insert error:', error.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Subscriber>>(
      { success: true, data, message: 'You\'re subscribed! Thank you for joining the studio.' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[newsletter] Unexpected error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
