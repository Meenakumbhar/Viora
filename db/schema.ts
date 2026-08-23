import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  jsonb,
  integer,
  numeric,
  unique,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema';

// Column keys intentionally mirror the existing snake_case shape used
// throughout types/database.ts and every API response — this schema is the
// source of truth for the same columns, not a stylistic rewrite, so query
// results need no remapping to slot into the current normalizer functions.

// The `users` table is now owned by Better Auth — see db/auth-schema.ts
// (generated via `npx @better-auth/cli generate`, config in lib/auth.ts).
// It defines `user`, `session`, `account`, and `verification`.

export const enquiries = pgTable('enquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  // Set when the customer was logged in at submission — the real link to
  // their account, separate from `email` above (which stays as the guest
  // fallback: a customer can submit before ever creating an account, and
  // matching by email means their history still shows up once they sign up).
  user_id: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  phone: text('phone'),
  country: text('country'),
  service_type: text('service_type').notNull(),
  event_date: date('event_date'),
  quantity_estimate: text('quantity_estimate'),
  description: text('description'),
  // Delivery/venue address — only asked of returning customers via the
  // logged-in quick-quote form, since it's the kind of detail that changes
  // per order rather than something worth saving to their profile.
  address: text('address'),
  source: text('source'),
  portfolio_items: jsonb('portfolio_items'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').notNull().default('new'),
});

