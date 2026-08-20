import { eq, and, or, gt, asc, desc, inArray, sql as dsql } from 'drizzle-orm';
import { getDrizzle } from '@/db/client';
import {
  portfolioItems as portfolioItemsTable,
  products as productsTable,
  posts as postsTable,
  subscribers as subscribersTable,
  enquiries as enquiriesTable,
  orderForms as orderFormsTable,
  orders as ordersTable,
  orderStatusHistory as orderStatusHistoryTable,
  designRevisions as designRevisionsTable,
  designComments as designCommentsTable,
  portfolioItemPrices as portfolioItemPricesTable,
  customerItemPrices as customerItemPricesTable,
} from '@/db/schema';
import { user as usersTable } from '@/db/auth-schema';
import { portfolioItems as staticPortfolio, blogPosts as staticBlog, products as staticProducts } from './data';
import type {
  PortfolioItem,
  Product,
  ProductSize,
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
  OrderForm,
  OrderFormInput,
  OrderFormProduct,
  PortfolioItemPrice,
  CustomerItemPrice,
  EffectivePrice,
} from '@/types/database';

/**
 * Drizzle-backed Repository Helpers (Neon serverless Postgres)
 */

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
    name: row.name != null ? String(row.name) : null,
    email_verified: Boolean(row.emailVerified),
    role,
    phone: row.phone != null ? String(row.phone) : null,
    country: row.country != null ? String(row.country) : null,
    address: row.address != null ? String(row.address) : null,
    created_at: toIsoTimestampString(row.createdAt),
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
    address: user.address,
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
    template_number: row.template_number != null ? String(row.template_number) : null,
    image_url: String(row.image_url ?? ''),
    image_urls: Array.isArray(row.image_urls) ? row.image_urls : null,
    description: row.description != null ? String(row.description) : null,
    location: row.location != null ? String(row.location) : null,
    published: Boolean(row.published),
    created_at: toIsoTimestampString(row.created_at),
  };
}

function normalizeProductSizes(value: unknown): ProductSize[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      label: String(item.label ?? ''),
      dimensions: String(item.dimensions ?? ''),
      description: item.description != null ? String(item.description) : undefined,
    }));
}

function normalizeProduct(row: any): Product {
  return {
    id: String(row.id),
    slug: String(row.slug ?? ''),
    type_slug: String(row.type_slug ?? row.slug ?? ''),
    type_label: String(row.type_label ?? row.title ?? ''),
    title: String(row.title ?? ''),
    subtitle: row.subtitle != null ? String(row.subtitle) : null,
    description: row.description != null ? String(row.description) : null,
    category: row.category as ServiceCategory,
    image_url: row.image_url != null ? String(row.image_url) : null,
    image_urls: Array.isArray(row.image_urls) ? row.image_urls : null,
    sizes: normalizeProductSizes(row.sizes),
    related_slugs: Array.isArray(row.related_slugs) ? row.related_slugs.map(String) : [],
    published: Boolean(row.published),
    created_at: toIsoTimestampString(row.created_at),
  };
}

function staticProductToProduct(item: (typeof staticProducts)[number]): Product {
  return {
    id: `static-product-${item.slug}`,
    slug: item.slug,
    type_slug: item.slug,
    type_label: item.title,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    category: item.category,
    image_url: item.image,
    image_urls: item.image_urls ?? null,
    sizes: item.sizes,
    related_slugs: item.relatedSlugs,
    published: true,
    created_at: new Date().toISOString(),
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
    user_id: row.user_id != null ? String(row.user_id) : null,
    phone: row.phone != null ? String(row.phone) : null,
    country: row.country != null ? String(row.country) : null,
    service_type: String(row.service_type ?? ''),
    event_date: row.event_date != null ? toIsoDateString(row.event_date) : null,
    quantity_estimate: row.quantity_estimate != null ? String(row.quantity_estimate) : null,
    description: row.description != null ? String(row.description) : null,
    address: row.address != null ? String(row.address) : null,
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
    user_id: row.user_id != null ? String(row.user_id) : null,
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
    payment_provider: row.payment_provider === 'paypal' || row.payment_provider === 'razorpay' ? row.payment_provider : null,
    paypal_order_id: row.paypal_order_id != null ? String(row.paypal_order_id) : null,
    razorpay_order_id: row.razorpay_order_id != null ? String(row.razorpay_order_id) : null,
    razorpay_payment_id: row.razorpay_payment_id != null ? String(row.razorpay_payment_id) : null,
    assigned_designer_id: row.assigned_designer_id != null ? String(row.assigned_designer_id) : null,
    created_at: toIsoTimestampString(row.created_at),
    updated_at: toIsoTimestampString(row.updated_at),
  };
}

function normalizeOrderFormProducts(value: unknown): OrderFormProduct[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((item) => ({
      slug: String(item.slug ?? ''),
      title: String(item.title ?? ''),
      size: String(item.size ?? ''),
      quantity: Number(item.quantity ?? 0),
    }));
}

