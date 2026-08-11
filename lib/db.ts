import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { portfolioItems as staticPortfolio, blogPosts as staticBlog } from './data';
import type {
  PortfolioItem,
  Post,
  Enquiry,
  Subscriber,
  EnquiryPayload,
  SubscriberPayload,
  ServiceCategory,
  PortfolioFilters,
  Order,
  OrderInput,
  OrderStatus,
  OrderStatusHistoryEntry,
  PortfolioItemRef,
} from '@/types/database';

/**
 * Neon Serverless PostgreSQL Client & Repository Helpers
 */

const DATABASE_URL = process.env.DATABASE_URL;

let sqlInstance: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> | null {
  if (!DATABASE_URL) {
    return null;
  }
  if (!sqlInstance) {
    sqlInstance = neon(DATABASE_URL);
  }
  return sqlInstance;
}

// ─── Row Normalizers ─────────────────────────────────────────────────────────

function toIsoDateString(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    return val;
  }
  return String(val);
}

function toIsoTimestampString(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  return String(val);
}

function normalizePost(row: any): Post {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    content: String(row.content ?? ''),
    excerpt: row.excerpt != null ? String(row.excerpt) : null,
    category: row.category != null ? String(row.category) : null,
    image_url: row.image_url != null ? String(row.image_url) : null,
    published_at: toIsoDateString(row.published_at),
    published: Boolean(row.published),
    created_at: toIsoTimestampString(row.created_at),
  };
}

function normalizePortfolioItem(row: any): PortfolioItem {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    category: row.category as ServiceCategory,
    filters: typeof row.filters === 'object' && row.filters !== null ? row.filters : {},
    image_url: String(row.image_url ?? ''),
    image_urls: Array.isArray(row.image_urls) ? row.image_urls : null,
    description: row.description != null ? String(row.description) : null,
    location: row.location != null ? String(row.location) : null,
    published: Boolean(row.published),
    created_at: toIsoTimestampString(row.created_at),
  };
}

function normalizePortfolioItemRefs(value: unknown): PortfolioItemRef[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      id: String(item.id ?? ''),
      title: String(item.title ?? ''),
      category: String(item.category ?? ''),
    }));
}

function normalizeEnquiry(row: any): Enquiry {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: row.phone != null ? String(row.phone) : null,
    country: row.country != null ? String(row.country) : null,
    service_type: String(row.service_type ?? ''),
    event_date: row.event_date != null ? toIsoDateString(row.event_date) : null,
    quantity_estimate: row.quantity_estimate != null ? String(row.quantity_estimate) : null,
    description: row.description != null ? String(row.description) : null,
    source: row.source != null ? String(row.source) : null,
    portfolio_items: normalizePortfolioItemRefs(row.portfolio_items),
    created_at: toIsoTimestampString(row.created_at),
    status: row.status,
  };
}

function normalizeOrder(row: any): Order {
  return {
    id: String(row.id),
    enquiry_id: row.enquiry_id != null ? String(row.enquiry_id) : null,
    customer_name: String(row.customer_name ?? ''),
    customer_email: String(row.customer_email ?? ''),
    service_type: String(row.service_type ?? ''),
    event_date: row.event_date != null ? toIsoDateString(row.event_date) : null,
    quantity_estimate: row.quantity_estimate != null ? String(row.quantity_estimate) : null,
    details: row.details != null ? String(row.details) : null,
    portfolio_items: normalizePortfolioItemRefs(row.portfolio_items),
    status: row.status,
    created_at: toIsoTimestampString(row.created_at),
    updated_at: toIsoTimestampString(row.updated_at),
  };
}

function normalizeOrderHistoryEntry(row: any): OrderStatusHistoryEntry {
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    status: row.status,
    note: row.note != null ? String(row.note) : null,
    created_at: toIsoTimestampString(row.created_at),
  };
}

