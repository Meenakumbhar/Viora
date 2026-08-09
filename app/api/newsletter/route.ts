import { NextRequest, NextResponse } from 'next/server';
import { upsertSubscriber } from '@/lib/db';
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

    const result = await upsertSubscriber(body);

    if (result.alreadySubscribed) {
      return NextResponse.json<ApiResponse>(
        { success: true, data: null, message: "You're already on our list!" },
        { status: 200 }
      );
    }

    if (result.resubscribed) {
      return NextResponse.json<ApiResponse>(
        { success: true, data: null, message: "Welcome back! You've been resubscribed." },
        { status: 200 }
      );
    }

    return NextResponse.json<ApiResponse<Subscriber>>(
      {
        success: true,
        data: result.subscriber as Subscriber,
        message: "You're subscribed! Thank you for joining the studio.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[newsletter] error:', err);
    const message =
      err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return NextResponse.json<ApiResponse>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
