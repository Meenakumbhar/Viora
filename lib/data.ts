import type { ServiceData, Testimonial, ProcessStep } from '@/types/database';

// ─── SERVICE DATA ────────────────────────────────────────────────────────────

export const services: ServiceData[] = [
  {
    slug: 'wedding-events',
    title: 'Wedding &',
    titleAccent: 'Events',
    description: 'Invitations, programmes, table plans, and signage — designed with joy, delivered with precision.',
    heroImage: '/images/services/wedding-hero.jpg',
    tone: 'Joyful and precise',
    included: [
      { name: 'Wedding Invitations', description: 'Full suites with RSVP cards, details inserts, and envelope liners' },
      { name: 'Order of Service', description: 'Ceremony booklets that guide your guests through every moment' },
      { name: 'Table Plans & Numbers', description: 'Seating charts, place cards, and table numbers in your chosen style' },
      { name: 'Menus & Programmes', description: 'Reception menus, timeline cards, and event programmes' },
      { name: 'Welcome Signs', description: 'Large-format signage for entrances, bars, and photo areas' },
      { name: 'Thank You Cards', description: 'Post-event cards with your favourite photos and a personal note' },
    ],
    idealClient: 'Couples, wedding planners, and event coordinators who want print that matches the significance of the day. We work with clients who value consistency across every touchpoint — from the save-the-date to the thank-you card.',
    tiers: [
      {
        name: 'Essential',
        price: 'From £95',
        features: ['1 printed product', '1 round of revisions', 'Standard card stock', 'PDF proof delivery'],
        cta: 'Get a quote',
      },
      {
        name: 'Premium',
        price: 'From £245',
        features: ['Up to 3 printed products', '3 rounds of revisions', 'Prestige textured stock', 'Tracked worldwide delivery'],
        cta: 'Get a quote',
        highlighted: true,
      },
      {
        name: 'Bespoke',
        price: 'On request',
        features: ['Fully custom suite', 'Dedicated design brief', 'White-glove production', 'Account manager assigned'],
        cta: 'Contact us',
      },
    ],
    faqs: [
      { question: 'How far in advance should I order?', answer: 'We recommend 8–12 weeks before your event for printed items. Rush orders are available for an additional fee — get in touch and we will do our best.' },
      { question: 'Can I see a physical sample before ordering?', answer: 'Yes. We offer sample packs of our most popular paper stocks so you can feel the quality before committing. Digital proofs are always provided first.' },
      { question: 'Do you offer matching digital invitations?', answer: 'Absolutely. Every print design can be adapted for digital sharing — perfect for overseas guests or last-minute additions.' },
      { question: 'What if I need to change details after approval?', answer: 'Minor text changes before print are usually free. Significant layout changes after final approval may incur a small revision fee.' },
    ],
    relatedSlugs: ['funeral-memorial', 'graphic-design'],
  },
  {
    slug: 'funeral-memorial',
    title: 'Funeral &',
    titleAccent: 'Memorial',
    description: 'Orders of service, memory boxes, and keepsakes — handled with warmth and unhurried care.',
    heroImage: '/images/services/funeral-hero.jpg',
    tone: 'Unhurried, warm, never clinical',
    included: [
      { name: 'Order of Service', description: 'Multi-page ceremony booklets with readings, hymns, and personal tributes' },
      { name: 'Memorial Cards', description: 'Wallet-size keepsake cards with photo, dates, and a chosen verse' },
      { name: 'Memory Books', description: 'Hardcover or softcover photo books celebrating a life well lived' },
      { name: 'Thank You Cards', description: 'Post-service acknowledgement cards for family to send to attendees' },
      { name: 'Funeral Signage', description: 'Welcome boards, photo displays, and order of events signage' },
      { name: 'Keepsake Boxes', description: 'Printed memory boxes to hold letters, photos, and personal items' },
    ],
    idealClient: 'Families, funeral directors, and celebrants who want printed materials that honour a life with dignity. We understand that timelines are often short and emotions run high — we handle every detail so you do not have to.',
    tiers: [
      {
        name: 'Essential',
        price: 'From £65',
        features: ['Order of service booklet', '1 round of revisions', 'Standard card stock', 'PDF delivery within 24hrs'],
        cta: 'Get a quote',
      },
      {
        name: 'Premium',
        price: 'From £165',
        features: ['Up to 3 printed items', '3 rounds of revisions', 'Prestige uncoated stock', 'Express tracked delivery'],
        cta: 'Get a quote',
        highlighted: true,
      },
      {
        name: 'Bespoke',
        price: 'On request',
        features: ['Complete memorial suite', 'Dedicated brief call', 'Memory book included', 'Same-day turnaround available'],
        cta: 'Contact us',
      },
    ],
    faqs: [
      { question: 'How quickly can you turn this around?', answer: 'We understand the urgency. Digital proofs are typically delivered within 12–24 hours. Printed items can ship express within 48 hours of approval.' },
      { question: 'Can you work directly with our funeral director?', answer: 'Yes. We regularly liaise with funeral directors and celebrants to ensure every detail is correct and delivered on time.' },
      { question: 'What if we do not have many photos?', answer: 'No problem at all. We can create beautiful designs using minimal imagery — a single meaningful photo, or even text-only layouts with elegant typography.' },
      { question: 'Do you offer digital versions too?', answer: 'Yes. Every order of service can be delivered as a PDF for sharing with family members who cannot attend in person.' },
    ],
    relatedSlugs: ['wedding-events', 'print-production'],
  },
  {
    slug: 'sports-branding',
    title: 'Sports &',
    titleAccent: 'Branding',
    description: 'Team programmes, event print, and sponsor packs — confident, fast, and sharp.',
    heroImage: '/images/services/sports-hero.jpg',
    tone: 'Confident, fast, sharp',
    included: [
      { name: 'Matchday Programmes', description: 'Multi-page programmes with team sheets, fixtures, and sponsor features' },
      { name: 'Event Print', description: 'Banners, posters, flyers, and signage for tournaments and events' },
      { name: 'Sponsor Packs', description: 'Professional media kits and proposal documents for prospective sponsors' },
      { name: 'Team Branding', description: 'Logo design, badge development, and full brand identity systems' },
      { name: 'Merchandise Print', description: 'Printed merchandise artwork, packaging, and retail-ready assets' },
      { name: 'Digital Assets', description: 'Social media templates, email headers, and website graphics' },
    ],
    idealClient: 'Sports clubs, athletic organisations, tournament directors, and corporate teams who need professional print and branding that stands up at any level — from grassroots to elite.',
    tiers: [
      {
        name: 'Essential',
        price: 'From £120',
        features: ['1 printed product', '1 round of revisions', 'Standard stock', 'PDF delivery'],
        cta: 'Get a quote',
      },
      {
        name: 'Premium',
        price: 'From £295',
        features: ['Up to 3 products', '3 rounds of revisions', 'Premium stock options', 'Tracked delivery worldwide'],
        cta: 'Get a quote',
        highlighted: true,
      },
      {
        name: 'Bespoke',
        price: 'On request',
        features: ['Full season package', 'Dedicated account manager', 'Bulk print discounts', 'Brand guidelines included'],
        cta: 'Contact us',
      },
    ],
    faqs: [
      { question: 'Can you handle recurring matchday programmes?', answer: 'Yes. We offer season packages with templated layouts that make each edition fast and affordable. Just send us the updated content and we handle the rest.' },
      { question: 'Do you work with sponsors and their brand guidelines?', answer: 'Absolutely. We are experienced working within brand guidelines and can incorporate sponsor logos and assets professionally.' },
      { question: 'What formats do you deliver digital assets in?', answer: 'We deliver in all standard formats — PDF, PNG, SVG, JPEG — optimised for print, web, and social media respectively.' },
      { question: 'Can you design a full brand identity for our club?', answer: 'Yes. From logo and badge design through to full brand guidelines, kit mockups, and stationery — we cover the full spectrum.' },
    ],
    relatedSlugs: ['graphic-design', 'print-production'],
  },
  {
    slug: 'graphic-design',
    title: 'Graphic',
    titleAccent: 'Design',
    description: 'Logo, brand identity, digital and print assets — considered, strategic, visually ambitious.',
    heroImage: '/images/services/design-hero.jpg',
    tone: 'Considered, strategic, visually ambitious',
    included: [
      { name: 'Logo Design', description: 'Primary logo, secondary marks, and favicon — all formats included' },
      { name: 'Brand Identity', description: 'Complete visual system: colours, typography, patterns, and usage guidelines' },
      { name: 'Business Stationery', description: 'Business cards, letterheads, compliment slips, and email signatures' },
      { name: 'Marketing Materials', description: 'Brochures, flyers, posters, and presentation decks' },
      { name: 'Social Media Design', description: 'Branded templates for Instagram, LinkedIn, Facebook, and more' },
      { name: 'Packaging Design', description: 'Product packaging, labels, and unboxing experiences' },
    ],
    idealClient: 'Startups, small businesses, and established brands ready for a visual refresh. We work with founders who understand that design is not decoration — it is strategy made visible.',
    tiers: [
      {
        name: 'Essential',
        price: 'From £195',
        features: ['Logo design (3 concepts)', '2 rounds of revisions', 'Primary logo files', 'Basic colour palette'],
        cta: 'Get a quote',
      },
      {
        name: 'Premium',
        price: 'From £495',
        features: ['Full brand identity', '3 rounds of revisions', 'Brand guidelines PDF', 'Stationery suite'],
        cta: 'Get a quote',
        highlighted: true,
      },
      {
        name: 'Bespoke',
        price: 'On request',
        features: ['End-to-end brand build', 'Strategy workshop', 'All print + digital assets', 'Ongoing design retainer'],
        cta: 'Contact us',
      },
    ],
    faqs: [
      { question: 'How many logo concepts will I see?', answer: 'Our Essential package includes 3 distinct concepts. Premium and Bespoke packages include more concepts and deeper exploration of direction.' },
      { question: 'Will I own the final files?', answer: 'Yes. Full ownership of all final approved files transfers to you upon completion. We retain the right to show the work in our portfolio unless otherwise agreed.' },
      { question: 'Can you work with an existing brand?', answer: 'Of course. We regularly refresh, extend, and tighten existing brand identities without starting from scratch.' },
      { question: 'What file formats will I receive?', answer: 'You will receive all industry-standard formats: AI, EPS, SVG, PDF, PNG, and JPEG — optimised for both print and digital use.' },
    ],
    relatedSlugs: ['print-production', 'sports-branding'],
  },
  {
    slug: 'print-production',
    title: 'Print &',
    titleAccent: 'Production',
    description: 'Premium paper, global shipping, fast turnaround — precise, reliable, technical.',
    heroImage: '/images/services/print-hero.jpg',
    tone: 'Precise, reliable, technical',
    included: [
      { name: 'Digital Printing', description: 'High-quality digital print for short to medium runs — fast and cost-effective' },
      { name: 'Litho Printing', description: 'Offset lithography for large volume runs with exceptional colour consistency' },
      { name: 'Large Format', description: 'Banners, posters, signage, and exhibition displays up to billboard scale' },
      { name: 'Finishing Services', description: 'Foiling, embossing, die-cutting, lamination, and spot UV' },
      { name: 'Paper Selection', description: 'Access to over 200 paper stocks — from recycled kraft to cotton rag' },
      { name: 'Global Shipping', description: 'Tracked worldwide delivery with packaging designed to protect every order' },
    ],
    idealClient: 'Designers, agencies, and businesses who need a reliable production partner. Whether you send print-ready files or need us to prepare artwork, we deliver consistent quality every time.',
    tiers: [
      {
        name: 'Essential',
        price: 'From £45',
        features: ['Single product print', 'Standard paper stock', 'Standard delivery', '3–5 day turnaround'],
        cta: 'Get a quote',
      },
      {
        name: 'Premium',
        price: 'From £150',
        features: ['Multi-product order', 'Premium stock selection', 'Tracked worldwide delivery', '2–3 day turnaround'],
        cta: 'Get a quote',
        highlighted: true,
      },
      {
        name: 'Bespoke',
        price: 'On request',
        features: ['Bulk / recurring orders', 'Custom finishing options', 'Dedicated production slot', 'Same-day turnaround available'],
        cta: 'Contact us',
      },
    ],
    faqs: [
      { question: 'Can I send my own print-ready files?', answer: 'Absolutely. We accept print-ready PDFs in CMYK with 3mm bleed. We will run a preflight check and flag any issues before production.' },
      { question: 'What paper stocks do you offer?', answer: 'We carry over 200 stocks — including uncoated, silk, gloss, textured, recycled, and specialty options like cotton rag and translucent vellum.' },
      { question: 'Do you ship internationally?', answer: 'Yes. We deliver to over 30 countries with tracked shipping. Delivery times vary by destination but we always provide an estimate at quote stage.' },
      { question: 'What is your minimum order quantity?', answer: 'There is no minimum. We are happy to produce single copies or runs of thousands — pricing adjusts accordingly.' },
    ],
    relatedSlugs: ['graphic-design', 'funeral-memorial'],
  },
];