function normalizeSubscriber(row: any): Subscriber {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    first_name: row.first_name != null ? String(row.first_name) : null,
    country: row.country != null ? String(row.country) : null,
    subscribed_at: toIsoTimestampString(row.subscribed_at),
    active: Boolean(row.active),
  };
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export async function getPortfolioItems(category?: string): Promise<PortfolioItem[]> {
  const sql = getDb();

  if (sql) {
    try {
      let rows;
      if (category && category !== 'all') {
        rows = await sql`
          SELECT id, title, category, filters, image_url, image_urls, description, location, published, created_at
          FROM portfolio_items
          WHERE published = true AND category = ${category}
          ORDER BY created_at DESC
        `;
      } else {
        rows = await sql`
          SELECT id, title, category, filters, image_url, image_urls, description, location, published, created_at
          FROM portfolio_items
          WHERE published = true
          ORDER BY created_at DESC
        `;
      }

      if (rows && rows.length > 0) {
        return (rows as any[]).map(normalizePortfolioItem);
      }

    } catch (err) {
      console.error('[db] getPortfolioItems error:', err);
    }
  }

  // Static fallback if DB is not yet populated or configured
  let filtered = staticPortfolio;
  if (category && category !== 'all') {
    filtered = staticPortfolio.filter((item) => item.category === category);
  }

  return filtered.map((item, index) => ({
    id: `static-portfolio-${index}`,
    title: item.title,
    category: item.category as ServiceCategory,
    filters: item.filters,
    image_url: `/images/portfolio/${item.category}.jpg`,
    description: item.description,
    location: item.location,
    published: true,
    created_at: new Date().toISOString(),
  }));
}

export async function getPortfolioItemById(id: string): Promise<PortfolioItem | null> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`
        SELECT id, title, category, filters, image_url, image_urls, description, location, published, created_at
        FROM portfolio_items
        WHERE id = ${id} AND published = true
        LIMIT 1
      `;
      if (rows.length > 0) return normalizePortfolioItem(rows[0]);
    } catch (err) {
      console.error(`[db] getPortfolioItemById(${id}) error:`, err);
    }
  }

  const index = id.startsWith('static-portfolio-') ? Number(id.replace('static-portfolio-', '')) : -1;
  const item = Number.isInteger(index) && index >= 0 ? staticPortfolio[index] : undefined;
  return item
    ? {
        id,
        title: item.title,
        category: item.category as ServiceCategory,
        filters: item.filters,
        image_url: `/images/portfolio/${item.category}.jpg`,
        description: item.description,
        location: item.location,
        published: true,
        created_at: new Date().toISOString(),
      }
    : null;
}

export interface PortfolioItemInput {
  title: string;
  category: ServiceCategory;
  filters: PortfolioFilters;
  image_url: string;
  image_urls?: string[] | null;
  description: string | null;
  location: string | null;
  published: boolean;
}