export const orderForms = pgTable('order_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  enquiry_id: uuid('enquiry_id')
    .notNull()
    .unique('order_forms_enquiry_id_key')
    .references(() => enquiries.id, { onDelete: 'cascade' }),
  deceased_name: text('deceased_name'),
  funeral_date: date('funeral_date'),
  funeral_time: text('funeral_time'),
  venue_name: text('venue_name'),
  date_of_birth: date('date_of_birth'),
  date_of_death: date('date_of_death'),
  age_of_deceased: text('age_of_deceased'),
  photo_option: text('photo_option'),
  bespoke_design: boolean('bespoke_design').notNull().default(false),
  bespoke_details: text('bespoke_details'),
  number_of_pages: text('number_of_pages'),
  inside_pages_style: text('inside_pages_style'),
  quantity: text('quantity'),
  photo_qty: integer('photo_qty'),
  photo_supplied_via: text('photo_supplied_via'),
  photo_instructions: text('photo_instructions'),
  additional_products: jsonb('additional_products'),
  callback_requested: boolean('callback_requested').notNull().default(false),
  callback_phone: text('callback_phone'),
  additional_notes: text('additional_notes'),
  // Thanks/wake/donation wording for the back cover — a distinct field from
  // additional_notes above (internal notes for the design team), not a
  // reuse of it.
  backpage_information: text('backpage_information'),
  // A single supporting file (photo, PDF, etc.) the customer can attach
  // directly instead of emailing/posting it — see photo_supplied_via above
  // for the older out-of-band path, which still works alongside this.
  attachment_url: text('attachment_url'),
  status: text('status').notNull().default('draft'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscribers = pgTable('subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique('subscribers_email_key'),
  first_name: text('first_name'),
  country: text('country'),
  subscribed_at: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
  active: boolean('active').notNull().default(true),
});

export const portfolioItems = pgTable('portfolio_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  tags: text('tags').array().notNull().default([]),
  filters: jsonb('filters').notNull().default({}),
  template_number: text('template_number'),
  image_url: text('image_url').notNull(),
  image_urls: jsonb('image_urls'),
  description: text('description'),
  location: text('location'),
  published: boolean('published').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique('products_slug_key'),
  type_slug: text('type_slug').notNull(),
  type_label: text('type_label').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  category: text('category').notNull(),
  image_url: text('image_url'),
  image_urls: jsonb('image_urls'),
  sizes: jsonb('sizes').notNull().default([]),
  related_slugs: text('related_slugs').array().notNull().default([]),
  published: boolean('published').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique('posts_slug_key'),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  category: text('category'),
  image_url: text('image_url'),
  published_at: date('published_at').notNull().defaultNow(),
  published: boolean('published').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  enquiry_id: uuid('enquiry_id').references(() => enquiries.id, { onDelete: 'set null' }),
  // Real link to the customer's account — carried over from the source
  // enquiry when there is one, else best-effort matched by email at
  // creation time (see createOrder in lib/db.ts). `customer_email` remains
  // the guest-checkout fallback for orders with no matching account.
  user_id: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  customer_name: text('customer_name').notNull(),
  customer_email: text('customer_email').notNull(),
  service_type: text('service_type').notNull(),
  event_date: date('event_date'),
  quantity_estimate: text('quantity_estimate'),
  details: text('details'),
  portfolio_items: jsonb('portfolio_items'),
  status: text('status').notNull().default('pending'),
  payment_status: text('payment_status').notNull().default('unpaid'),
  payment_amount: numeric('payment_amount', { precision: 10, scale: 2 }),
  payment_provider: text('payment_provider'),
  paypal_order_id: text('paypal_order_id'),
  razorpay_order_id: text('razorpay_order_id'),
  razorpay_payment_id: text('razorpay_payment_id'),
  assigned_designer_id: text('assigned_designer_id').references(() => user.id, { onDelete: 'set null' }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  note: text('note'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const designRevisions = pgTable(
  'design_revisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    order_id: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    image_urls: text('image_urls').array().notNull(),
    // Positionally matched to image_urls (same index, same length once set) —
    // an optional caption like "Thank You Card" shown on the review tabs
    // instead of "Image N", for orders bundling proofs of several products.
    // Nullable/absent on older revisions, which just keep the "Image N" tab text.
    image_labels: text('image_labels').array(),
    notes: text('notes'),
    // The live column's actual default is 'pending_review', not
    // 'pending_proofreader_review' as neon_schema.sql documents — found via
    // drizzle-kit introspect. Harmless in practice: createDesignRevision()
    // always sets status explicitly, so the column default is never
    // exercised, but this schema reflects the real live value, not the docs.
    status: text('status').notNull().default('pending_review'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    // Touched explicitly by every status-changing mutation (proofreader
    // approve/return, customer approve/request-changes) — created_at alone
    // only tells you when this version was first uploaded, not when it most
    // recently changed hands, which the staff "waiting since" queue view needs.
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('design_revisions_order_id_version_key').on(table.version, table.order_id)]
);

export const designComments = pgTable('design_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  revision_id: uuid('revision_id')
    .notNull()
    .references(() => designRevisions.id, { onDelete: 'cascade' }),
  image_index: integer('image_index').notNull().default(0),
  x: numeric('x', { precision: 6, scale: 5 }).notNull(),
  y: numeric('y', { precision: 6, scale: 5 }).notNull(),
  comment: text('comment').notNull(),
  designer_resolved: boolean('designer_resolved').notNull().default(false),
  proofreader_resolved: boolean('proofreader_resolved').notNull().default(false),
  author_role: text('author_role').notNull().default('customer'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// A generic, append-only event log for the staff-facing activity feed —
// distinct from order_status_history (which only ever logs order.status
// changes). This covers everything a designer/proofreader/admin actually
// needs to know happened: a proof uploaded, returned, sent to the customer,
// approved, or an order (re)assigned. Denormalized `detail` (e.g. "v2 · 3
// marks", or a designer's name) is written once at event time rather than
// reconstructed at read time, so the feed never needs to join out to
// design_comments or users just to render a line of text.
export const staffActivity = pgTable('staff_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  order_id: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  event_type: text('event_type').notNull(),
  detail: text('detail'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// A specific price for one actual portfolio piece, the same for every
// customer who doesn't have something more specific set for them (see
// customerItemPrices below, and the full lookup order documented on
// getEffectivePrice in lib/db.ts).
export const portfolioItemPrices = pgTable('portfolio_item_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolio_item_id: uuid('portfolio_item_id')
    .notNull()
    .unique('portfolio_item_prices_portfolio_item_id_key')
    .references(() => portfolioItems.id, { onDelete: 'cascade' }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('GBP'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// The genuinely per-customer, per-piece price — the same item can cost a
// different amount for different customers. This is the most specific
// price and always wins first (see getEffectivePrice in lib/db.ts), before
// portfolioItemPrices' shared baseline. There's deliberately no `set_by`
// column since admin access here is a single shared password with no
// per-admin identity (see utils/admin-auth.ts), so there's nothing
// meaningful to record there.
export const customerItemPrices = pgTable('customer_item_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  portfolio_item_id: uuid('portfolio_item_id')
    .notNull()
    .references(() => portfolioItems.id, { onDelete: 'cascade' }),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('GBP'),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('customer_item_prices_user_item_key').on(table.user_id, table.portfolio_item_id)]);