function normalizeOrderForm(row: any): OrderForm {
  return {
    id: String(row.id),
    enquiry_id: String(row.enquiry_id),
    deceased_name: row.deceased_name != null ? String(row.deceased_name) : null,
    funeral_date: row.funeral_date != null ? toIsoDateString(row.funeral_date) : null,
    funeral_time: row.funeral_time != null ? String(row.funeral_time) : null,
    venue_name: row.venue_name != null ? String(row.venue_name) : null,
    date_of_birth: row.date_of_birth != null ? toIsoDateString(row.date_of_birth) : null,
    date_of_death: row.date_of_death != null ? toIsoDateString(row.date_of_death) : null,
    age_of_deceased: row.age_of_deceased != null ? String(row.age_of_deceased) : null,
    photo_option: row.photo_option ?? null,
    bespoke_design: Boolean(row.bespoke_design),
    bespoke_details: row.bespoke_details != null ? String(row.bespoke_details) : null,
    number_of_pages: row.number_of_pages != null ? String(row.number_of_pages) : null,
    inside_pages_style: row.inside_pages_style ?? null,
    quantity: row.quantity != null ? String(row.quantity) : null,
    photo_qty: row.photo_qty != null ? Number(row.photo_qty) : null,
    photo_supplied_via: row.photo_supplied_via ?? null,
    photo_instructions: row.photo_instructions != null ? String(row.photo_instructions) : null,
    additional_products: normalizeOrderFormProducts(row.additional_products),
    callback_requested: Boolean(row.callback_requested),
    callback_phone: row.callback_phone != null ? String(row.callback_phone) : null,
    additional_notes: row.additional_notes != null ? String(row.additional_notes) : null,
    backpage_information: row.backpage_information != null ? String(row.backpage_information) : null,
    attachment_url: row.attachment_url != null ? String(row.attachment_url) : null,
    status: row.status === 'submitted' ? 'submitted' : 'draft',
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
  const db = getDrizzle();

  if (db) {
    try {
      const where =
        category && category !== 'all'
          ? and(eq(portfolioItemsTable.published, true), eq(portfolioItemsTable.category, category))
          : eq(portfolioItemsTable.published, true);

      const rows = await db
        .select()
        .from(portfolioItemsTable)
        .where(where)
        .orderBy(desc(portfolioItemsTable.created_at));

      if (rows.length > 0) {
        return rows.map(normalizePortfolioItem);
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
    template_number: null,
    image_url: `/images/portfolio/${item.category}.jpg`,
    description: item.description,
    location: item.location,
    published: true,
    created_at: new Date().toISOString(),
  }));
}

export async function getPortfolioItemById(id: string): Promise<PortfolioItem | null> {
  const db = getDrizzle();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(portfolioItemsTable)
        .where(and(eq(portfolioItemsTable.id, id), eq(portfolioItemsTable.published, true)))
        .limit(1);
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
        template_number: null,
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
  template_number?: string | null;
  image_url: string;
  image_urls?: string[] | null;
  description: string | null;
  location: string | null;
  published: boolean;
}

// Admin-only: every item regardless of published state
export async function getAllPortfolioItemsForAdmin(): Promise<PortfolioItem[]> {
  const db = getDrizzle();
  if (!db) return [];

  try {
    const rows = await db.select().from(portfolioItemsTable).orderBy(desc(portfolioItemsTable.created_at));
    return rows.map(normalizePortfolioItem);
  } catch (err) {
    console.error('[db] getAllPortfolioItemsForAdmin error:', err);
    return [];
  }
}

export async function createPortfolioItem(input: PortfolioItemInput): Promise<PortfolioItem> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db
    .insert(portfolioItemsTable)
    .values({
      title: input.title.trim(),
      category: input.category,
      filters: input.filters ?? {},
      template_number: input.template_number?.trim() || null,
      image_url: input.image_url,
      image_urls: input.image_urls && input.image_urls.length > 0 ? input.image_urls : null,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      published: input.published,
    })
    .returning();

  return normalizePortfolioItem(rows[0]);
}

export async function updatePortfolioItem(id: string, input: PortfolioItemInput): Promise<PortfolioItem | null> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db
    .update(portfolioItemsTable)
    .set({
      title: input.title.trim(),
      category: input.category,
      filters: input.filters ?? {},
      template_number: input.template_number?.trim() || null,
      image_url: input.image_url,
      image_urls: input.image_urls && input.image_urls.length > 0 ? input.image_urls : null,
      description: input.description?.trim() || null,
      location: input.location?.trim() || null,
      published: input.published,
    })
    .where(eq(portfolioItemsTable.id, id))
    .returning();

  return rows.length > 0 ? normalizePortfolioItem(rows[0]) : null;
}

export async function deletePortfolioItem(id: string): Promise<boolean> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db.delete(portfolioItemsTable).where(eq(portfolioItemsTable.id, id)).returning({ id: portfolioItemsTable.id });
  return rows.length > 0;
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(category?: string): Promise<Product[]> {
  const db = getDrizzle();

  if (db) {
    try {
      const where =
        category && category !== 'all'
          ? and(eq(productsTable.published, true), eq(productsTable.category, category))
          : eq(productsTable.published, true);

      const rows = await db
        .select()
        .from(productsTable)
        .where(where)
        .orderBy(desc(productsTable.created_at));

      if (rows.length > 0) {
        return rows.map(normalizeProduct);
      }
    } catch (err) {
      console.error('[db] getProducts error:', err);
    }
  }

  // Static fallback if DB is not yet populated or configured
  let filtered = staticProducts;
  if (category && category !== 'all') {
    filtered = staticProducts.filter((item) => item.category === category);
  }

  return filtered.map(staticProductToProduct);
}

