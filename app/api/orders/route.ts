import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/db';
import { sendOrderPlacedEmail } from '@/lib/resend';
import type { ApiResponse, Order, PortfolioItemRef } from '@/types/database';

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
    const body = await request.json().catch(() => ({}));
    const { customer_name, customer_email, service_type, event_date, quantity_estimate, details, enquiry_id, portfolio_items } = body;

    if (typeof customer_name !== 'string' || !customer_name.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Customer name is required.' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof customer_email !== 'string' || !emailRegex.test(customer_email)) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'A valid customer email is required.' }, { status: 400 });
    }
    if (typeof service_type !== 'string' || !service_type.trim()) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Service type is required.' }, { status: 400 });
    }

    const order = await createOrder({
      customer_name,
      customer_email,
      service_type,
      event_date: typeof event_date === 'string' && event_date ? event_date : null,
      quantity_estimate: typeof quantity_estimate === 'string' ? quantity_estimate : null,
      details: typeof details === 'string' ? details : null,
      enquiry_id: typeof enquiry_id === 'string' ? enquiry_id : null,
      portfolio_items: sanitizePortfolioItems(portfolio_items),
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
