import type { ProductData, Testimonial, ProcessStep } from '@/types/database';

// ─── PRODUCT DATA ────────────────────────────────────────────────────────────

export const products: ProductData[] = [
  {
    slug: 'memory-cards',
    title: 'Memory Cards',
    subtitle: 'A Place to Share Precious Memories',
    description: 'Our memorial cards offer guests an opportunity to leave personal messages, treasured memories, or words of comfort for the family. These keepsakes become a beautiful collection of stories to look back on in the days ahead. They can also be sent prior to the service to share news of a loved one’s passing and provide thoughtful details about the ceremony.',
    category: 'funeral',
    image: '/images/products/memory-cards.jpg',
    sizes: [{ label: 'Standard', dimensions: 'A6 (148 mm × 105 mm)' }],
    relatedSlugs: ['thank-you-card', 'attendance-cards'],
  },
  {
    slug: 'thank-you-card',
    title: 'Thank You Card',
    subtitle: 'A Heartfelt Way to Say Thank You',
    description: 'Our Thank You cards offer a meaningful way to express your gratitude to those who have supported you during a difficult time. These cards allow you to share your appreciation for the comfort, kindness, and presence of friends and family. They serve as a heartfelt reminder of the compassion shown and can be sent after the service to acknowledge and thank those who stood by you.',
    category: 'funeral',
    image: '/images/products/thank-you-card.jpg',
    sizes: [{ label: 'Standard', dimensions: 'A6 (105 mm × 148 mm)' }],
    relatedSlugs: ['memory-cards', 'bookmarks'],
  },
  {
    slug: 'memorial-boards',
    title: 'Memorial Boards',
    subtitle: 'Celebrate a Life Through a Beautifully Crafted Memory Board',
    description: 'A memory board is a heartfelt way to share the story of someone special. Whether displayed at a ceremony, wake, or celebration of life, it becomes a touching focal point — a place where memories come alive. Printed on premium rigid foam board, our memory boards are lightweight yet durable, perfect for displaying free-standing or on an elegant easel. Please allow an additional day for production and delivery to ensure every detail is perfect.',
    category: 'funeral',
    image: '/images/products/memorial-boards.jpg',
    sizes: [
      { label: 'A1', dimensions: '594 × 841 mm' },
      { label: 'A2', dimensions: '420 × 594 mm' },
      { label: 'A3', dimensions: '297 × 420 mm' },
    ],
    relatedSlugs: ['photo-prints', 'memorial-portraits', 'memory-boxes'],
  },
  {
    slug: 'memory-boxes',
    title: 'Memory Boxes',
    subtitle: 'A Beautiful Place to Store Treasured Keepsakes',
    description: 'Memory Boxes provide a beautiful and secure place to store treasured keepsakes, photographs, cards, and meaningful mementos in memory of a loved one. Crafted using premium-quality materials, each box features a magnetic closure for safe and elegant storage while creating a lasting tribute that can be cherished for years to come. Choose from a range of standard designs or create a completely personalised memory box with your own photographs, colours, and wording.',
    category: 'funeral',
    image: '/images/products/Memory-Box.png',
    sizes: [
      { label: 'Large', dimensions: '300 × 310 × 70 mm' },
      { label: 'Medium', dimensions: '245 × 300 × 70 mm' },
      { label: 'Small', dimensions: '219 × 223 × 70 mm' },
    ],
    relatedSlugs: ['memorial-boards', 'photo-prints'],
  },
  {
    slug: 'seed-cards',
    title: 'Seed Cards',
    subtitle: 'A Living Tribute',
    description: 'Our Memorial Seed Cards offer a heartfelt way to honour a loved one, creating a tribute that grows and blossoms over time. Each card includes a seed packet attached to the reverse — easily removed without harming the beautifully laminated card. Choose from three meaningful flower varieties.',
    category: 'funeral',
    image: '/images/products/seed-cards.jpg',
    sizes: [{ label: 'Standard', dimensions: '82 mm × 112 mm' }],
    relatedSlugs: ['bookmarks', 'memory-cards'],
  },
  {
    slug: 'attendance-cards',
    title: 'Attendance Cards',
    subtitle: 'A Record of Love and Support',
    description: 'Our attendance cards provide a simple yet meaningful way for families to know who came to honour their loved one. Guests can sign their names or share a few heartfelt words, creating a lasting record of those who gathered in remembrance. These cards can also be sent in advance, notifying friends and family of the service and inviting them to attend.',
    category: 'funeral',
    image: '/images/products/attendance-cards.jpg',
    sizes: [{ label: 'Standard', dimensions: '148 mm × 105 mm' }],
    relatedSlugs: ['memory-cards', 'thank-you-card'],
  },
  {
    slug: 'photo-prints',
    title: 'Photo Prints',
    subtitle: 'Print Your Cherished Photo in the Perfect Size',
    description: 'If you already have a special frame you’d like to use at the funeral service or wake, we can provide beautifully printed photos to fit perfectly. To achieve the best results, we recommend providing a high-quality image — the larger the print, the clearer and more striking your photograph will appear.',
    category: 'funeral',
    image: '/images/products/photo-prints.jpg',
    sizes: [
      { label: 'A4', dimensions: '210 × 297 mm' },
      { label: 'A5', dimensions: '148 × 210 mm' },
      { label: '10 × 8"', dimensions: '254 × 203 mm' },
    ],
    relatedSlugs: ['memorial-portraits', 'memorial-boards', 'memory-boxes'],
  },
  {
    slug: 'bookmarks',
    title: 'Bookmarks',
    subtitle: 'A Keepsake for Quiet Moments',
    description: 'These elegant bookmarks are a timeless and thoughtful keepsake to honour and remember a loved one. Every time you open a book, their memory is there — gently accompanying you through stories, quiet moments, and reflections. More than just a marker between pages, it’s a symbol of enduring love, comfort, and connection. Small in size, yet big in meaning, this keepsake helps you feel close to those you hold dear, every day.',
    category: 'funeral',
    image: '/images/products/bookmarks.jpg',
    sizes: [{ label: 'Standard', dimensions: '50 mm × 200 mm' }],
    relatedSlugs: ['seed-cards', 'memory-cards'],
  },
  {
    slug: 'memorial-portraits',
    title: 'Memorial Portraits',
    subtitle: 'Beautiful Memorial Portraits to Treasure Forever',
    description: 'Honour the memory of your loved one with high-quality portraits designed to look beautiful during the ceremony — and continue to be cherished for years to come. Each style is carefully selected for exceptional quality at an affordable price.',
    category: 'funeral',
    image: '/images/products/classic Memorial Portraits.jpg.jpeg',
    // One photo per style below, in the same order — The Classic, The Contemporary, The Reflection, The Traditional.
    image_urls: [
      '/images/products/classic Memorial Portraits.jpg.jpeg',
      '/images/products/contempory Memorial Portraits2.jpg.jpeg',
      '/images/products/Reflection Memorial Portraits3.jpg.jpeg',
      '/images/products/Traditional Memorial Portraits4.jpg.jpeg',
    ],
    sizes: [
      { label: 'The Classic', dimensions: '229 × 305 mm', description: 'A timeless A4 portrait mounted in durable, drop-resistant tempered glass with its own stand. Perfect for display on a shelf, desk, or wall.' },
      { label: 'The Contemporary', dimensions: '305 × 305 × 38 mm or 305 × 406 × 38 mm', description: 'A lightweight, premium canvas print stretched over a sturdy frame and fitted with hanging eyes. Optional black wooden float frame available.' },
      { label: 'The Reflection', dimensions: '279 × 103 × 19 mm or 152 × 203 × 19 mm', description: 'A sleek and versatile acrylic block that displays photos and messages with clarity. Easily reusable with simple photo transfer.' },
      { label: 'The Traditional', dimensions: '458 × 599 mm', description: 'A large A3 print in a two-tone frame with a contrasting mount. Supplied with both a stand and hooks for portrait or landscape orientation.' },
    ],
    relatedSlugs: ['photo-prints', 'memorial-boards'],
  },
];