// All published designs belonging to one catalog type (e.g. every "Memory
// Cards" design), ordered oldest-first so the original design is the
// default selection on the master-detail page.
export async function getProductsByType(typeSlug: string): Promise<Product[]> {
  const db = getDrizzle();

  if (db) {
    try {
      const rows = await db
        .select()
        .from(productsTable)
        .where(and(eq(productsTable.published, true), eq(productsTable.type_slug, typeSlug)))
        .orderBy(asc(productsTable.created_at));

      if (rows.length > 0) {
        return rows.map(normalizeProduct);
      }
    } catch (err) {
      console.error(`[db] getProductsByType(${typeSlug}) error:`, err);
    }
  }

  return staticProducts.filter((p) => p.slug === typeSlug).map(staticProductToProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const db = getDrizzle();
  if (db) {
    try {
      const rows = await db
        .select()
        .from(productsTable)
        .where(and(eq(productsTable.slug, slug), eq(productsTable.published, true)))
        .limit(1);
      if (rows.length > 0) return normalizeProduct(rows[0]);
    } catch (err) {
      console.error(`[db] getProductBySlug(${slug}) error:`, err);
    }
  }

  const item = staticProducts.find((p) => p.slug === slug);
  return item ? staticProductToProduct(item) : null;
}

export async function getRelatedProducts(slugs: string[]): Promise<Product[]> {
  if (slugs.length === 0) return [];
  const db = getDrizzle();

  if (db) {
    try {
      const rows = await db
        .select()
        .from(productsTable)
        .where(and(eq(productsTable.published, true), inArray(productsTable.slug, slugs)));
      if (rows.length > 0) {
        const bySlug = new Map(rows.map((row) => [row.slug, normalizeProduct(row)]));
        return slugs.map((slug) => bySlug.get(slug)).filter((p): p is Product => Boolean(p));
      }
    } catch (err) {
      console.error('[db] getRelatedProducts error:', err);
    }
  }

  return staticProducts.filter((p) => slugs.includes(p.slug)).map(staticProductToProduct);
}

export interface ProductInput {
  slug: string;
  type_slug: string;
  type_label: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category: ServiceCategory;
  image_url?: string | null;
  image_urls?: string[] | null;
  sizes: ProductSize[];
  related_slugs?: string[];
  published: boolean;
}

// Admin-only: every product regardless of published state
export async function getAllProductsForAdmin(): Promise<Product[]> {
  const db = getDrizzle();
  if (!db) return [];

  try {
    const rows = await db.select().from(productsTable).orderBy(desc(productsTable.created_at));
    return rows.map(normalizeProduct);
  } catch (err) {
    console.error('[db] getAllProductsForAdmin error:', err);
    return [];
  }
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db
    .insert(productsTable)
    .values({
      slug: input.slug.trim(),
      type_slug: input.type_slug.trim(),
      type_label: input.type_label.trim(),
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      category: input.category,
      image_url: input.image_url?.trim() || null,
      image_urls: input.image_urls && input.image_urls.length > 0 ? input.image_urls : null,
      sizes: input.sizes,
      related_slugs: input.related_slugs ?? [],
      published: input.published,
    })
    .returning();

  return normalizeProduct(rows[0]);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product | null> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db
    .update(productsTable)
    .set({
      slug: input.slug.trim(),
      type_slug: input.type_slug.trim(),
      type_label: input.type_label.trim(),
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      description: input.description?.trim() || null,
      category: input.category,
      image_url: input.image_url?.trim() || null,
      image_urls: input.image_urls && input.image_urls.length > 0 ? input.image_urls : null,
      sizes: input.sizes,
      related_slugs: input.related_slugs ?? [],
      published: input.published,
    })
    .where(eq(productsTable.id, id))
    .returning();

  return rows.length > 0 ? normalizeProduct(rows[0]) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db.delete(productsTable).where(eq(productsTable.id, id)).returning({ id: productsTable.id });
  return rows.length > 0;
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function getBlogPosts(limit = 20): Promise<Post[]> {
  const db = getDrizzle();

  if (db) {
    try {
      const rows = await db
        .select()
        .from(postsTable)
        .where(eq(postsTable.published, true))
        .orderBy(desc(postsTable.published_at))
        .limit(limit);

      if (rows.length > 0) {
        return rows.map(normalizePost);
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
  const db = getDrizzle();

  if (db) {
    try {
      const rows = await db
        .select()
        .from(postsTable)
        .where(and(eq(postsTable.slug, slug), eq(postsTable.published, true)))
        .limit(1);

      if (rows.length > 0) {
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

// `userId` is never client-supplied — pass the authenticated session's user
// id (if any) from the caller, same as updateUserProfile's usage in
// app/api/enquiries/route.ts.
export async function insertEnquiry(payload: EnquiryPayload, userId?: string | null): Promise<Enquiry> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db
    .insert(enquiriesTable)
    .values({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      user_id: userId ?? null,
      phone: payload.phone?.trim() || null,
      country: payload.country?.trim() || null,
      service_type: payload.service_type,
      event_date: payload.event_date || null,
      quantity_estimate: payload.quantity_estimate || null,
      description: payload.description?.trim() || null,
      address: payload.address?.trim() || null,
      source: payload.source || 'website',
      portfolio_items: payload.portfolio_items && payload.portfolio_items.length > 0 ? payload.portfolio_items : null,
      status: 'new',
    })
    .returning();

  return normalizeEnquiry(rows[0]);
}

// The enquiry's own UUID doubles as the access key for its order form —
// unguessable, no login required, matches how portfolio/product pages work.
export async function getEnquiryById(id: string): Promise<Enquiry | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db.select().from(enquiriesTable).where(eq(enquiriesTable.id, id)).limit(1);

  return rows.length > 0 ? normalizeEnquiry(rows[0]) : null;
}

// Matches by user_id when given (the reliable link) as well as email
// (the guest-checkout fallback, and what covers enquiries submitted before
// this account existed) — either match includes the row.
export async function getEnquiriesByEmail(email: string, userId?: string | null): Promise<Enquiry[]> {
  const db = getDrizzle();
  if (!db) return [];

  const emailMatch = eq(enquiriesTable.email, email.trim().toLowerCase());
  const condition = userId ? or(emailMatch, eq(enquiriesTable.user_id, userId)) : emailMatch;

  const rows = await db
    .select()
    .from(enquiriesTable)
    .where(condition)
    .orderBy(desc(enquiriesTable.created_at));

  return rows.map(normalizeEnquiry);
}

// ─── Order Forms ────────────────────────────────────────────────────────────────

export async function getOrderFormByEnquiryId(enquiryId: string): Promise<OrderForm | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db.select().from(orderFormsTable).where(eq(orderFormsTable.enquiry_id, enquiryId)).limit(1);

  return rows.length > 0 ? normalizeOrderForm(rows[0]) : null;
}

// The customer can save a draft and come back — every save writes the full
// current form state, so this always upserts rather than patching fields.
export async function upsertOrderForm(
  enquiryId: string,
  input: OrderFormInput,
  submit: boolean
): Promise<OrderForm> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const values = {
    deceased_name: input.deceased_name?.trim() || null,
    funeral_date: input.funeral_date || null,
    funeral_time: input.funeral_time?.trim() || null,
    venue_name: input.venue_name?.trim() || null,
    date_of_birth: input.date_of_birth || null,
    date_of_death: input.date_of_death || null,
    age_of_deceased: input.age_of_deceased?.trim() || null,
    photo_option: input.photo_option || null,
    bespoke_design: input.bespoke_design ?? false,
    bespoke_details: input.bespoke_details?.trim() || null,
    number_of_pages: input.number_of_pages || null,
    inside_pages_style: input.inside_pages_style || null,
    quantity: input.quantity?.trim() || null,
    photo_qty: input.photo_qty ?? null,
    photo_supplied_via: input.photo_supplied_via || null,
    photo_instructions: input.photo_instructions?.trim() || null,
    additional_products:
      input.additional_products && input.additional_products.length > 0 ? input.additional_products : null,
    callback_requested: input.callback_requested ?? false,
    callback_phone: input.callback_phone?.trim() || null,
    additional_notes: input.additional_notes?.trim() || null,
    backpage_information: input.backpage_information?.trim() || null,
    attachment_url: input.attachment_url?.trim() || null,
    status: submit ? 'submitted' : 'draft',
  };

  const rows = await db
    .insert(orderFormsTable)
    .values({ enquiry_id: enquiryId, ...values })
    .onConflictDoUpdate({
      target: orderFormsTable.enquiry_id,
      set: { ...values, updated_at: new Date() },
    })
    .returning();

  return normalizeOrderForm(rows[0]);
}

// ─── Users ────────────────────────────────────────────────────────────────────
// User creation, login, and email verification are now handled by Better Auth
// (see lib/auth.ts) — it owns the `user`/`session`/`account`/`verification`
// tables. These helpers just read/update the profile fields the rest of the
// app needs (role, phone, country), same as before.

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.trim().toLowerCase()))
    .limit(1);

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

// Captures contact details from a quote submission onto the user's own profile
// so a returning customer's next order can skip re-entering them. Only fills
// in fields that were actually submitted this time — an omitted phone/country
// on a later order shouldn't wipe out a value saved on an earlier one.
export async function updateUserProfile(
  userId: string,
  input: { name?: string | null; phone?: string | null; country?: string | null; address?: string | null }
): Promise<User | null> {
  const db = getDrizzle();
  if (!db) return null;

  const patch: Partial<typeof usersTable.$inferInsert> = {};
  const name = input.name?.trim() || null;
  const phone = input.phone?.trim() || null;
  const country = input.country?.trim() || null;
  const address = input.address?.trim() || null;
  if (name) patch.name = name;
  if (phone) patch.phone = phone;
  if (country) patch.country = country;
  if (address) patch.address = address;

  if (Object.keys(patch).length === 0) {
    return getUserById(userId);
  }

  const rows = await db.update(usersTable).set(patch).where(eq(usersTable.id, userId)).returning();

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

// ─── Roles (admin-assigned only — never settable from public signup) ──────────

export async function getAllUsers(): Promise<User[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  return rows.map(normalizeUser);
}

// ─── Portfolio item pricing (a specific price for one actual piece) ───────────

function normalizePortfolioItemPrice(row: any): PortfolioItemPrice {
  return {
    id: String(row.id),
    portfolio_item_id: String(row.portfolio_item_id),
    price: Number(row.price),
    currency: String(row.currency),
    created_at: toIsoTimestampString(row.created_at),
    updated_at: toIsoTimestampString(row.updated_at),
  };
}

export async function getPortfolioItemPrice(portfolioItemId: string): Promise<PortfolioItemPrice | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db
    .select()
    .from(portfolioItemPricesTable)
    .where(eq(portfolioItemPricesTable.portfolio_item_id, portfolioItemId))
    .limit(1);

  return rows.length > 0 ? normalizePortfolioItemPrice(rows[0]) : null;
}

// For the admin pricing table — every item price at once, joined
// client-side against getAllPortfolioItemsForAdmin() rather than a
// per-item round trip.
export async function getAllPortfolioItemPrices(): Promise<PortfolioItemPrice[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db.select().from(portfolioItemPricesTable);

  return rows.map(normalizePortfolioItemPrice);
}

export async function upsertPortfolioItemPrice(
  portfolioItemId: string,
  price: number,
  currency: string
): Promise<PortfolioItemPrice> {
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await db
    .insert(portfolioItemPricesTable)
    .values({ portfolio_item_id: portfolioItemId, price: price.toString(), currency })
    .onConflictDoUpdate({
      target: portfolioItemPricesTable.portfolio_item_id,
      set: { price: price.toString(), currency, updated_at: new Date() },
    })
    .returning();

  return normalizePortfolioItemPrice(rows[0]);
}

// ─── Customer × item pricing (the same piece, priced differently per customer) ─

function normalizeCustomerItemPrice(row: any): CustomerItemPrice {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    portfolio_item_id: String(row.portfolio_item_id),
    price: Number(row.price),
    currency: String(row.currency),
    created_at: toIsoTimestampString(row.created_at),
    updated_at: toIsoTimestampString(row.updated_at),
  };
}

export async function getCustomerItemPrice(userId: string, portfolioItemId: string): Promise<CustomerItemPrice | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db
    .select()
    .from(customerItemPricesTable)
    .where(and(eq(customerItemPricesTable.user_id, userId), eq(customerItemPricesTable.portfolio_item_id, portfolioItemId)))
    .limit(1);

  return rows.length > 0 ? normalizeCustomerItemPrice(rows[0]) : null;
}

// For the admin UI — every customer/item override at once, filtered
// client-side to whichever customer is currently selected.
export async function getAllCustomerItemPrices(): Promise<CustomerItemPrice[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db.select().from(customerItemPricesTable);

  return rows.map(normalizeCustomerItemPrice);
}

export async function upsertCustomerItemPrice(
  userId: string,
  portfolioItemId: string,
  price: number,
  currency: string
): Promise<CustomerItemPrice> {
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await db
    .insert(customerItemPricesTable)
    .values({ user_id: userId, portfolio_item_id: portfolioItemId, price: price.toString(), currency })
    .onConflictDoUpdate({
      target: [customerItemPricesTable.user_id, customerItemPricesTable.portfolio_item_id],
      set: { price: price.toString(), currency, updated_at: new Date() },
    })
    .returning();

  return normalizeCustomerItemPrice(rows[0]);
}

// What the pricing page actually renders for a logged-in customer, most
// specific first:
// 1. Their price for this exact piece (customerItemPrices).
// 2. This piece's shared baseline, regardless of customer (portfolioItemPrices).
// Returns null if neither exists — the pricing page shows a "being
// prepared" message in that case rather than a blank or zero price.
// `userId` is nullable so this can also resolve a price for an order whose
// customer has no account (see syncOrderPricingFromCatalog below) — that
// just skips the customer-item step and falls straight to the item's
// shared price.
export async function getEffectivePrice(userId: string | null, portfolioItemId: string | null): Promise<EffectivePrice | null> {
  if (userId && portfolioItemId) {
    const customerItem = await getCustomerItemPrice(userId, portfolioItemId);
    if (customerItem) {
      return { price: customerItem.price, currency: customerItem.currency, negotiated: true };
    }
  }

  if (portfolioItemId) {
    const itemPrice = await getPortfolioItemPrice(portfolioItemId);
    if (itemPrice) {
      return { price: itemPrice.price, currency: itemPrice.currency, negotiated: false };
    }
  }

  return null;
}

// Keeps an order's payment_amount in sync with the current pricing catalog
// (this customer's price for the specific piece the order references, or
// that piece's shared baseline) so nobody has to manually re-type it every
// time either changes — which is the whole point, since both change
// frequently. Never
// touches an order that's already been paid (payment_amount there is a
// historical record of what was actually charged, not a live price). Leaves
// payment_amount untouched if nothing in the catalog resolves a price —
// that's the manual-entry fallback for orders the catalog can't cover (e.g.
// one spanning several different pieces, where there's no single "the"
// item to price).
export async function syncOrderPricingFromCatalog(order: Order, knownUserId?: string | null): Promise<Order> {
  if (order.payment_status === 'paid') return order;

  let userId = knownUserId ?? null;
  if (!userId) {
    const user = await getUserByEmail(order.customer_email);
    userId = user?.id ?? null;
  }

  const items = order.portfolio_items;
  const singleItemId = items && items.length === 1 ? items[0].id : null;

  const effective = await getEffectivePrice(userId, singleItemId);
  if (!effective) return order;
  if (order.payment_amount === effective.price) return order;

  const updated = await setOrderPaymentAmount(order.id, effective.price);
  return updated ?? order;
}

// For the proofreader's "assign to" dropdown — just enough to identify each designer.
export async function getDesigners(): Promise<Pick<User, 'id' | 'name' | 'email'>[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.role, 'designer'))
    .orderBy(asc(usersTable.name), asc(usersTable.email));

  return rows.map((row) => ({
    id: String(row.id),
    name: row.name != null ? String(row.name) : null,
    email: String(row.email ?? ''),
  }));
}

