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
        return rows as PortfolioItem[];
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
      if (rows.length > 0) return rows[0] as PortfolioItem;
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
        return rows as Post[];
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
        return rows[0] as Post;
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
      'new'
    )
    RETURNING id, name, email, phone, country, service_type, event_date, quantity_estimate, description, source, created_at, status
  `;

  return rows[0] as Enquiry;
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
    const sub = existing[0] as Subscriber;
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
    return { subscriber: updated[0] as Subscriber, alreadySubscribed: false, resubscribed: true };
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

  return { subscriber: inserted[0] as Subscriber, alreadySubscribed: false, resubscribed: false };
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

export async function getAdminDashboardData(): Promise<{
  enquiries: Enquiry[];
  subscribers: Subscriber[];
  portfolioItems: Partial<PortfolioItem>[];
  posts: Partial<Post>[];
}> {
  const sql = getDb();
  if (!sql) {
    return { enquiries: [], subscribers: [], portfolioItems: [], posts: [] };
  }

  try {
    const [enquiriesRes, subscribersRes, portfolioRes, postsRes] = await Promise.allSettled([
      sql`SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 50`,
      sql`SELECT * FROM subscribers ORDER BY subscribed_at DESC LIMIT 50`,
      sql`SELECT id, title, category, published, created_at FROM portfolio_items ORDER BY created_at DESC`,
      sql`SELECT id, title, slug, category, published, published_at FROM posts ORDER BY published_at DESC`,
    ]);

    const enquiries =
      enquiriesRes.status === 'fulfilled' ? (enquiriesRes.value as Enquiry[]) : [];
    const subscribers =
      subscribersRes.status === 'fulfilled' ? (subscribersRes.value as Subscriber[]) : [];
    const portfolioItems =
      portfolioRes.status === 'fulfilled' ? (portfolioRes.value as Partial<PortfolioItem>[]) : [];
    const posts = postsRes.status === 'fulfilled' ? (postsRes.value as Partial<Post>[]) : [];

    return { enquiries, subscribers, portfolioItems, posts };
  } catch (err) {
    console.error('[db] getAdminDashboardData error:', err);
    return { enquiries: [], subscribers: [], portfolioItems: [], posts: [] };
  }
}
