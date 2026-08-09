import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import { getBlogPosts, getBlogPostBySlug } from '@/lib/db';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'This article could not be found.',
    };
  }

  const title = post.title;
  const description = post.excerpt ?? `Read "${post.title}" on the Memories in Prints journal.`;
  const url = `https://memoriesinprints.com/blog/${post.slug}`;
  const image = post.image_url ?? '/og-image.jpg';

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: 'Memories in Prints',
      locale: 'en_GB',
      publishedTime: post.published_at,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}


// Custom editorial content for each blog post slug
const blogContents: Record<
  string,
  {
    pullQuote: string;
    sections: { heading: string; paragraphs: string[] }[];
  }
> = {
  'choosing-paper-stock-wedding': {
    pullQuote: 'The texture of your stationery is the very first physical connection your guests make with your wedding day.',
    sections: [
      {
        heading: 'The Weight and Feel of Fine Paper',
        paragraphs: [
          'When designing wedding suites, paper stock is not merely a surface for ink — it is a foundational design decision. A heavier stock instantly conveys quality and gravity. We recommend using at least 300gsm (grams per square metre) for invite inserts, and going up to 600gsm for the primary invite card to achieve a truly premium feel.',
          'Textured linen and cotton rag are two of the most popular high-end papers. Cotton rag has soft deckled edges and a natural texture, making it perfect for letterpress and foil printing. Linen, with its cross-hatch texture, provides a crisp, elegant surface that holds detailed graphic designs perfectly.',
        ],
      },
      {
        heading: 'Finishes and Special Details',
        paragraphs: [
          'Vellum (translucent paper) can be used as an overlay to add layers and mystery to your suite. Foil stamping (in gold, copper, or silver) adds a reflective finish that catches the light beautifully. If you choose letterpress, the design is literally pressed into thick cotton paper, creating a three-dimensional tactile effect.',
          'Always request a paper sample kit before finalising your print orders. Feeling the thickness, flex, and grain of the card under your fingers will clarify your design decisions immediately.',
        ],
      },
    ],
  },
  'what-to-include-order-of-service': {
    pullQuote: 'A funeral booklet is both a practical guide for the ceremony and a lasting keepsake that families hold onto for decades.',
    sections: [
      {
        heading: 'Structuring the Ceremony Booklet',
        paragraphs: [
          'Designing an order of service booklet requires balance. It must contain all essential text for readings and hymns while keeping a clean, unhurried typographic rhythm. The standard format is a 4-page or 8-page booklet printed on heavy uncoated paper, which gives a warm, tactile feel.',
          'The front cover should be minimal: a central photo, full name, dates, and a quiet subtitle (e.g., &ldquo;A Celebration of Life&rdquo;). Inside pages contain the schedule of the service, names of readers, complete hymn lyrics, and any musical selections.',
        ],
      },
      {
        heading: 'Adding Personal Details',
        paragraphs: [
          'The back cover is typically reserved for a final photo, expressions of thanks from the family, and details regarding donations or reception gatherings. We recommend keeping the text spacious and placing photos on dedicated pages or alongside short quotes to maintain a calm, uncrowded layout.',
          'Our studio coordinates directly with celebrants and funeral directors to review all text and formatting before printing, ensuring complete precision during a difficult time.',
        ],
      },
    ],
  },
  'sports-club-matchday-programme': {
    pullQuote: 'A physical programme connects your supporters to the history of the club, creating a tangible record of every season.',
    sections: [
      {
        heading: 'More Than a Team Sheet',
        paragraphs: [
          'In a digital-first sports environment, a printed matchday programme remains a key ritual for supporters. It is a collectible item that documents a club’s timeline, features sponsor logos, and displays team sheets. A clean layout and bold typography make the programme look professional at any competitive level.',
          'For clubs, the programme is also a valuable commercial asset. Sponsors want their brands featured on high-quality print that supporters take home and display, rather than a fleeting banner ad on a website.',
        ],
      },
      {
        heading: 'Content and Layout Strategy',
        paragraphs: [
          'We recommend structuring your programme with fixed, templated sections: manager notes, team lists, match reports, and sponsor pages. This makes it fast to update squad names and fixtures for each game. Using a robust sans-serif font for stats and a serif font for editorial pieces creates a sharp, premium sports aesthetic.',
          'Whether you print 50 copies or 5,000, consistent design and finishing will show your club’s pride and professionalism.',
        ],
      },
    ],
  },
  'inside-studio-rush-orders': {
    pullQuote: 'When a memorial service is scheduled, print schedules are measured in hours, not weeks. Our workflow is designed to accommodate this urgency.',
    sections: [
      {
        heading: 'Our Expedited Design and Print Pipeline',
        paragraphs: [
          'Standard design workflows usually take days or weeks. However, memorial printing requires immediate turnarounds. To support grieving families, we prioritize these briefs and deliver first digital proofs within 12–24 hours of receiving text and photos.',
          'We maintain dedicated production slots with our printing partners and use express tracked shipping. This ensures that booklets arrive directly at the family home or funeral home in time for the service.',
        ],
      },
      {
        heading: 'How to Prepare Files Under Tight Timelines',
        paragraphs: [
          'To help us speed up your order, send us all texts and high-resolution images together. We will check the photos, clean up any backgrounds if requested, and handle the typography. Once you give your final email approval, files are immediately sent to the press.',
          'Having a single contact person in the family or wedding planning team to review proofs ensures quick decisions and minimizes delays.',
        ],
      },
    ],
  },
  'brief-to-delivery-wedding-project': {
    pullQuote: 'Coordinating every invitation detail — from envelopes to menus — creates a unified aesthetic that frames the event.',
    sections: [
      {
        heading: 'The Initial Consult and Concept Stage',
        paragraphs: [
          'We recently completed a custom wedding suite project that shows our design workflow. The couple wanted a minimal layout with organic details, reflecting their outdoor venue in Bath, UK. We started by discussing paper textures, choosing a soft cotton rag stock with gold foil details.',
          'The first design concept focused on typography. We paired a clean sans-serif font for details with a hand-selected italic serif accent for the names. This mixed font style became the signature of the entire event suite.',
        ],
      },
      {
        heading: 'Coordination and final Production',
        paragraphs: [
          'After refining the invitation, we adapted the design for welcome signage, table plans, and menus. This consistency made the reception look beautifully coordinated. We managed the entire pre-flight checking, printing, and shipping process, delivering the suite direct to the venue.',
          'Taking time to coordinate colors, envelope liners, and paper weights creates a premium experience that guests notice immediately.',
        ],
      },
    ],
  },
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const content = blogContents[slug] || {
    pullQuote: post.excerpt,
    sections: [
      {
        heading: 'Design Considerations',
        paragraphs: [
          post.excerpt,
          'Our studio approaches every print project with careful preparation, selecting premium paper stocks and maintaining high typographical standards. Whether designing wedding invitations or branding club programmes, we ensure the final printed work represents your vision exactly.',
        ],
      },
    ],
  };

  return (
    <article className="bg-bg-primary min-h-screen pt-28 pb-24 md:pb-36">
      <div className="container-wide max-w-4xl">
        <SectionReveal>
          {/* Back link */}
          <div className="mb-12">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-body text-label uppercase tracking-widest text-accent-gold link-underline font-medium"
            >
              &larr; Back to Journal
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-12 border-b border-border pb-12">
            <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
              {post.category}
            </span>
            <h1 className="mt-4 font-display text-display-lg text-text-primary leading-tight">
              {post.title}
            </h1>
            <div className="mt-6 flex items-center gap-4 text-sm text-text-muted font-mono">
              <span>By Memories in Prints</span>
              <span>•</span>
              <time dateTime={post.published_at || undefined}>{post.published_at}</time>
            </div>
          </header>

          {/* Image placeholder */}
          <div className="relative aspect-[16/9] w-full border border-border overflow-hidden mb-12 bg-bg-secondary">
            <div className="absolute inset-0 bg-gradient-to-tr from-accent-gold/20 via-bg-surface to-accent-blush/20" />
            <div className="absolute inset-0 bg-bg-primary/25" />
          </div>

          {/* Editorial Content */}
          <div className="max-w-3xl mx-auto">
            {/* Intro paragraph */}
            <p className="font-body text-body-lg text-text-primary leading-relaxed mb-8 font-medium">
              {post.excerpt}
            </p>

            {/* Pull Quote */}
            <blockquote className="border-l border-accent-gold pl-6 my-12 italic font-display text-2xl text-accent-gold leading-relaxed">
              &ldquo;{content.pullQuote}&rdquo;
            </blockquote>

            {/* Sections */}
            <div className="space-y-12">
              {content.sections.map((section) => (
                <div key={section.heading}>
                  <h2 className="font-display text-3xl text-text-primary mb-6">
                    {section.heading}
                  </h2>
                  <div className="space-y-6 font-body text-body-lg text-text-muted leading-relaxed">
                    {section.paragraphs.map((p, idx) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="mt-16 pt-8 border-t border-border flex flex-wrap gap-6 justify-between items-center">
              <div>
                <span className="block font-mono text-xs text-text-muted uppercase tracking-wider">
                  Category
                </span>
                <span className="font-body text-body-base text-text-primary">
                  {post.category}
                </span>
              </div>
              <Button variant="ghost" size="md" href="/contact">
                Enquire about custom print
              </Button>
            </div>
          </div>
        </SectionReveal>
      </div>
    </article>
  );
}
