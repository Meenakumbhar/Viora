-- ==============================================================================
-- Memories in Prints / Viora — Neon PostgreSQL Schema & Seed Script
-- ==============================================================================
-- Run this script in the Neon SQL Editor (https://console.neon.tech)
-- to initialize tables, indexes, and initial content in one click.
-- ==============================================================================

-- 0. Users, sessions, accounts, and email verification are now owned by
-- Better Auth (lib/auth.ts) and defined in db/auth-schema.ts, generated via
-- `npx @better-auth/cli generate`. This whole schema is applied with
-- `npx drizzle-kit push` (config: drizzle.config.ts, sources: db/schema.ts +
-- db/auth-schema.ts) rather than by hand-copying SQL from this file — that
-- was the actual point of adopting Drizzle as the schema source of truth.
-- The tables below (portfolio, orders, etc.) are still hand-maintained here
-- for now; treat this file as historical/reference, not something to run
-- against a database that already has the Drizzle-managed tables in it.

-- 1. Create Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    service_type TEXT NOT NULL,
    event_date DATE,
    quantity_estimate TEXT,
    description TEXT,
    address TEXT,
    source TEXT,
    portfolio_items JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status TEXT DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'read', 'replied', 'converted'))
);

-- Add portfolio_items to an existing database without affecting current enquiries.
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS portfolio_items JSONB;
-- Delivery/venue address, captured on the logged-in quick-quote form.
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS address TEXT;

-- 1a. Order Forms — the detailed print-spec form a customer fills in once a
-- quote is placed (deceased/service details, page count, bespoke design,
-- add-on products). One per enquiry, reachable via an emailed link or from
-- the customer's account without requiring login (the enquiry's own UUID is
-- the access key).
CREATE TABLE IF NOT EXISTS order_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE UNIQUE,
    deceased_name TEXT,
    funeral_date DATE,
    funeral_time TEXT,
    venue_name TEXT,
    date_of_birth DATE,
    date_of_death DATE,
    age_of_deceased TEXT,
    photo_option TEXT CHECK (photo_option IN ('none', 'colour', 'bw')),
    bespoke_design BOOLEAN NOT NULL DEFAULT FALSE,
    bespoke_details TEXT,
    number_of_pages TEXT,
    inside_pages_style TEXT CHECK (inside_pages_style IN ('bw', 'match_cover')),
    quantity TEXT,
    photo_qty INTEGER,
    photo_supplied_via TEXT CHECK (photo_supplied_via IN ('email', 'post')),
    photo_instructions TEXT,
    additional_products JSONB,
    callback_requested BOOLEAN NOT NULL DEFAULT FALSE,
    callback_phone TEXT,
    additional_notes TEXT,
    -- Thanks/wake/donation wording for the back cover — distinct from
    -- additional_notes (internal notes for the design team).
    backpage_information TEXT,
    -- A single supporting file (photo, PDF, etc.) attached directly instead
    -- of emailed/posted — see photo_supplied_via above for that older path.
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_forms_enquiry_id ON order_forms(enquiry_id);
ALTER TABLE order_forms ADD COLUMN IF NOT EXISTS backpage_information TEXT;
ALTER TABLE order_forms ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- 2. Create Subscribers Table (Newsletter)
CREATE TABLE IF NOT EXISTS subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    country TEXT,
    subscribed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 3. Create Portfolio Items Table
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('wedding', 'funeral', 'sports', 'branding', 'events')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    filters JSONB NOT NULL DEFAULT '{}',
    template_number TEXT,
    image_url TEXT NOT NULL,
    image_urls JSONB,
    description TEXT,
    location TEXT,
    published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add tags to an existing database without affecting current portfolio items.
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- A plain (not unique) field for a per-item template/reference number — kept
-- separate from the `filters` JSONB bag since it identifies the item itself
-- rather than describing it. Not unique: some existing items share a number.
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS template_number TEXT;
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS filters JSONB NOT NULL DEFAULT '{}';
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS image_urls JSONB;

