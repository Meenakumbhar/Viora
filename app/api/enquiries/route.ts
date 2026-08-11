import { NextRequest, NextResponse } from 'next/server';
import { insertEnquiry } from '@/lib/db';
import type { EnquiryPayload, ApiResponse, Enquiry, PortfolioItemRef } from '@/types/database';

// Public endpoint — sanitize the client-supplied portfolio item list rather than trusting it verbatim.
function sanitizePortfolioItems(value: unknown): PortfolioItemRef[] | null {
  if (!Array.isArray(value)) return null;
  const items = value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .slice(0, 20)
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id.slice(0, 100) : '',
      title: typeof item.title === 'string' ? item.title.slice(0, 200) : '',
      category: typeof item.category === 'string' ? item.category.slice(0, 50) : '',
    }))
    .filter((item) => item.id && item.title);
  return items.length > 0 ? items : null;
}

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

    const enquiry = await insertEnquiry({
      ...body,
      portfolio_items: sanitizePortfolioItems(body.portfolio_items),
    });

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