// ─── TESTIMONIALS ────────────────────────────────────────────────────────────

export const testimonials: Testimonial[] = [
  {
    quote: 'Absolutely stunning designs. The team was very helpful in guiding me through the process.',
    name: 'David Smith',
    location: 'London, UK',
  },
  {
    quote: 'I found the perfect tribute for my father. The quality exceeded my expectations.',
    name: 'Emily Davis',
    location: 'Dallas, TX',
  },
  {
    quote: 'TProfessional, beautiful, and compassionate service. Highly recommend',
    name: 'Amelia brown',
    location: 'Melbourne, Australia',
  },
  {
    quote: 'Very smooth process and such heartfelt designs. I am truly grateful.',
    name: 'Jame Lee',
    location: 'London, UK',
  },
  {
    quote: 'The templates were beautiful and easy to customize. It made a difficult time much more comforting.',
    name: 'Sarah Johnson',
    location: 'Edinburgh, UK',
  },
];

// ─── PROCESS STEPS ───────────────────────────────────────────────────────────

export const processSteps: ProcessStep[] = [
  {
    number: 1,
    title: 'Enquire',
    description: 'Fill in the quote form with your project details. Tell us what you need, when you need it, and any style preferences. We respond within 24 hours — usually much sooner.',
    timeframe: 'Day 1',
  },
  {
    number: 2,
    title: 'Brief',
    description: 'We confirm your requirements, timeline, and style direction. If helpful, we arrange a short call to discuss the finer details. No commitment required at this stage.',
    timeframe: 'Day 1–2',
  },
  {
    number: 3,
    title: 'Design',
    description: 'Your first proof is delivered as a high-resolution PDF. We walk you through the design choices and welcome your feedback. Revisions are included as standard.',
    timeframe: 'Day  2-3',
  },
  {
    number: 4,
    title: 'Approve',
    description: 'Once you are happy, sign off the final proof. We run a pre-flight check on every file before it goes to print — nothing leaves the studio without a final review.',
    timeframe: 'Day 3-4',
  },
  {
    number: 5,
    title: 'Deliver',
    description: 'Printed items ship tracked worldwide. Digital files are sent directly via email. You receive a confirmation with tracking details and an estimated arrival date.',
    timeframe: 'Day 4-6',
  },
];

