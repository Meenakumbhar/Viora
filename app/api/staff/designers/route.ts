import { NextResponse } from 'next/server';
import { getDesigners } from '@/lib/db';
import type { ApiResponse } from '@/types/database';

// GET /api/staff/designers — list of designer accounts, for the proofreader's assignment dropdown
// (staff role only, gated in proxy.ts — read-only, harmless for any staff member to see).
export async function GET() {
  try {
    const designers = await getDesigners();
    return NextResponse.json<ApiResponse<typeof designers>>({ success: true, data: designers });
  } catch (err) {
    console.error('[staff/designers] error:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong.';
    return NextResponse.json<ApiResponse>({ success: false, error: message }, { status: 500 });
  }
}
