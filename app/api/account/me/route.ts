import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserById, toPublicUser, updateUserProfile } from '@/lib/db';
import { auth } from '@/lib/auth';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, PublicUser } from '@/types/database';

// GET /api/account/me — lets client components (e.g. QuoteForm) check whether
// a customer is logged in and prefill their saved contact details. Returns
// 401 rather than null for "not logged in" so callers can't confuse it with
// a logged-in user who simply has no data yet.
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  return NextResponse.json<ApiResponse<PublicUser>>({ success: true, data: toPublicUser(user) });
}

const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  phone: z.string().trim().max(50).optional(),
  country: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
});

// PATCH /api/account/me — lets a logged-in customer update their own name,
// phone, and country from the dashboard's profile card.
export async function PATCH(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Not logged in.' }, { status: 401 });
  }

  const parsed = await parseJsonBody(request, updateProfileSchema, 'account/me');
  if (parsed.error) return parsed.error;

  const updated = await updateUserProfile(session.user.id, parsed.data);
  if (!updated) {
    return NextResponse.json<ApiResponse>({ success: false, error: 'Could not update profile.' }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<PublicUser>>({ success: true, data: toPublicUser(updated) });
}
