import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

await sql`
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
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
)
`;
console.log('✅ products table created (or already existed)');

await sql`CREATE INDEX IF NOT EXISTS idx_products_published_category ON products(published, category, created_at DESC)`;
console.log('✅ products index created');

await sql`
INSERT INTO products (slug, title, subtitle, description, category, image_url, image_urls, sizes, related_slugs) VALUES
(
  'memory-cards', 'Memory Cards', 'A Place to Share Precious Memories',
  'Our memorial cards offer guests an opportunity to leave personal messages, treasured memories, or words of comfort for the family. These keepsakes become a beautiful collection of stories to look back on in the days ahead. They can also be sent prior to the service to share news of a loved one’s passing and provide thoughtful details about the ceremony.',
  'funeral', '/images/products/memory-cards.jpg', NULL,
  '[{"label":"Standard","dimensions":"A6 (148 mm × 105 mm)"}]',
  ARRAY['thank-you-card','attendance-cards']
),
(
  'thank-you-card', 'Thank You Card', 'A Heartfelt Way to Say Thank You',
  'Our Thank You cards offer a meaningful way to express your gratitude to those who have supported you during a difficult time. These cards allow you to share your appreciation for the comfort, kindness, and presence of friends and family. They serve as a heartfelt reminder of the compassion shown and can be sent after the service to acknowledge and thank those who stood by you.',
  'funeral', '/images/products/thank-you-card.jpg', NULL,
  '[{"label":"Standard","dimensions":"A6 (105 mm × 148 mm)"}]',
  ARRAY['memory-cards','bookmarks']
),
(
  'memorial-boards', 'Memorial Boards', 'Celebrate a Life Through a Beautifully Crafted Memory Board',
  'A memory board is a heartfelt way to share the story of someone special. Whether displayed at a ceremony, wake, or celebration of life, it becomes a touching focal point — a place where memories come alive. Printed on premium rigid foam board, our memory boards are lightweight yet durable, perfect for displaying free-standing or on an elegant easel. Please allow an additional day for production and delivery to ensure every detail is perfect.',
  'funeral', '/images/products/memorial-boards.jpg', NULL,
  '[{"label":"A1","dimensions":"594 × 841 mm"},{"label":"A2","dimensions":"420 × 594 mm"},{"label":"A3","dimensions":"297 × 420 mm"}]',
  ARRAY['photo-prints','memorial-portraits','memory-boxes']
),
(
  'memory-boxes', 'Memory Boxes', 'A Beautiful Place to Store Treasured Keepsakes',
  'Memory Boxes provide a beautiful and secure place to store treasured keepsakes, photographs, cards, and meaningful mementos in memory of a loved one. Crafted using premium-quality materials, each box features a magnetic closure for safe and elegant storage while creating a lasting tribute that can be cherished for years to come. Choose from a range of standard designs or create a completely personalised memory box with your own photographs, colours, and wording.',
  'funeral', '/images/products/Memory-Box.png', NULL,
  '[{"label":"Large","dimensions":"300 × 310 × 70 mm"},{"label":"Medium","dimensions":"245 × 300 × 70 mm"},{"label":"Small","dimensions":"219 × 223 × 70 mm"}]',
  ARRAY['memorial-boards','photo-prints']
),
(
  'seed-cards', 'Seed Cards', 'A Living Tribute',
  'Our Memorial Seed Cards offer a heartfelt way to honour a loved one, creating a tribute that grows and blossoms over time. Each card includes a seed packet attached to the reverse — easily removed without harming the beautifully laminated card. Choose from three meaningful flower varieties.',
  'funeral', '/images/products/seed-cards.jpg', NULL,
  '[{"label":"Standard","dimensions":"82 mm × 112 mm"}]',
  ARRAY['bookmarks','memory-cards']
),
(
  'attendance-cards', 'Attendance Cards', 'A Record of Love and Support',
  'Our attendance cards provide a simple yet meaningful way for families to know who came to honour their loved one. Guests can sign their names or share a few heartfelt words, creating a lasting record of those who gathered in remembrance. These cards can also be sent in advance, notifying friends and family of the service and inviting them to attend.',
  'funeral', '/images/products/attendance-cards.jpg', NULL,
  '[{"label":"Standard","dimensions":"148 mm × 105 mm"}]',
  ARRAY['memory-cards','thank-you-card']
),
(
  'photo-prints', 'Photo Prints', 'Print Your Cherished Photo in the Perfect Size',
  'If you already have a special frame you’d like to use at the funeral service or wake, we can provide beautifully printed photos to fit perfectly. To achieve the best results, we recommend providing a high-quality image — the larger the print, the clearer and more striking your photograph will appear.',
  'funeral', '/images/products/photo-prints.jpg', NULL,
  '[{"label":"A4","dimensions":"210 × 297 mm"},{"label":"A5","dimensions":"148 × 210 mm"},{"label":"10 × 8\\"","dimensions":"254 × 203 mm"}]',
  ARRAY['memorial-portraits','memorial-boards','memory-boxes']
),
(
  'bookmarks', 'Bookmarks', 'A Keepsake for Quiet Moments',
  'These elegant bookmarks are a timeless and thoughtful keepsake to honour and remember a loved one. Every time you open a book, their memory is there — gently accompanying you through stories, quiet moments, and reflections. More than just a marker between pages, it’s a symbol of enduring love, comfort, and connection. Small in size, yet big in meaning, this keepsake helps you feel close to those you hold dear, every day.',
  'funeral', '/images/products/bookmarks.jpg', NULL,
  '[{"label":"Standard","dimensions":"50 mm × 200 mm"}]',
  ARRAY['seed-cards','memory-cards']
),
(
  'memorial-portraits', 'Memorial Portraits', 'Beautiful Memorial Portraits to Treasure Forever',
  'Honour the memory of your loved one with high-quality portraits designed to look beautiful during the ceremony — and continue to be cherished for years to come. Each style is carefully selected for exceptional quality at an affordable price.',
  'funeral', '/images/products/classic Memorial Portraits.jpg.jpeg',
  '["/images/products/classic Memorial Portraits.jpg.jpeg","/images/products/contempory Memorial Portraits2.jpg.jpeg","/images/products/Reflection Memorial Portraits3.jpg.jpeg","/images/products/Traditional Memorial Portraits4.jpg.jpeg"]',
  '[{"label":"The Classic","dimensions":"229 × 305 mm","description":"A timeless A4 portrait mounted in durable, drop-resistant tempered glass with its own stand. Perfect for display on a shelf, desk, or wall."},{"label":"The Contemporary","dimensions":"305 × 305 × 38 mm or 305 × 406 × 38 mm","description":"A lightweight, premium canvas print stretched over a sturdy frame and fitted with hanging eyes. Optional black wooden float frame available."},{"label":"The Reflection","dimensions":"279 × 103 × 19 mm or 152 × 203 × 19 mm","description":"A sleek and versatile acrylic block that displays photos and messages with clarity. Easily reusable with simple photo transfer."},{"label":"The Traditional","dimensions":"458 × 599 mm","description":"A large A3 print in a two-tone frame with a contrasting mount. Supplied with both a stand and hooks for portrait or landscape orientation."}]',
  ARRAY['photo-prints','memorial-boards']
)
ON CONFLICT (slug) DO UPDATE
SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  image_urls = EXCLUDED.image_urls,
  sizes = EXCLUDED.sizes,
  related_slugs = EXCLUDED.related_slugs
`;
console.log('✅ 9 products seeded');

const rows = await sql`SELECT slug, category FROM products ORDER BY slug`;
console.log(`✅ products table now has ${rows.length} rows:`, rows.map((r) => r.slug).join(', '));