export function getServiceBySlug(slug: string): ServiceData | undefined {
  return services.find((s) => s.slug === slug);
}

export function getRelatedServices(slugs: string[]): ServiceData[] {
  return services.filter((s) => slugs.includes(s.slug));
}

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────

export const testimonials: Testimonial[] = [
  {
    quote: 'The order of service they produced was so beautiful. Several guests asked who made it.',
    name: 'Sarah M.',
    location: 'London, UK',
  },
  {
    quote: 'Delivered to Texas in time for the wedding. Exactly what we had in mind.',
    name: 'Jamie R.',
    location: 'Dallas, TX',
  },
  {
    quote: 'The team branding pack elevated our whole club identity overnight.',
    name: 'Marcus T.',
    location: 'Melbourne, Australia',
  },
  {
    quote: 'Working with them on our rebrand was seamless. The attention to typography alone set them apart.',
    name: 'Priya K.',
    location: 'Mumbai, India',
  },
  {
    quote: 'They handled everything with such care. During the hardest week of our lives, one less thing to worry about.',
    name: 'David & Clare H.',
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
    timeframe: 'Day 3–7',
  },
  {
    number: 4,
    title: 'Approve',
    description: 'Once you are happy, sign off the final proof. We run a pre-flight check on every file before it goes to print — nothing leaves the studio without a final review.',
    timeframe: 'Day 7–8',
  },
  {
    number: 5,
    title: 'Deliver',
    description: 'Printed items ship tracked worldwide. Digital files are sent directly via email. You receive a confirmation with tracking details and an estimated arrival date.',
    timeframe: 'Day 9–14',
  },
];

