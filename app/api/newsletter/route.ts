import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { upsertSubscriber } from '@/lib/db';
import { emailSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, Subscriber } from '@/types/database';

const newsletterSchema = z.object({
  email: emailSchema,
  first_name: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
});

// POST /api/newsletter — Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, newsletterSchema, 'newsletter');
    if (parsed.error) return parsed.error;
    const body = parsed.data;

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
