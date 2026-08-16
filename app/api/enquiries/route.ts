import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertEnquiry, updateUserProfile } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendEnquiryAutoReply } from '@/lib/resend';
import { emailSchema, portfolioItemRefsSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, Enquiry } from '@/types/database';

// Public endpoint — every field is customer-supplied, so nothing here is trusted verbatim.
// Optional fields use .nullish() rather than .optional() because both quote
// forms send an explicit `null` (not just an omitted key) for anything left
// blank — e.g. phone, event date, source.
const enquirySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(200),
  email: emailSchema,
  phone: z.string().trim().max(50).nullish(),
  country: z.string().trim().max(100).nullish(),
  service_type: z.string().trim().min(1, 'Service type is required.').max(100),
  event_date: z.string().trim().max(50).nullish(),
  quantity_estimate: z.string().trim().max(50).nullish(),
  description: z.string().trim().max(5000).nullish(),
  address: z.string().trim().max(500).nullish(),
  source: z.string().trim().max(100).nullish(),
  portfolio_items: portfolioItemRefsSchema,
});

// POST /api/enquiries — Submit a new quote/contact enquiry
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, enquirySchema, 'enquiries');
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const enquiry = await insertEnquiry({
      ...body,
      portfolio_items: body.portfolio_items ?? null,
    });

    // The order-form link is the main thing this email needs to deliver —
    // failing to send it shouldn't fail the enquiry submission itself.
    await sendEnquiryAutoReply({ id: enquiry.id, name: enquiry.name, email: enquiry.email }).catch((err) => {
      console.error('[enquiries] confirmation email failed:', err);
    });

    // If this came from a logged-in customer, capture their contact details
    // onto their profile so their next quote can skip re-entering them.
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      await updateUserProfile(session.user.id, {
        name: body.name,
        phone: body.phone ?? null,
        country: body.country ?? null,
      }).catch((err) => {
        console.error('[enquiries] profile save failed:', err);
      });
    }

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