-- 4. Create Posts Table (Blog)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category TEXT,
    image_url TEXT,
    published_at DATE DEFAULT CURRENT_DATE NOT NULL,
    published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Create Orders Table (fulfillment tracker, separate from enquiry CRM status)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID REFERENCES enquiries(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    service_type TEXT NOT NULL,
    event_date DATE,
    quantity_estimate TEXT,
    details TEXT,
    portfolio_items JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add event_date/quantity_estimate/portfolio_items to an existing database without affecting current orders.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity_estimate TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS portfolio_items JSONB;
-- Which designer the proofreader has routed this order to — null until assigned.
-- A designer only sees/acts on orders assigned to them.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_designer_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_assigned_designer_id ON orders(assigned_designer_id);

-- Payment tracking — PayPal and Razorpay are the two supported checkout methods.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

-- 6. Create Order Status History Table (the visual tracker's timeline data)
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Create Design Revisions Table (proofs submitted for review, one row per round).
-- Every revision must clear the proofreader gate (pending_proofreader_review ->
-- returned_to_designer or pending_review) before a customer ever sees it.
CREATE TABLE IF NOT EXISTS design_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    image_urls TEXT[] NOT NULL,
    image_labels TEXT[],
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending_proofreader_review' CHECK (status IN ('pending_proofreader_review', 'returned_to_designer', 'pending_review', 'changes_requested', 'approved')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (order_id, version)
);
CREATE INDEX IF NOT EXISTS idx_design_revisions_order_id ON design_revisions(order_id);
ALTER TABLE design_revisions ADD COLUMN IF NOT EXISTS image_labels TEXT[];
ALTER TABLE design_revisions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- 8. Create Design Comments Table (pinned markup on a revision's image(s), left by
-- either the customer during their review or the proofreader sending it back to the designer)
CREATE TABLE IF NOT EXISTS design_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    revision_id UUID NOT NULL REFERENCES design_revisions(id) ON DELETE CASCADE,
    image_index INTEGER NOT NULL DEFAULT 0,
    x NUMERIC(6,5) NOT NULL CHECK (x >= 0 AND x <= 1),
    y NUMERIC(6,5) NOT NULL CHECK (y >= 0 AND y <= 1),
    comment TEXT NOT NULL,
    -- Tracked independently: the designer marking their own fix done never
    -- implies the proofreader has actually confirmed it, and vice versa.
    designer_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    proofreader_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    author_role TEXT NOT NULL DEFAULT 'customer' CHECK (author_role IN ('customer', 'proofreader')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_design_comments_revision_id ON design_comments(revision_id);

-- 8b. Generic append-only event log for the staff activity feed — distinct
-- from order_status_history (which only logs order.status changes).
CREATE TABLE IF NOT EXISTS staff_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_staff_activity_created_at ON staff_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_activity_order_id ON staff_activity(order_id);

-- 9. A specific price for one actual portfolio piece, the same for every
-- customer who doesn't have something more specific set for them.
CREATE TABLE IF NOT EXISTS portfolio_item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_item_id UUID NOT NULL UNIQUE REFERENCES portfolio_items(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. The genuinely per-customer, per-piece price — the same item can cost
-- a different amount for different customers. Most specific price there
-- is; wins first over portfolio_item_prices' shared baseline (see
-- getEffectivePrice in lib/db.ts). No set_by column: admin access is a
-- single shared password with no per-admin identity (see
-- utils/admin-auth.ts), so there's nothing to record there.
CREATE TABLE IF NOT EXISTS customer_item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, portfolio_item_id)
);

-- 11. Create Products Table — same admin-managed pattern as portfolio_items,
-- but addressed by a unique slug (products have their own /products/[slug]
-- page) rather than by id.
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    -- Groups this design with sibling designs of the same catalog item
    -- (e.g. every "Memory Cards" design shares type_slug 'memory-cards').
    -- Public /products/[typeSlug] pages key off this, not `slug`.
    type_slug TEXT NOT NULL,
    type_label TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('wedding', 'funeral', 'sports', 'branding', 'events')),
    image_url TEXT,
    image_urls JSONB,
    sizes JSONB NOT NULL DEFAULT '[]',
    related_slugs TEXT[] NOT NULL DEFAULT '{}',
    published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add type_slug/type_label to a products table created before this concept
