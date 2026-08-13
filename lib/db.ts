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
  User,
  PublicUser,
  UserRole,
  DesignRevision,
  DesignComment,
  DesignRevisionStatus,
  DesignCommentInput,
  CommentResolutionField,
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

const VALID_ROLES = new Set<UserRole>(['user', 'employee', 'designer', 'proofreader', 'admin']);

function normalizeUser(row: any): User {
  const role = VALID_ROLES.has(row.role) ? (row.role as UserRole) : 'user';
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    password_hash: String(row.password_hash ?? ''),
    name: row.name != null ? String(row.name) : null,
    email_verified: Boolean(row.email_verified),
    verification_token: row.verification_token != null ? String(row.verification_token) : null,
    verification_token_expires: row.verification_token_expires != null ? toIsoTimestampString(row.verification_token_expires) : null,
    role,
    phone: row.phone != null ? String(row.phone) : null,
    country: row.country != null ? String(row.country) : null,
    created_at: toIsoTimestampString(row.created_at),
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    email_verified: user.email_verified,
    role: user.role,
    phone: user.phone,
    country: user.country,
    created_at: user.created_at,
  };
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
    payment_status: (row.payment_status as string) === 'paid' ? 'paid' : row.payment_status === 'failed' ? 'failed' : 'unpaid',
    payment_amount: row.payment_amount != null ? Number(row.payment_amount) : null,
    paypal_order_id: row.paypal_order_id != null ? String(row.paypal_order_id) : null,
    assigned_designer_id: row.assigned_designer_id != null ? String(row.assigned_designer_id) : null,
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

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name?: string | null;
  verificationToken: string;
  verificationTokenExpires: Date;
}): Promise<User> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await sql`
    INSERT INTO users (email, password_hash, name, email_verified, verification_token, verification_token_expires, role)
    VALUES (
      ${input.email.trim().toLowerCase()},
      ${input.passwordHash},
      ${input.name?.trim() || null},
      false,
      ${input.verificationToken},
      ${input.verificationTokenExpires.toISOString()},
      'user'
    )
    RETURNING id, email, password_hash, name, email_verified, verification_token, verification_token_expires, role, phone, country, created_at
  `;

  return normalizeUser(rows[0]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const sql = getDb();
  if (!sql) return null;

  const rows = await sql`
    SELECT id, email, password_hash, name, email_verified, verification_token, verification_token_expires, role, phone, country, created_at
    FROM users
    WHERE email = ${email.trim().toLowerCase()}
    LIMIT 1
  `;

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const sql = getDb();
  if (!sql) return null;

  const rows = await sql`
    SELECT id, email, password_hash, name, email_verified, verification_token, verification_token_expires, role, phone, country, created_at
    FROM users
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

// Verifies a token, atomically marking the account verified only if the token
// matches and hasn't expired — returns null for any invalid/expired/reused token.
export async function verifyUserByToken(token: string): Promise<User | null> {
  const sql = getDb();
  if (!sql) return null;

  const rows = await sql`
    UPDATE users
    SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
    WHERE verification_token = ${token} AND verification_token_expires > NOW()
    RETURNING id, email, password_hash, name, email_verified, verification_token, verification_token_expires, role, phone, country, created_at
  `;

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

export async function setUserVerificationToken(userId: string, token: string, expires: Date): Promise<void> {
  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  await sql`
    UPDATE users
    SET verification_token = ${token}, verification_token_expires = ${expires.toISOString()}
    WHERE id = ${userId}
  `;
}

// Captures contact details from a quote submission onto the user's own profile
// so a returning customer's next order can skip re-entering them. Only fills
// in fields that were actually submitted this time — an omitted phone/country
// on a later order shouldn't wipe out a value saved on an earlier one.
export async function updateUserProfile(
  userId: string,
  input: { name?: string | null; phone?: string | null; country?: string | null }
): Promise<User | null> {
  const sql = getDb();
  if (!sql) return null;

  const rows = await sql`
    UPDATE users
    SET
      name = COALESCE(${input.name?.trim() || null}, name),
      phone = COALESCE(${input.phone?.trim() || null}, phone),
      country = COALESCE(${input.country?.trim() || null}, country)
    WHERE id = ${userId}
    RETURNING id, email, password_hash, name, email_verified, verification_token, verification_token_expires, role, phone, country, created_at
  `;

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

// ─── Roles (admin-assigned only — never settable from public signup) ──────────

export async function getAllUsers(): Promise<User[]> {
  const sql = getDb();
  if (!sql) return [];

  const rows = await sql`
    SELECT id, email, password_hash, name, email_verified, verification_token, verification_token_expires, role, phone, country, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  return rows.map(normalizeUser);
}