// ─── PORTFOLIO ITEMS (placeholder data) ──────────────────────────────────────

export const portfolioItems = [
  { id: '1', title: 'Amara & James Wedding Suite', category: 'wedding' as const, filters: { style: ['minimal', 'classic'], colour: ['gold', 'neutral'], format: ['invitation'] }, description: 'Full invitation suite with foil-stamped details and custom envelope liner.', location: 'London, UK' },
  { id: '2', title: 'Celebrating Margaret', category: 'funeral' as const, filters: { style: ['warm', 'floral'], passion: ['family'], format: ['order of service'] }, description: 'A 12-page order of service with hand-selected photography and hymn sheets.', location: 'Bath, UK' },
  { id: '3', title: 'Riverside FC Season Programme', category: 'sports' as const, filters: { style: ['bold', 'editorial'], passion: ['team', 'club'], colour: ['blue'], format: ['programme'] }, description: 'Matchday programme series with sponsor integration and squad profiles.', location: 'Manchester, UK' },
  { id: '4', title: 'Bloom Botanicals Brand Identity', category: 'branding' as const, filters: { style: ['minimal', 'botanical'], passion: ['business'], colour: ['green'], format: ['branding'] }, description: 'Logo, colour system, and stationery suite for an independent florist.', location: 'Portland, OR' },
  { id: '5', title: 'Sophie & Raj Engagement Party', category: 'events' as const, filters: { style: ['illustrated', 'joyful'], passion: ['couple'], format: ['invitation'], religion: ['multicultural'] }, description: 'Invitation set with bilingual copy and custom illustrated motifs.', location: 'Birmingham, UK' },
  { id: '6', title: 'In Memory of Thomas Reid', category: 'funeral' as const, filters: { style: ['classic', 'photographic'], passion: ['family'], format: ['memory book', 'keepsake'] }, description: 'Memorial cards and memory book with archival photography.', location: 'Dublin, Ireland' },
  { id: '7', title: 'Hawkfield Athletics Club', category: 'sports' as const, filters: { style: ['bold', 'modern'], passion: ['team', 'club'], colour: ['green'], format: ['branding', 'signage'] }, description: 'Complete rebrand including badge, kit templates, and event signage.', location: 'Melbourne, Australia' },
  { id: '8', title: 'Clara & Daniel Save-the-Dates', category: 'wedding' as const, filters: { style: ['minimal', 'classic'], colour: ['neutral'], format: ['save the date'] }, description: 'Letterpress save-the-date cards on cotton rag stock.', location: 'New York, NY' },
  { id: '9', title: 'Oakwood Coffee Roasters', category: 'branding' as const, filters: { style: ['craft', 'minimal'], passion: ['business'], colour: ['brown'], format: ['packaging'] }, description: 'Packaging design, labels, and café menu system.', location: 'Copenhagen, Denmark' },
  { id: '10', title: 'Summer Gala Invitations', category: 'events' as const, filters: { style: ['luxury', 'classic'], colour: ['gold'], format: ['invitation'] }, description: 'Gold-foiled invitations with reply cards and information inserts.', location: 'Dallas, TX' },
  { id: '11', title: 'Remembering Anita Patel', category: 'funeral' as const, filters: { style: ['warm', 'family'], audience: ['family'], religion: ['hindu'], format: ['memorial card', 'booklet'] }, description: 'A celebration of life booklet with family photos and personal tributes.', location: 'Mumbai, India' },
  { id: '12', title: 'Peninsula Rugby Sponsor Pack', category: 'sports' as const, filters: { style: ['bold', 'corporate'], audience: ['team', 'club'], format: ['sponsor pack'] }, description: 'Sponsor proposal deck with ROI metrics and partnership tiers.', location: 'Sydney, Australia' },
];