-- existed. Nullable at first so the ALTER succeeds on populated tables;
-- backfilled below (type_slug = slug, type_label = title — each existing
-- row becomes its own type's first design, so no URL changes), then locked
-- to NOT NULL.
ALTER TABLE products ADD COLUMN IF NOT EXISTS type_slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS type_label TEXT;
UPDATE products SET type_slug = slug WHERE type_slug IS NULL;
UPDATE products SET type_label = title WHERE type_label IS NULL;
ALTER TABLE products ALTER COLUMN type_slug SET NOT NULL;
ALTER TABLE products ALTER COLUMN type_label SET NOT NULL;

-- ─── Indexes for Performance ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(active, subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_published_category ON portfolio_items(published, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published_slug ON posts(published, slug);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_posts_published_date ON posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_published_category ON products(published, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_type_slug ON products(type_slug, published);


-- ─── 5. Seed Initial Portfolio Items ──────────────────────────────────────────
INSERT INTO portfolio_items (title, category, image_url, description, location, published) VALUES
('Amara & James Wedding Suite', 'wedding', '/images/portfolio/wedding.jpg', 'Full invitation suite with foil-stamped details and custom envelope liner.', 'London, UK', true),
('Celebrating Margaret', 'funeral', '/images/portfolio/funeral.jpg', 'A 12-page order of service with hand-selected photography and hymn sheets.', 'Bath, UK', true),
('Riverside FC Season Programme', 'sports', '/images/portfolio/sports.jpg', 'Matchday programme series with sponsor integration and squad profiles.', 'Manchester, UK', true),
('Bloom Botanicals Brand Identity', 'branding', '/images/portfolio/branding.jpg', 'Logo, colour system, and stationery suite for an independent florist.', 'Portland, OR', true),
('Sophie & Raj Engagement Party', 'events', '/images/portfolio/events.jpg', 'Invitation set with bilingual copy and custom illustrated motifs.', 'Birmingham, UK', true),
('In Memory of Thomas Reid', 'funeral', '/images/portfolio/funeral.jpg', 'Memorial cards and memory book with archival photography.', 'Dublin, Ireland', true),
('Hawkfield Athletics Club', 'sports', '/images/portfolio/sports.jpg', 'Complete rebrand including badge, kit templates, and event signage.', 'Melbourne, Australia', true),
('Clara & Daniel Save-the-Dates', 'wedding', '/images/portfolio/wedding.jpg', 'Letterpress save-the-date cards on cotton rag stock.', 'New York, NY', true),
('Oakwood Coffee Roasters', 'branding', '/images/portfolio/branding.jpg', 'Packaging design, labels, and café menu system.', 'Copenhagen, Denmark', true),
('Summer Gala Invitations', 'events', '/images/portfolio/events.jpg', 'Gold-foiled invitations with reply cards and information inserts.', 'Dallas, TX', true),
('Remembering Anita Patel', 'funeral', '/images/portfolio/funeral.jpg', 'A celebration of life booklet with family photos and personal tributes.', 'Mumbai, India', true),
('Peninsula Rugby Sponsor Pack', 'sports', '/images/portfolio/sports.jpg', 'Sponsor proposal deck with ROI metrics and partnership tiers.', 'Sydney, Australia', true)
ON CONFLICT DO NOTHING;


-- ─── 6. Seed Initial Blog Posts ───────────────────────────────────────────────
INSERT INTO posts (title, slug, excerpt, category, image_url, published_at, published, content) VALUES
(
  'Choosing Paper Stock for Your Wedding Stationery',
  'choosing-paper-stock-wedding',
  'From cotton rag to textured linen — a guide to the stocks that make your invitations unforgettable.',
  'Wedding Guides',
  '/images/blog/paper-stock.jpg',
  '2026-05-20',
  true,
  'When designing wedding suites, paper stock is not merely a surface for ink — it is a foundational design decision. A heavier stock instantly conveys quality and gravity. We recommend using at least 300gsm (grams per square metre) for invite inserts, and going up to 600gsm for the primary invite card to achieve a truly premium feel.

Textured linen and cotton rag are two of the most popular high-end papers. Cotton rag has soft deckled edges and a natural texture, making it perfect for letterpress and foil printing. Linen, with its cross-hatch texture, provides a crisp, elegant surface that holds detailed graphic designs perfectly.

Vellum (translucent paper) can be used as an overlay to add layers and mystery to your suite. Foil stamping (in gold, copper, or silver) adds a reflective finish that catches the light beautifully. If you choose letterpress, the design is literally pressed into thick cotton paper, creating a three-dimensional tactile effect.'
),
(
  'What to Include in a Funeral Order of Service',
  'what-to-include-order-of-service',
  'A practical guide for families and funeral directors planning the printed ceremony booklet.',
  'Funeral Advice',
  '/images/blog/order-of-service.jpg',
  '2026-05-14',
  true,
  'Designing an order of service booklet requires balance. It must contain all essential text for readings and hymns while keeping a clean, unhurried typographic rhythm. The standard format is a 4-page or 8-page booklet printed on heavy uncoated paper, which gives a warm, tactile feel.

The front cover should be minimal: a central photo, full name, dates, and a quiet subtitle (e.g., "A Celebration of Life"). Inside pages contain the schedule of the service, names of readers, complete hymn lyrics, and any musical selections.

The back cover is typically reserved for a final photo, expressions of thanks from the family, and details regarding donations or reception gatherings. We recommend keeping the text spacious and placing photos on dedicated pages or alongside short quotes to maintain a calm, uncrowded layout.'
),
(
  'Why Every Sports Club Needs a Matchday Programme',
  'sports-club-matchday-programme',
  'More than a teamsheet — how programmes build community, attract sponsors, and tell your club story.',
  'Design Tips',
  '/images/blog/matchday-programme.jpg',
  '2026-05-07',
  true,
  'In a digital-first sports environment, a printed matchday programme remains a key ritual for supporters. It is a collectible item that documents a club’s timeline, features sponsor logos, and displays team sheets. A clean layout and bold typography make the programme look professional at any competitive level.

For clubs, the programme is also a valuable commercial asset. Sponsors want their brands featured on high-quality print that supporters take home and display, rather than a fleeting banner ad on a website.

We recommend structuring your programme with fixed, templated sections: manager notes, team lists, match reports, and sponsor pages. This makes it fast to update squad names and fixtures for each game. Using a robust sans-serif font for stats and a serif font for editorial pieces creates a sharp, premium sports aesthetic.'
),
(
  'Inside the Studio: How We Handle Rush Orders',
  'inside-studio-rush-orders',
  'Behind the scenes of our 24-hour turnaround process for time-sensitive memorial print.',
  'Studio News',
  '/images/blog/rush-orders.jpg',
  '2026-04-28',
  true,
  'Standard design workflows usually take days or weeks. However, memorial printing requires immediate turnarounds. To support grieving families, we prioritize these briefs and deliver first digital proofs within 12–24 hours of receiving text and photos.

We maintain dedicated production slots with our printing partners and use express tracked shipping. This ensures that booklets arrive directly at the family home or funeral home in time for the service.

To help us speed up your order, send us all texts and high-resolution images together. We will check the photos, clean up any backgrounds if requested, and handle the typography. Once you give your final email approval, files are immediately sent to the press.'
),
(
  'From Brief to Delivery: A Real Wedding Project',
  'brief-to-delivery-wedding-project',
  'Following one couple''s full stationery journey from initial enquiry to the big day.',
  'Client Stories',
  '/images/blog/client-story.jpg',
  '2026-04-15',
  true,
  'We recently completed a custom wedding suite project that shows our design workflow. The couple wanted a minimal layout with organic details, reflecting their outdoor venue in Bath, UK. We started by discussing paper textures, choosing a soft cotton rag stock with gold foil details.

The first design concept focused on typography. We paired a clean sans-serif font for details with a hand-selected italic serif accent for the names. This mixed font style became the signature of the entire event suite.

After refining the invitation, we adapted the design for welcome signage, table plans, and menus. This consistency made the reception look beautifully coordinated. We managed the entire pre-flight checking, printing, and shipping process, delivering the suite direct to the venue.'
)
ON CONFLICT (slug) DO UPDATE 
SET 
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  published_at = EXCLUDED.published_at,
  content = EXCLUDED.content,
  published = EXCLUDED.published;


-- ─── 7. Seed Initial Products (migrated from lib/data.ts's static `products`) ─
INSERT INTO products (slug, type_slug, type_label, title, subtitle, description, category, image_url, image_urls, sizes, related_slugs) VALUES
(
  'memory-cards', 'memory-cards', 'Memory Cards', 'Memory Cards', 'A Place to Share Precious Memories',
  'Our memorial cards offer guests an opportunity to leave personal messages, treasured memories, or words of comfort for the family. These keepsakes become a beautiful collection of stories to look back on in the days ahead. They can also be sent prior to the service to share news of a loved one’s passing and provide thoughtful details about the ceremony.',
  'funeral', '/images/products/memory-cards.jpg', NULL,
  '[{"label":"Standard","dimensions":"A6 (148 mm × 105 mm)"}]',
  ARRAY['thank-you-card','attendance-cards']
),
(
  'thank-you-card', 'thank-you-card', 'Thank You Card', 'Thank You Card', 'A Heartfelt Way to Say Thank You',
  'Our Thank You cards offer a meaningful way to express your gratitude to those who have supported you during a difficult time. These cards allow you to share your appreciation for the comfort, kindness, and presence of friends and family. They serve as a heartfelt reminder of the compassion shown and can be sent after the service to acknowledge and thank those who stood by you.',
  'funeral', '/images/products/thank-you-card.jpg', NULL,
  '[{"label":"Standard","dimensions":"A6 (105 mm × 148 mm)"}]',
  ARRAY['memory-cards','bookmarks']
),
(
  'memorial-boards', 'memorial-boards', 'Memorial Boards', 'Memorial Boards', 'Celebrate a Life Through a Beautifully Crafted Memory Board',
  'A memory board is a heartfelt way to share the story of someone special. Whether displayed at a ceremony, wake, or celebration of life, it becomes a touching focal point — a place where memories come alive. Printed on premium rigid foam board, our memory boards are lightweight yet durable, perfect for displaying free-standing or on an elegant easel. Please allow an additional day for production and delivery to ensure every detail is perfect.',
  'funeral', '/images/products/memorial-boards.jpg', NULL,
  '[{"label":"A1","dimensions":"594 × 841 mm"},{"label":"A2","dimensions":"420 × 594 mm"},{"label":"A3","dimensions":"297 × 420 mm"}]',
  ARRAY['photo-prints','memorial-portraits','memory-boxes']
),
(
  'memory-boxes', 'memory-boxes', 'Memory Boxes', 'Memory Boxes', 'A Beautiful Place to Store Treasured Keepsakes',
  'Memory Boxes provide a beautiful and secure place to store treasured keepsakes, photographs, cards, and meaningful mementos in memory of a loved one. Crafted using premium-quality materials, each box features a magnetic closure for safe and elegant storage while creating a lasting tribute that can be cherished for years to come. Choose from a range of standard designs or create a completely personalised memory box with your own photographs, colours, and wording.',
  'funeral', '/images/products/Memory-Box.png', NULL,
  '[{"label":"Large","dimensions":"300 × 310 × 70 mm"},{"label":"Medium","dimensions":"245 × 300 × 70 mm"},{"label":"Small","dimensions":"219 × 223 × 70 mm"}]',
  ARRAY['memorial-boards','photo-prints']
),
(
  'seed-cards', 'seed-cards', 'Seed Cards', 'Seed Cards', 'A Living Tribute',
  'Our Memorial Seed Cards offer a heartfelt way to honour a loved one, creating a tribute that grows and blossoms over time. Each card includes a seed packet attached to the reverse — easily removed without harming the beautifully laminated card. Choose from three meaningful flower varieties.',
  'funeral', '/images/products/seed-cards.jpg', NULL,
  '[{"label":"Standard","dimensions":"82 mm × 112 mm"}]',
  ARRAY['bookmarks','memory-cards']
),
(
  'attendance-cards', 'attendance-cards', 'Attendance Cards', 'Attendance Cards', 'A Record of Love and Support',
  'Our attendance cards provide a simple yet meaningful way for families to know who came to honour their loved one. Guests can sign their names or share a few heartfelt words, creating a lasting record of those who gathered in remembrance. These cards can also be sent in advance, notifying friends and family of the service and inviting them to attend.',
  'funeral', '/images/products/attendance-cards.jpg', NULL,
  '[{"label":"Standard","dimensions":"148 mm × 105 mm"}]',
  ARRAY['memory-cards','thank-you-card']
),
(
  'photo-prints', 'photo-prints', 'Photo Prints', 'Photo Prints', 'Print Your Cherished Photo in the Perfect Size',
  'If you already have a special frame you’d like to use at the funeral service or wake, we can provide beautifully printed photos to fit perfectly. To achieve the best results, we recommend providing a high-quality image — the larger the print, the clearer and more striking your photograph will appear.',
  'funeral', '/images/products/photo-prints.jpg', NULL,
  '[{"label":"A4","dimensions":"210 × 297 mm"},{"label":"A5","dimensions":"148 × 210 mm"},{"label":"10 × 8\"","dimensions":"254 × 203 mm"}]',
  ARRAY['memorial-portraits','memorial-boards','memory-boxes']
),
(
  'bookmarks', 'bookmarks', 'Bookmarks', 'Bookmarks', 'A Keepsake for Quiet Moments',
  'These elegant bookmarks are a timeless and thoughtful keepsake to honour and remember a loved one. Every time you open a book, their memory is there — gently accompanying you through stories, quiet moments, and reflections. More than just a marker between pages, it’s a symbol of enduring love, comfort, and connection. Small in size, yet big in meaning, this keepsake helps you feel close to those you hold dear, every day.',
  'funeral', '/images/products/bookmarks.jpg', NULL,
  '[{"label":"Standard","dimensions":"50 mm × 200 mm"}]',
  ARRAY['seed-cards','memory-cards']
),
(
  'memorial-portraits', 'memorial-portraits', 'Memorial Portraits', 'Memorial Portraits', 'Beautiful Memorial Portraits to Treasure Forever',
  'Honour the memory of your loved one with high-quality portraits designed to look beautiful during the ceremony — and continue to be cherished for years to come. Each style is carefully selected for exceptional quality at an affordable price.',
  'funeral', '/images/products/classic Memorial Portraits.jpg.jpeg',
  '["/images/products/classic Memorial Portraits.jpg.jpeg","/images/products/contempory Memorial Portraits2.jpg.jpeg","/images/products/Reflection Memorial Portraits3.jpg.jpeg","/images/products/Traditional Memorial Portraits4.jpg.jpeg"]',
  '[{"label":"The Classic","dimensions":"229 × 305 mm","description":"A timeless A4 portrait mounted in durable, drop-resistant tempered glass with its own stand. Perfect for display on a shelf, desk, or wall."},{"label":"The Contemporary","dimensions":"305 × 305 × 38 mm or 305 × 406 × 38 mm","description":"A lightweight, premium canvas print stretched over a sturdy frame and fitted with hanging eyes. Optional black wooden float frame available."},{"label":"The Reflection","dimensions":"279 × 103 × 19 mm or 152 × 203 × 19 mm","description":"A sleek and versatile acrylic block that displays photos and messages with clarity. Easily reusable with simple photo transfer."},{"label":"The Traditional","dimensions":"458 × 599 mm","description":"A large A3 print in a two-tone frame with a contrasting mount. Supplied with both a stand and hooks for portrait or landscape orientation."}]',
  ARRAY['photo-prints','memorial-boards']
)
ON CONFLICT (slug) DO UPDATE
SET
  type_slug = EXCLUDED.type_slug,
  type_label = EXCLUDED.type_label,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  image_urls = EXCLUDED.image_urls,
  sizes = EXCLUDED.sizes,
  related_slugs = EXCLUDED.related_slugs;
