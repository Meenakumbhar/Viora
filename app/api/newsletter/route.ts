import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
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

    const supabase = createAdminClient();
    const email = body.email.trim().toLowerCase();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('subscribers')
      .select('id, active')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      if (existing.active) {
        return NextResponse.json<ApiResponse>(
          { success: true, data: null, message: "You're already on our list!" },
          { status: 200 }
        );
      }
      // Reactivate
      await supabase.from('subscribers').update({ active: true }).eq('id', existing.id);
      return NextResponse.json<ApiResponse>(
        { success: true, data: null, message: "Welcome back! You've been resubscribed." },
        { status: 200 }
      );
    }

    const { data, error } = await supabase
      .from('subscribers')
      .insert({
        email,
        first_name: body.first_name?.trim() || null,
        country: body.country?.trim() || null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[newsletter] insert error:', error.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<Subscriber>>(
      { success: true, data, message: "You're subscribed! Thank you for joining the studio." },
      { status: 201 }
    );
  } catch (err) {
    console.error('[newsletter] error:', err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