export async function updateUserRole(id: string, role: UserRole): Promise<User | null> {
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Invalid role: ${role}`);
  }

  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();

  return rows.length > 0 ? normalizeUser(rows[0]) : null;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(input: OrderInput): Promise<Order> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  // Link to the customer's account when one exists — carried over from the
  // source enquiry first (most orders are converted from one), else
  // best-effort matched by email. Stays null (guest order) if neither hits;
  // customer_email remains the fallback for showing it in their account
  // once they do sign up.
  let userId: string | null = null;
  if (input.enquiry_id) {
    const enquiry = await getEnquiryById(input.enquiry_id);
    userId = enquiry?.user_id ?? null;
  }
  if (!userId) {
    const account = await getUserByEmail(input.customer_email);
    userId = account?.id ?? null;
  }

  const rows = await db
    .insert(ordersTable)
    .values({
      enquiry_id: input.enquiry_id ?? null,
      user_id: userId,
      customer_name: input.customer_name.trim(),
      customer_email: input.customer_email.trim().toLowerCase(),
      service_type: input.service_type.trim(),
      event_date: input.event_date || null,
      quantity_estimate: input.quantity_estimate?.trim() || null,
      details: input.details?.trim() || null,
      portfolio_items: input.portfolio_items && input.portfolio_items.length > 0 ? input.portfolio_items : null,
      status: 'pending',
    })
    .returning();

  const order = normalizeOrder(rows[0]);

  await db.insert(orderStatusHistoryTable).values({ order_id: order.id, status: 'pending', note: null });

  return order;
}

export async function getAllOrders(): Promise<Order[]> {
  const db = getDrizzle();
  if (!db) return [];

  try {
    const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.created_at));
    return rows.map(normalizeOrder);
  } catch (err) {
    console.error('[db] getAllOrders error:', err);
    return [];
  }
}

export async function getAllEnquiries(): Promise<Enquiry[]> {
  const db = getDrizzle();
  if (!db) return [];

  try {
    const rows = await db.select().from(enquiriesTable).orderBy(desc(enquiriesTable.created_at));
    return rows.map(normalizeEnquiry);
  } catch (err) {
    console.error('[db] getAllEnquiries error:', err);
    return [];
  }
}

// Matches by user_id when given (the reliable link, set at creation — see
// createOrder) as well as email (the guest-checkout fallback, and what
// covers orders placed before this account existed) — either match includes
// the row.
export async function getOrdersByEmail(email: string, userId?: string | null): Promise<Order[]> {
  const db = getDrizzle();
  if (!db) return [];

  try {
    const emailMatch = eq(ordersTable.customer_email, email.trim().toLowerCase());
    const condition = userId ? or(emailMatch, eq(ordersTable.user_id, userId)) : emailMatch;
    const rows = await db
      .select()
      .from(ordersTable)
      .where(condition)
      .orderBy(desc(ordersTable.created_at));
    return rows.map(normalizeOrder);
  } catch (err) {
    console.error('[db] getOrdersByEmail error:', err);
    return [];
  }
}

export async function getOrderById(id: string): Promise<Order | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus, note?: string | null): Promise<Order | null> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const rows = await db
    .update(ordersTable)
    .set({ status, updated_at: new Date() })
    .where(eq(ordersTable.id, id))
    .returning();

  if (rows.length === 0) return null;

  await db.insert(orderStatusHistoryTable).values({ order_id: id, status, note: note?.trim() || null });

  return normalizeOrder(rows[0]);
}

export async function getOrderHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
  const db = getDrizzle();
  if (!db) return [];

  const rows = await db
    .select()
    .from(orderStatusHistoryTable)
    .where(eq(orderStatusHistoryTable.order_id, orderId))
    .orderBy(asc(orderStatusHistoryTable.created_at));

  return rows.map(normalizeOrderHistoryEntry);
}

// Batched version of getOrderHistory for a whole order list (e.g. a
// customer's account page) — one query instead of one-per-order.
export async function getOrderHistoriesForOrders(orderIds: string[]): Promise<Map<string, OrderStatusHistoryEntry[]>> {
  const result = new Map<string, OrderStatusHistoryEntry[]>();
  if (orderIds.length === 0) return result;

  const db = getDrizzle();
  if (!db) return result;

  const rows = await db
    .select()
    .from(orderStatusHistoryTable)
    .where(inArray(orderStatusHistoryTable.order_id, orderIds))
    .orderBy(asc(orderStatusHistoryTable.created_at));

  for (const row of rows) {
    const entry = normalizeOrderHistoryEntry(row);
    const existing = result.get(entry.order_id);
    if (existing) existing.push(entry);
    else result.set(entry.order_id, [entry]);
  }
  return result;
}

// Set the quoted price for an order (admin sets this so customer can pay)
export async function setOrderPaymentAmount(id: string, amount: number): Promise<Order | null> {
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured.');

  const rows = await db
    .update(ordersTable)
    .set({ payment_amount: amount.toString(), updated_at: new Date() })
    .where(eq(ordersTable.id, id))
    .returning();

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
}

// Mark order as paid after PayPal capture succeeds
export async function markOrderPaid(id: string, paypalOrderId: string): Promise<Order | null> {
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured.');

  const rows = await db
    .update(ordersTable)
    .set({ payment_status: 'paid', payment_provider: 'paypal', paypal_order_id: paypalOrderId, updated_at: new Date() })
    .where(eq(ordersTable.id, id))
    .returning();

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
}

// Mark order as paid after a Razorpay payment signature verifies successfully
// (or the payment.captured webhook confirms it, whichever lands first).
export async function markOrderPaidRazorpay(id: string, razorpayOrderId: string, razorpayPaymentId: string): Promise<Order | null> {
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured.');

  const rows = await db
    .update(ordersTable)
    .set({
      payment_status: 'paid',
      payment_provider: 'razorpay',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      updated_at: new Date(),
    })
    .where(eq(ordersTable.id, id))
    .returning();

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
}

// Proofreader routes an order to a specific designer — pass null to unassign.
// Only that designer can then see or act on the order under /staff.
export async function assignOrderToDesigner(orderId: string, designerId: string | null): Promise<Order | null> {
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await db
    .update(ordersTable)
    .set({ assigned_designer_id: designerId, updated_at: new Date() })
    .where(eq(ordersTable.id, orderId))
    .returning();

  return rows.length > 0 ? normalizeOrder(rows[0]) : null;
}

// ─── Subscribers ──────────────────────────────────────────────────────────────

export async function upsertSubscriber(payload: SubscriberPayload): Promise<{
  subscriber: Subscriber | null;
  alreadySubscribed: boolean;
  resubscribed: boolean;
}> {
  const db = getDrizzle();
  if (!db) {
    throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');
  }

  const email = payload.email.trim().toLowerCase();

  // Check if subscriber exists
  const existing = await db.select().from(subscribersTable).where(eq(subscribersTable.email, email)).limit(1);

  if (existing.length > 0) {
    const sub = normalizeSubscriber(existing[0]);
    if (sub.active) {
      return { subscriber: sub, alreadySubscribed: true, resubscribed: false };
    }

    // Reactivate
    const updated = await db
      .update(subscribersTable)
      .set({ active: true, subscribed_at: new Date() })
      .where(eq(subscribersTable.id, sub.id))
      .returning();
    return { subscriber: normalizeSubscriber(updated[0]), alreadySubscribed: false, resubscribed: true };
  }

  // Insert new subscriber
  const inserted = await db
    .insert(subscribersTable)
    .values({
      email,
      first_name: payload.first_name?.trim() || null,
      country: payload.country?.trim() || null,
      active: true,
    })
    .returning();

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
  const db = getDrizzle();
  if (!db) {
    return { enquiries: [], subscribers: [], portfolioItems: [], posts: [], orders: [] };
  }

  try {
    const [enquiriesRes, subscribersRes, portfolioRes, postsRes, ordersRes] = await Promise.allSettled([
      db.select().from(enquiriesTable).orderBy(desc(enquiriesTable.created_at)).limit(50),
      db.select().from(subscribersTable).orderBy(desc(subscribersTable.subscribed_at)).limit(50),
      db
        .select({
          id: portfolioItemsTable.id,
          title: portfolioItemsTable.title,
          category: portfolioItemsTable.category,
          published: portfolioItemsTable.published,
          created_at: portfolioItemsTable.created_at,
        })
        .from(portfolioItemsTable)
        .orderBy(desc(portfolioItemsTable.created_at)),
      db
        .select({
          id: postsTable.id,
          title: postsTable.title,
          slug: postsTable.slug,
          category: postsTable.category,
          published: postsTable.published,
          published_at: postsTable.published_at,
        })
        .from(postsTable)
        .orderBy(desc(postsTable.published_at)),
      db.select().from(ordersTable).orderBy(desc(ordersTable.created_at)).limit(50),
    ]);

    const enquiries =
      enquiriesRes.status === 'fulfilled' ? enquiriesRes.value.map(normalizeEnquiry) : [];
    const subscribers =
      subscribersRes.status === 'fulfilled' ? subscribersRes.value.map(normalizeSubscriber) : [];
    const portfolioItems =
      portfolioRes.status === 'fulfilled' ? (portfolioRes.value as any[]).map(normalizePortfolioItem) : [];
    const posts =
      postsRes.status === 'fulfilled' ? (postsRes.value as any[]).map(normalizePost) : [];
    const orders =
      ordersRes.status === 'fulfilled' ? ordersRes.value.map(normalizeOrder) : [];

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
  const db = getDrizzle();
  if (!db) return [];

  const revisionRows = await db
    .select()
    .from(designRevisionsTable)
    .where(eq(designRevisionsTable.order_id, orderId))
    .orderBy(asc(designRevisionsTable.version));

  if (revisionRows.length === 0) return [];

  const commentRows = await db
    .select()
    .from(designCommentsTable)
    .where(
      inArray(
        designCommentsTable.revision_id,
        revisionRows.map((r) => r.id)
      )
    )
    .orderBy(asc(designCommentsTable.created_at));

  const commentsByRevision = new Map<string, DesignComment[]>();
  for (const row of commentRows) {
    const comment = normalizeDesignComment(row);
    const list = commentsByRevision.get(comment.revision_id) ?? [];
    list.push(comment);
    commentsByRevision.set(comment.revision_id, list);
  }

  return revisionRows.map((row) =>
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

// Batched, customer-visible version of getDesignRevisionsForCustomer for a
// whole order list — two queries total (revisions + their comments) instead
// of two per order.
export async function getDesignRevisionsForOrders(orderIds: string[]): Promise<Map<string, DesignRevision[]>> {
  const result = new Map<string, DesignRevision[]>();
  if (orderIds.length === 0) return result;

  const db = getDrizzle();
  if (!db) return result;

  const revisionRows = await db
    .select()
    .from(designRevisionsTable)
    .where(inArray(designRevisionsTable.order_id, orderIds))
    .orderBy(asc(designRevisionsTable.version));

  if (revisionRows.length === 0) return result;

  const commentRows = await db
    .select()
    .from(designCommentsTable)
    .where(inArray(designCommentsTable.revision_id, revisionRows.map((r) => r.id)))
    .orderBy(asc(designCommentsTable.created_at));

  const commentsByRevision = new Map<string, DesignComment[]>();
  for (const row of commentRows) {
    const comment = normalizeDesignComment(row);
    const list = commentsByRevision.get(comment.revision_id) ?? [];
    list.push(comment);
    commentsByRevision.set(comment.revision_id, list);
  }

  for (const row of revisionRows) {
    const revision = normalizeDesignRevision(row, commentsByRevision.get(String(row.id)) ?? []);
    if (!CUSTOMER_VISIBLE_STATUSES.has(revision.status)) continue;
    const list = result.get(revision.order_id) ?? [];
    list.push(revision);
    result.set(revision.order_id, list);
  }
  return result;
}

export async function getDesignRevisionById(id: string): Promise<DesignRevision | null> {
  const db = getDrizzle();
  if (!db) return null;

  const rows = await db.select().from(designRevisionsTable).where(eq(designRevisionsTable.id, id)).limit(1);
  if (rows.length === 0) return null;

  const commentRows = await db
    .select()
    .from(designCommentsTable)
    .where(eq(designCommentsTable.revision_id, id))
    .orderBy(asc(designCommentsTable.created_at));

  return normalizeDesignRevision(rows[0], commentRows.map(normalizeDesignComment));
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
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const latest = await db
    .select({ status: designRevisionsTable.status })
    .from(designRevisionsTable)
    .where(eq(designRevisionsTable.order_id, input.orderId))
    .orderBy(desc(designRevisionsTable.version))
    .limit(1);

  if (latest.length > 0 && latest[0].status !== 'returned_to_designer') {
    throw new Error(
      'This order already has a revision in progress — a new upload is only allowed once the proofreader routes it back to you.'
    );
  }

  const rows = await db
    .insert(designRevisionsTable)
    .values({
      order_id: input.orderId,
      version: dsql`COALESCE((SELECT MAX(version) FROM design_revisions WHERE order_id = ${input.orderId}), 0) + 1`,
      image_urls: input.imageUrls,
      notes: input.notes?.trim() || null,
      status: 'pending_proofreader_review',
    })
    .returning();

  return normalizeDesignRevision(rows[0]);
}

// Proofreader approves a revision awaiting their review, sending it on to the customer.
export async function proofreaderApproveRevision(revisionId: string): Promise<DesignRevision | null> {
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await db
    .update(designRevisionsTable)
    .set({ status: 'pending_review' })
    .where(and(eq(designRevisionsTable.id, revisionId), eq(designRevisionsTable.status, 'pending_proofreader_review')))
    .returning();

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
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await db
    .update(designRevisionsTable)
    .set({ status: 'returned_to_designer' })
    .where(
      and(
        eq(designRevisionsTable.id, revisionId),
        inArray(designRevisionsTable.status, ['pending_proofreader_review', 'changes_requested'])
      )
    )
    .returning();

  if (rows.length === 0) return null;

  if (comments.length > 0) {
    await db.insert(designCommentsTable).values(
      comments.map((c) => ({
        revision_id: revisionId,
        image_index: c.image_index,
        x: c.x.toString(),
        y: c.y.toString(),
        comment: c.comment.trim(),
        author_role: 'proofreader',
      }))
    );
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
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const newStatus: DesignRevisionStatus = action === 'approve' ? 'approved' : 'changes_requested';

  const rows = await db
    .update(designRevisionsTable)
    .set({ status: newStatus })
    .where(and(eq(designRevisionsTable.id, revisionId), eq(designRevisionsTable.status, 'pending_review')))
    .returning();

  if (rows.length === 0) return null;

  if (action === 'request_changes' && comments.length > 0) {
    await db.insert(designCommentsTable).values(
      comments.map((c) => ({
        revision_id: revisionId,
        image_index: c.image_index,
        x: c.x.toString(),
        y: c.y.toString(),
        comment: c.comment.trim(),
      }))
    );
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
  const db = getDrizzle();
  if (!db) throw new Error('Database is not configured. Please set DATABASE_URL in .env.local.');

  const rows = await db
    .update(designCommentsTable)
    .set(field === 'designer_resolved' ? { designer_resolved: value } : { proofreader_resolved: value })
    .where(eq(designCommentsTable.id, commentId))
    .returning();

  return rows.length > 0 ? normalizeDesignComment(rows[0]) : null;
}
