-- ==============================================================================
-- Memories in Prints / Viora — Neon PostgreSQL Schema & Seed Script
-- ==============================================================================
-- Run this script in the Neon SQL Editor (https://console.neon.tech)
-- to initialize tables, indexes, and initial content in one click.
-- ==============================================================================

-- 0. Create Users Table (customer accounts, email-verified via Resend)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    email_verified BOOLEAN DEFAULT FALSE NOT NULL,
    verification_token TEXT,
    verification_token_expires TIMESTAMPTZ,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'employee', 'designer', 'proofreader', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

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
    source TEXT,
    portfolio_items JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status TEXT DEFAULT 'new' NOT NULL CHECK (status IN ('new', 'read', 'replied', 'converted'))
);

-- Add portfolio_items to an existing database without affecting current enquiries.
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS portfolio_items JSONB;

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
    image_url TEXT NOT NULL,
    image_urls JSONB,
    description TEXT,
    location TEXT,
    published BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add tags to an existing database without affecting current portfolio items.
ALTER TABLE portfolio_items ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
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
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending_proofreader_review' CHECK (status IN ('pending_proofreader_review', 'returned_to_designer', 'pending_review', 'changes_requested', 'approved')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE (order_id, version)
);
CREATE INDEX IF NOT EXISTS idx_design_revisions_order_id ON design_revisions(order_id);

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

-- ─── Indexes for Performance ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(active, subscribed_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_published_category ON portfolio_items(published, category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published_slug ON posts(published, slug);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_posts_published_date ON posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);


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