// For the proofreader's "assign to" dropdown — just enough to identify each designer.
export async function getDesigners(): Promise<Pick<User, 'id' | 'name' | 'email'>[]> {
  const sql = getDb();
  if (!sql) return [];

  const rows = await sql`
    SELECT id, name, email
    FROM users
    WHERE role = 'designer'
    ORDER BY name ASC NULLS LAST, email ASC
  `;

  return (rows as any[]).map((row) => ({
    id: String(row.id),
    name: row.name != null ? String(row.name) : null,
    email: String(row.email ?? ''),
  }));
}

export async function updateUserRole(id: string, role: UserRole): Promise<User | null> {
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const sql = getDb();
  if (!sql) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await sql`
    UPDATE users
    SET role = ${role}
    WHERE id = ${id}
    RETURNING id, email, password_hash, name, email_verified, verification_token, verification_token_expires, role, phone, country, created_at
  `;

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
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
    RETURNING id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at
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
      SELECT id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at
      FROM orders
      ORDER BY created_at DESC
    `;
    return (rows as any[]).map(normalizeOrder);
  } catch (err) {
    console.error('[db] getAllOrders error:', err);
    return [];
  }
}

// Orders aren't tied to a user_id — a customer can place a quote as a guest
// before ever creating an account. Matching by email means their history
// still shows up correctly the moment they sign up with the same address.
export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at
      FROM orders
      WHERE customer_email = ${email.trim().toLowerCase()}
      ORDER BY created_at DESC
    `;
    return (rows as any[]).map(normalizeOrder);
  } catch (err) {
    console.error('[db] getOrdersByEmail error:', err);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const sql = getDb();
  if (!sql) return null;

  const rows = await sql`
    SELECT id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at
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
    RETURNING id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at
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

// Set the quoted price for an order (admin sets this so customer can pay)
export async function setOrderPaymentAmount(id: string, amount: number): Promise<Order | null> {
  const sql = getDb();
  if (!sql) throw new Error('Database is not configured.');

  const rows = await sql`
    UPDATE orders
    SET payment_amount = ${amount}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at
  `;

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
}

// Mark order as paid after PayPal capture succeeds
export async function markOrderPaid(id: string, paypalOrderId: string): Promise<Order | null> {
  const sql = getDb();
  if (!sql) throw new Error('Database is not configured.');

  const rows = await sql`
    UPDATE orders
    SET payment_status = 'paid', paypal_order_id = ${paypalOrderId}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at
  `;

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
}

// Proofreader routes an order to a specific designer — pass null to unassign.
// Only that designer can then see or act on the order under /staff.
export async function assignOrderToDesigner(orderId: string, designerId: string | null): Promise<Order | null> {
  const sql = getDb();
  if (!sql) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await sql`
    UPDATE orders
    SET assigned_designer_id = ${designerId}, updated_at = NOW()
    WHERE id = ${orderId}
    RETURNING id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at
  `;

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
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
      sql`SELECT id, enquiry_id, customer_name, customer_email, service_type, event_date, quantity_estimate, details, portfolio_items, status, payment_status, payment_amount, paypal_order_id, assigned_designer_id, created_at, updated_at FROM orders ORDER BY created_at DESC LIMIT 50`,

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

// ─── Design Review ─────────────────────────────────────────────────────────────

function normalizeDesignComment(row: any): DesignComment {
  return {
    id: String(row.id),
    revision_id: String(row.revision_id),
    image_index: Number(row.image_index) || 0,
    x: Number(row.x),
    y: Number(row.y),
    comment: String(row.comment ?? ''),
    designer_resolved: Boolean(row.designer_resolved),
    proofreader_resolved: Boolean(row.proofreader_resolved),
    author_role: row.author_role === 'proofreader' ? 'proofreader' : 'customer',
    created_at: toIsoTimestampString(row.created_at),
  };
}

function normalizeDesignRevision(row: any, comments: DesignComment[] = []): DesignRevision {
  const rawUrls = row.image_urls;
  const image_urls = Array.isArray(rawUrls) ? rawUrls.map(String) : [];
  return {
    id: String(row.id),
    order_id: String(row.order_id),
    version: Number(row.version),
    image_urls,
    notes: row.notes != null ? String(row.notes) : null,
    status: row.status as DesignRevisionStatus,
    created_at: toIsoTimestampString(row.created_at),
    comments,
  };
}

// One order can have many rounds of revisions; each carries its own comment thread.
export async function getDesignRevisionsForOrder(orderId: string): Promise<DesignRevision[]> {
  const sql = getDb();
  if (!sql) return [];

  const revisionRows = await sql`
    SELECT id, order_id, version, image_urls, notes, status, created_at
    FROM design_revisions
    WHERE order_id = ${orderId}
    ORDER BY version ASC
  `;

  if (revisionRows.length === 0) return [];

  const commentRows = await sql`
    SELECT id, revision_id, image_index, x, y, comment, designer_resolved, proofreader_resolved, author_role, created_at
    FROM design_comments
    WHERE revision_id = ANY(${revisionRows.map((r: any) => r.id)})
    ORDER BY created_at ASC
  `;

  const commentsByRevision = new Map<string, DesignComment[]>();
  for (const row of commentRows as any[]) {
    const comment = normalizeDesignComment(row);
    const list = commentsByRevision.get(comment.revision_id) ?? [];
    list.push(comment);
    commentsByRevision.set(comment.revision_id, list);
  }

  return (revisionRows as any[]).map((row) =>
    normalizeDesignRevision(row, commentsByRevision.get(String(row.id)) ?? [])
  );
}

// Same as getDesignRevisionsForOrder, but filtered to what a customer is allowed
// to see — a revision the proofreader hasn't cleared yet (or bounced back to the
// designer) never reaches the client, by design.
const CUSTOMER_VISIBLE_STATUSES = new Set<DesignRevisionStatus>(['pending_review', 'changes_requested', 'approved']);

export async function getDesignRevisionsForCustomer(orderId: string): Promise<DesignRevision[]> {
  const revisions = await getDesignRevisionsForOrder(orderId);
  return revisions.filter((r) => CUSTOMER_VISIBLE_STATUSES.has(r.status));
}

export async function getDesignRevisionById(id: string): Promise<DesignRevision | null> {
  const sql = getDb();
  if (!sql) return null;

  const rows = await sql`
    SELECT id, order_id, version, image_urls, notes, status, created_at
    FROM design_revisions
    WHERE id = ${id}
    LIMIT 1
  `;
  if (rows.length === 0) return null;

  const commentRows = await sql`
    SELECT id, revision_id, image_index, x, y, comment, designer_resolved, proofreader_resolved, author_role, created_at
    FROM design_comments
    WHERE revision_id = ${id}
    ORDER BY created_at ASC
  `;

  return normalizeDesignRevision(rows[0], (commentRows as any[]).map(normalizeDesignComment));
}

// Designer/admin uploads a new proof — version auto-increments per order. Every
// revision starts awaiting the proofreader's gate, never goes straight to the customer.
//
// A new upload is only allowed when there's no revision yet, or the proofreader
// has explicitly routed the latest one back ('returned_to_designer') — never
// directly off a customer's change request, and never while something is still
// mid-review with the proofreader or the customer. This is the server-side
// half of the gate; the UI hides the upload control for the same reason.
export async function createDesignRevision(input: {
  orderId: string;
  imageUrls: string[];
  notes?: string | null;
}): Promise<DesignRevision> {
  const sql = getDb();
  if (!sql) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const latest = await sql`
    SELECT status FROM design_revisions
    WHERE order_id = ${input.orderId}
    ORDER BY version DESC
    LIMIT 1
  `;

  if (latest.length > 0 && latest[0].status !== 'returned_to_designer') {
    throw new Error(
      'This order already has a revision in progress — a new upload is only allowed once the proofreader routes it back to you.'
    );
  }

  const rows = await sql`
    INSERT INTO design_revisions (order_id, version, image_urls, notes, status)
    VALUES (
      ${input.orderId},
      COALESCE((SELECT MAX(version) FROM design_revisions WHERE order_id = ${input.orderId}), 0) + 1,
      ${input.imageUrls},
      ${input.notes?.trim() || null},
      'pending_proofreader_review'
    )
    RETURNING id, order_id, version, image_urls, notes, status, created_at
  `;

  return normalizeDesignRevision(rows[0]);
}

// Proofreader approves a revision awaiting their review, sending it on to the customer.
export async function proofreaderApproveRevision(revisionId: string): Promise<DesignRevision | null> {
  const sql = getDb();
  if (!sql) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await sql`
    UPDATE design_revisions
    SET status = 'pending_review'
    WHERE id = ${revisionId} AND status = 'pending_proofreader_review'
    RETURNING id, order_id, version, image_urls, notes, status, created_at
  `;

  return rows.length > 0 ? normalizeDesignRevision(rows[0]) : null;
}

// Proofreader routes a revision back to the designer, with their own pinned
// marks added on top. Valid from either state that's currently on the
// proofreader's desk: a fresh proof awaiting their first look
// ('pending_proofreader_review'), or a customer's change request they're
// relaying on to the designer ('changes_requested') — the customer's own
// pins already justify that one, so additional marks here are optional.
export async function proofreaderReturnToDesigner(
  revisionId: string,
  comments: DesignCommentInput[]
): Promise<DesignRevision | null> {
  const sql = getDb();
  if (!sql) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await sql`
    UPDATE design_revisions
    SET status = 'returned_to_designer'
    WHERE id = ${revisionId} AND status IN ('pending_proofreader_review', 'changes_requested')
    RETURNING id, order_id, version, image_urls, notes, status, created_at
  `;

  if (rows.length === 0) return null;

  for (const c of comments) {
    await sql`
      INSERT INTO design_comments (revision_id, image_index, x, y, comment, author_role)
      VALUES (${revisionId}, ${c.image_index}, ${c.x}, ${c.y}, ${c.comment.trim()}, 'proofreader')
    `;
  }

  return getDesignRevisionById(revisionId);
}

// Customer approves, or requests changes with a batch of pinned comments. Only
// valid while the revision is still awaiting review — prevents acting twice on
// the same round, or reviewing a round the studio has already superseded.
export async function submitDesignReview(
  revisionId: string,
  action: 'approve' | 'request_changes',
  comments: DesignCommentInput[]
): Promise<DesignRevision | null> {
  const sql = getDb();
  if (!sql) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const newStatus: DesignRevisionStatus = action === 'approve' ? 'approved' : 'changes_requested';

  const rows = await sql`
    UPDATE design_revisions
    SET status = ${newStatus}
    WHERE id = ${revisionId} AND status = 'pending_review'
    RETURNING id, order_id, version, image_urls, notes, status, created_at
  `;

  if (rows.length === 0) return null;

  if (action === 'request_changes') {
    for (const c of comments) {
      await sql`
        INSERT INTO design_comments (revision_id, image_index, x, y, comment)
        VALUES (${revisionId}, ${c.image_index}, ${c.x}, ${c.y}, ${c.comment.trim()})
      `;
    }
  }

  return getDesignRevisionById(revisionId);
}

// Designer and proofreader each have their own resolution flag on a comment —
// one marking their own fix done never implies the other has confirmed it.
export async function setCommentResolution(
  commentId: string,
  field: CommentResolutionField,
  value: boolean
): Promise<DesignComment | null> {
  const sql = getDb();
  if (!sql) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows =
    field === 'designer_resolved'
      ? await sql`
          UPDATE design_comments
          SET designer_resolved = ${value}
          WHERE id = ${commentId}
          RETURNING id, revision_id, image_index, x, y, comment, designer_resolved, proofreader_resolved, author_role, created_at
        `
      : await sql`
          UPDATE design_comments
          SET proofreader_resolved = ${value}
          WHERE id = ${commentId}
          RETURNING id, revision_id, image_index, x, y, comment, designer_resolved, proofreader_resolved, author_role, created_at
        `;

  return rows.length > 0 ? normalizeDesignComment(rows[0]) : null;
}