// Admin-only: every item regardless of published state
export async function getAllPortfolioItemsForAdmin(): Promise<PortfolioItem[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, title, category, filters, image_url, image_urls, description, location, published, created_at
      FROM portfolio_items
      ORDER BY created_at DESC
    `;
    return (rows as any[]).map(normalizePortfolioItem);
  } catch (err) {
    console.error('[db] getAllPortfolioItemsForAdmin error:', err);
    return [];
  }
}

export async function createPortfolioItem(input: PortfolioItemInput): Promise<PortfolioItem> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const imageUrlsJson = input.image_urls && input.image_urls.length > 0 ? JSON.stringify(input.image_urls) : null;

  const rows = await sql`
    INSERT INTO portfolio_items (title, category, filters, image_url, image_urls, description, location, published)
    VALUES (
      ${input.title.trim()},
      ${input.category},
      ${JSON.stringify(input.filters ?? {})}::jsonb,
      ${input.image_url},
      ${imageUrlsJson}::jsonb,
      ${input.description?.trim() || null},
      ${input.location?.trim() || null},
      ${input.published}
    )
    RETURNING id, title, category, filters, image_url, image_urls, description, location, published, created_at
  `;

  return normalizePortfolioItem(rows[0]);
}

export async function updatePortfolioItem(id: string, input: PortfolioItemInput): Promise<PortfolioItem | null> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const imageUrlsJson = input.image_urls && input.image_urls.length > 0 ? JSON.stringify(input.image_urls) : null;

  const rows = await sql`
    UPDATE portfolio_items
    SET
      title = ${input.title.trim()},
      category = ${input.category},
      filters = ${JSON.stringify(input.filters ?? {})}::jsonb,
      image_url = ${input.image_url},
      image_urls = ${imageUrlsJson}::jsonb,
      description = ${input.description?.trim() || null},
      location = ${input.location?.trim() || null},
      published = ${input.published}
    WHERE id = ${id}
    RETURNING id, title, category, filters, image_url, image_urls, description, location, published, created_at
  `;

  return rows.length > 0 ? normalizePortfolioItem(rows[0]) : null;
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await sql`DELETE FROM portfolio_items WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getBlogPosts(limit = 20): Promise<Post[]> {
  const sql = getDb();

  if (sql) {
    try {
      const rows = await sql`
        SELECT id, title, slug, content, excerpt, category, image_url, published_at, published, created_at
        FROM posts
        WHERE published = true
        ORDER BY published_at DESC
        LIMIT ${limit}
      `;

      if (rows && rows.length > 0) {
        return (rows as any[]).map(normalizePost);
      }
    } catch (err) {
      console.error('[db] getBlogPosts error:', err);
    }
  }

  // Static fallback
  return staticBlog.slice(0, limit).map((post, index) => ({
    id: `static-post-${index}`,
    title: post.title,
    slug: post.slug,
    content: '',
    excerpt: post.excerpt,
    category: post.category,
    image_url: post.image_url || `/images/blog/${post.slug}.jpg`,
    published_at: post.published_at || new Date().toISOString().split('T')[0],
    published: true,
    created_at: new Date().toISOString(),
  }));
}

export async function getBlogPostBySlug(slug: string): Promise<Post | null> {
  const sql = getDb();

  if (sql) {
    try {
      const rows = await sql`
        SELECT id, title, slug, content, excerpt, category, image_url, published_at, published, created_at
        FROM posts
        WHERE slug = ${slug} AND published = true
        LIMIT 1
      `;

      if (rows && rows.length > 0) {
        return normalizePost(rows[0]);
      }
    } catch (err) {
      console.error(`[db] getBlogPostBySlug(${slug}) error:`, err);
    }
  }

  // Static fallback
  const staticPost = staticBlog.find((p) => p.slug === slug);
  if (staticPost) {
    return {
      id: `static-post-${slug}`,
      title: staticPost.title,
      slug: staticPost.slug,
      content: '',
      excerpt: staticPost.excerpt,
      category: staticPost.category,
      image_url: staticPost.image_url || `/images/blog/${staticPost.slug}.jpg`,
      published_at: staticPost.published_at || new Date().toISOString().split('T')[0],
      published: true,
      created_at: new Date().toISOString(),
    };
  }

  return null;
}

// ─── Enquiries ────────────────────────────────────────────────────────────────

export async function insertEnquiry(payload: EnquiryPayload): Promise<Enquiry> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const portfolioItemsJson = payload.portfolio_items && payload.portfolio_items.length > 0
    ? JSON.stringify(payload.portfolio_items)
    : null;

  const rows = await sql`
    INSERT INTO enquiries (
      name,
      email,
      phone,
      country,
      service_type,
      event_date,
      quantity_estimate,
      description,
      source,
      portfolio_items,
      status
    ) VALUES (
      ${payload.name.trim()},
      ${payload.email.trim().toLowerCase()},
      ${payload.phone?.trim() || null},
      ${payload.country?.trim() || null},
      ${payload.service_type},
      ${payload.event_date || null},
      ${payload.quantity_estimate || null},
      ${payload.description?.trim() || null},
      ${payload.source || 'website'},
      ${portfolioItemsJson}::jsonb,
      'new'
    )
    RETURNING id, name, email, phone, country, service_type, event_date, quantity_estimate, description, source, portfolio_items, created_at, status
  `;

  return normalizeEnquiry(rows[0]);
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(input: OrderInput): Promise<Order> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const portfolioItemsJson = input.portfolio_items && input.portfolio_items.length > 0
    ? JSON.stringify(input.portfolio_items)
    : null;

  const rows = await sql`
    INSERT INTO orders (enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status)
    VALUES (
      ${input.enquiry_id ?? null},
      ${input.customer_name.trim()},
      ${input.customer_email.trim().toLowerCase()},
      ${input.service_type.trim()},
      ${input.event_date || null},
      ${input.quantity_estimate?.trim() || null},
      ${input.details?.trim() || null},
      ${portfolioItemsJson}::jsonb,
      'pending'
    )
    RETURNING id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, created_at, updated_at
  `;

  const order = normalizeOrder(rows[0]);

  await sql`
    INSERT INTO order_status_history (order_id, status, note)
    VALUES (${order.id}, 'pending', NULL)
  `;

  return order;
}