// ─── BLOG POSTS (placeholder data) ──────────────────────────────────────────

export const blogPosts = [
  {
    id: '1',
    title: 'Choosing Paper Stock for Your Wedding Stationery',
    slug: 'choosing-paper-stock-wedding',
    excerpt: 'From cotton rag to textured linen — a guide to the stocks that make your invitations unforgettable.',
    category: 'Wedding Guides',
    published_at: '2026-05-20',
    image_url: '/images/blog/paper-stock.jpg',
  },
  {
    id: '2',
    title: 'What to Include in a Funeral Order of Service',
    slug: 'what-to-include-order-of-service',
    excerpt: 'A practical guide for families and funeral directors planning the printed ceremony booklet.',
    category: 'Funeral Advice',
    published_at: '2026-05-14',
    image_url: '/images/blog/order-of-service.jpg',
  },
  {
    id: '3',
    title: 'Why Every Sports Club Needs a Matchday Programme',
    slug: 'sports-club-matchday-programme',
    excerpt: 'More than a teamsheet — how programmes build community, attract sponsors, and tell your club story.',
    category: 'Design Tips',
    published_at: '2026-05-07',
    image_url: '/images/blog/matchday-programme.jpg',
  },
  {
    id: '4',
    title: 'Inside the Studio: How We Handle Rush Orders',
    slug: 'inside-studio-rush-orders',
    excerpt: 'Behind the scenes of our 24-hour turnaround process for time-sensitive memorial print.',
    category: 'Studio News',
    published_at: '2026-04-28',
    image_url: '/images/blog/rush-orders.jpg',
  },
  {
    id: '5',
    title: 'From Brief to Delivery: A Real Wedding Project',
    slug: 'brief-to-delivery-wedding-project',
    excerpt: 'Following one couple\'s full stationery journey from initial enquiry to the big day.',
    category: 'Client Stories',
    published_at: '2026-04-15',
    image_url: '/images/blog/client-story.jpg',
  },
];

// ─── FAQ DATA ────────────────────────────────────────────────────────────────

export const pricingFaqs = [
  { question: 'Are prices listed inclusive of VAT?', answer: 'All prices shown exclude VAT. VAT is added at the applicable rate for UK clients. International orders are zero-rated for VAT purposes.' },
  { question: 'Is shipping included in the price?', answer: 'Shipping is calculated separately at quote stage based on destination, weight, and your preferred delivery speed. We always provide the full cost upfront.' },
  { question: 'Can I get an exact quote before committing?', answer: 'Absolutely. Every enquiry receives a detailed, no-obligation quote within 24 hours. We break down costs so you know exactly what you are paying for.' },
  { question: 'Do you offer discounts for bulk orders?', answer: 'Yes. Volume pricing is available for larger print runs. The more you order, the lower the per-unit cost. Ask us for a bulk quote.' },
  { question: 'What payment methods do you accept?', answer: 'We accept bank transfer, credit/debit card, and PayPal. Payment terms are typically 50% deposit upfront, with the balance due on approval.' },
  { question: 'What is your refund policy?', answer: 'If you are not satisfied with the quality of the final printed product, we will reprint at no additional cost. Design fees for completed work are non-refundable.' },
];