// ─── PORTFOLIO ITEMS (placeholder data) ──────────────────────────────────────

export const portfolioItems = [
  { id: '1', title: 'Amara & James Wedding Suite', category: 'wedding' as const, description: 'Full invitation suite with foil-stamped details and custom envelope liner.', location: 'London, UK' },
  { id: '2', title: 'Celebrating Margaret', category: 'funeral' as const, description: 'A 12-page order of service with hand-selected photography and hymn sheets.', location: 'Bath, UK' },
  { id: '3', title: 'Riverside FC Season Programme', category: 'sports' as const, description: 'Matchday programme series with sponsor integration and squad profiles.', location: 'Manchester, UK' },
  { id: '4', title: 'Bloom Botanicals Brand Identity', category: 'branding' as const, description: 'Logo, colour system, and stationery suite for an independent florist.', location: 'Portland, OR' },
  { id: '5', title: 'Sophie & Raj Engagement Party', category: 'events' as const, description: 'Invitation set with bilingual copy and custom illustrated motifs.', location: 'Birmingham, UK' },
  { id: '6', title: 'In Memory of Thomas Reid', category: 'funeral' as const, description: 'Memorial cards and memory book with archival photography.', location: 'Dublin, Ireland' },
  { id: '7', title: 'Hawkfield Athletics Club', category: 'sports' as const, description: 'Complete rebrand including badge, kit templates, and event signage.', location: 'Melbourne, Australia' },
  { id: '8', title: 'Clara & Daniel Save-the-Dates', category: 'wedding' as const, description: 'Letterpress save-the-date cards on cotton rag stock.', location: 'New York, NY' },
  { id: '9', title: 'Oakwood Coffee Roasters', category: 'branding' as const, description: 'Packaging design, labels, and café menu system.', location: 'Copenhagen, Denmark' },
  { id: '10', title: 'Summer Gala Invitations', category: 'events' as const, description: 'Gold-foiled invitations with reply cards and information inserts.', location: 'Dallas, TX' },
  { id: '11', title: 'Remembering Anita Patel', category: 'funeral' as const, description: 'A celebration of life booklet with family photos and personal tributes.', location: 'Mumbai, India' },
  { id: '12', title: 'Peninsula Rugby Sponsor Pack', category: 'sports' as const, description: 'Sponsor proposal deck with ROI metrics and partnership tiers.', location: 'Sydney, Australia' },
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