export async function getAllOrders(): Promise<Order[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, created_at, updated_at
      FROM orders
      ORDER BY created_at DESC
    `;
    return (rows as any[]).map(normalizeOrder);
  } catch (err) {
    console.error('[db] getAllOrders error:', err);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const sql = getDb();
  if (!sql) return null;

  const rows = await sql`
    SELECT id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, created_at, updated_at
    FROM orders
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus, note?: string | null): Promise<Order | null> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await sql`
    UPDATE orders
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, created_at, updated_at
  `;

  if (rows.length === 0) return null;

  await sql`
    INSERT INTO order_status_history (order_id, status, note)
    VALUES (${id}, ${status}, ${note?.trim() || null})
  `;

  return normalizeOrder(rows[0]);
}

export async function getOrderHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
  const sql = getDb();
  if (!sql) return [];

  const rows = await sql`
    SELECT id, order_id, status, note, created_at
    FROM order_status_history
    WHERE order_id = ${orderId}
    ORDER BY created_at ASC
  `;

  return (rows as any[]).map(normalizeOrderHistoryEntry);
}

// ─── Subscribers ──────────────────────────────────────────────────────────────

export async function upsertSubscriber(payload: SubscriberPayload): Promise<{
  subscriber: Subscriber | null;
  alreadySubscribed: boolean;
  resubscribed: boolean;
}> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const email = payload.email.trim().toLowerCase();

  // Check if subscriber exists
  const existing = await sql`
    SELECT id, email, first_name, country, subscribed_at, active
    FROM subscribers
    WHERE email = ${email}
    LIMIT 1
  `;

  if (existing && existing.length > 0) {
    const sub = normalizeSubscriber(existing[0]);
    if (sub.active) {
      return { subscriber: sub, alreadySubscribed: true, resubscribed: false };
    }

    // Reactivate
    const updated = await sql`
      UPDATE subscribers
      SET active = true, subscribed_at = NOW()
      WHERE id = ${sub.id}
      RETURNING id, email, first_name, country, subscribed_at, active
    `;
    return { subscriber: normalizeSubscriber(updated[0]), alreadySubscribed: false, resubscribed: true };
  }

  // Insert new subscriber
  const inserted = await sql`
    INSERT INTO subscribers (
      email,
      first_name,
      country,
      active
    ) VALUES (
      ${email},
      ${payload.first_name?.trim() || null},
      ${payload.country?.trim() || null},
      true
    )
    RETURNING id, email, first_name, country, subscribed_at, active
  `;

  return { subscriber: normalizeSubscriber(inserted[0]), alreadySubscribed: false, resubscribed: false };
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export async function getAdminDashboardData(): Promise<{
  enquiries: Enquiry[];
  subscribers: Subscriber[];
  portfolioItems: Partial<PortfolioItem>[];
  posts: Partial<Post>[];
  orders: Order[];
}> {
  const sql = getDb();
  if (!sql) {
    return { enquiries: [], subscribers: [], portfolioItems: [], posts: [], orders: [] };
  }

  try {
    const [enquiriesRes, subscribersRes, portfolioRes, postsRes, ordersRes] = await Promise.allSettled([
      sql`SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM subscribers ORDER BY subscribed_at DESC LIMIT 50`,
      sql`SELECT id, title, category, published, created_at FROM portfolio_items ORDER BY created_at DESC`,
      sql`SELECT id, title, slug, category, published, published_at FROM posts ORDER BY published_at DESC`,
      sql`SELECT id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 50`,
    ]);

    const enquiries =
      enquiriesRes.status === 'fulfilled' ? (enquiriesRes.value as any[]).map(normalizeEnquiry) : [];
    const subscribers =
      subscribersRes.status === 'fulfilled' ? (subscribersRes.value as any[]).map(normalizeSubscriber) : [];
    const portfolioItems =
      portfolioRes.status === 'fulfilled' ? (portfolioRes.value as any[]).map(normalizePortfolioItem) : [];
    const posts =
      postsRes.status === 'fulfilled' ? (postsRes.value as any[]).map(normalizePost) : [];
    const orders =
      ordersRes.status === 'fulfilled' ? (ordersRes.value as any[]).map(normalizeOrder) : [];

    return { enquiries, subscribers, portfolioItems, posts, orders };
  } catch (err) {
    console.error('[db] getAdminDashboardData error:', err);
    return { enquiries: [], subscribers: [], portfolioItems: [], posts: [], orders: [] };
  }
}
