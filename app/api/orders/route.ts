import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAllOrders, createOrder } from '@/lib/db';
import { sendOrderPlacedEmail } from '@/lib/resend';
import { emailSchema, portfolioItemRefsSchema } from '@/lib/schemas';
import { parseJsonBody } from '@/lib/validation';
import type { ApiResponse, Order } from '@/types/database';

const createOrderSchema = z.object({
  customer_name: z.string().trim().min(1, 'Customer name is required.').max(200),
  customer_email: emailSchema,
  service_type: z.string().trim().min(1, 'Service type is required.').max(100),
  event_date: z.string().trim().max(50).nullish(),
  quantity_estimate: z.string().trim().max(50).nullish(),
  details: z.string().trim().max(5000).nullish(),
  enquiry_id: z.string().trim().max(100).nullish(),
  portfolio_items: portfolioItemRefsSchema,
});

// GET /api/orders — List all orders (admin only, gated in middleware.ts)
export async function GET() {
  try {
    const orders = await getAllOrders();
    return NextResponse.json<ApiResponse<Order[]>>({ success: true, data: orders });
  } catch (err) {
    console.error('[orders] list error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to fetch orders.' }, { status: 500 });
  }
}

// POST /api/orders — Manually create an order (admin only, gated in middleware.ts)
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, createOrderSchema, 'orders');
    if (parsed.error) return parsed.error;
    const { customer_name, customer_email, service_type, event_date, quantity_estimate, details, enquiry_id, portfolio_items } = parsed.data;

    const order = await createOrder({
      customer_name,
      customer_email,
      service_type,
      event_date: event_date || null,
      quantity_estimate: quantity_estimate ?? null,
      details: details ?? null,
      enquiry_id: enquiry_id ?? null,
      portfolio_items: portfolio_items ?? null,
    });

    try {
      await sendOrderPlacedEmail({
        id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        service_type: order.service_type,
        event_date: order.event_date,
        quantity_estimate: order.quantity_estimate,
      });
    } catch (emailErr) {
      console.error('[orders] placed-email failed:', emailErr);
    }

    return NextResponse.json<ApiResponse<Order>>({ success: true, data: order }, { status: 201 });
  } catch (err) {
    console.error('[orders] create error:', err);
    return NextResponse.json<ApiResponse>({ success: false, error: 'Failed to create order.' }, { status: 500 });
  }
}
