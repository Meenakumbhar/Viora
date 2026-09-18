import Link from 'next/link';
import Image from 'next/image';
import HeroScrollEffect from '@/components/ui/HeroScrollEffect';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';
import TestimonialSlider from '@/components/ui/TestimonialSlider';
import AnimatedHeadline from '@/components/ui/AnimatedHeadline';
import ImageRevealCard from '@/components/ui/ImageRevealCard';
import { ACTIVE_CATEGORIES } from '@/lib/active-services';
import { getPortfolioItems, getBlogPosts } from '@/lib/db';
import type { PortfolioItem } from '@/types/database';

// Real studio work for "Our Popular Designs" — pulled live from the
// portfolio so the homepage always reflects what's actually been made, never
// seed/placeholder data. Interleaved across active categories (rather than
// one big recency-sorted pull) so the mix doesn't get swamped by whichever
// category has more items.
async function getHomepagePortfolioData() {
  const perCategory = await Promise.all(
    ACTIVE_CATEGORIES.map((category) => getPortfolioItems(category))
  );
  const maxLen = Math.max(0, ...perCategory.map((items) => items.length));

  const featured: PortfolioItem[] = [];
  for (let i = 0; i < maxLen && featured.length < 3; i++) {
    for (const items of perCategory) {
      const item = items[i];
      if (!item) continue;
      if (featured.length < 3) featured.push(item);
    }
  }

  return { featured };
}

/* ───────────────────────────────────────────────────────────────────────────
   Portfolio gradient map — light, category-specific pastels (fallback while
   an image loads, or if a portfolio item has none)
   ─────────────────────────────────────────────────────────────────────────── */
const portfolioGradients: Record<string, string> = {
  wedding:
    'linear-gradient(160deg, #FDF7F5 0%, #F5E6DF 40%, #E8D5C4 80%, #C4958F 100%)',
  funeral:
    'linear-gradient(160deg, #FBF7EE 0%, #F7EFDA 40%, #F3E7C9 80%, #E5CB90 100%)',
  sports:
    'linear-gradient(160deg, #F4FAF0 0%, #E2F0DB 40%, #C2DCBB 80%, #7D9B76 100%)',
  branding:
    'linear-gradient(160deg, #F4F7FD 0%, #E0E8F8 40%, #C2D4EE 80%, #2D5FA8 100%)',
  events:
    'linear-gradient(160deg, #FDFAF5 0%, #F8EDDA 40%, #F5DFB8 80%, #D4883A 100%)',
};

/* ───────────────────────────────────────────────────────────────────────────
   Blog card gradient map — lighter warm tones
   ─────────────────────────────────────────────────────────────────────────── */
const blogGradients: Record<string, string> = {
  'Wedding Guides':
    'linear-gradient(135deg, #FDF7F5 0%, #E8D5C4 60%, #C4958F 100%)',
  'Funeral Advice':
    'linear-gradient(135deg, #FBF7EE 0%, #F3E7C9 60%, #E5CB90 100%)',
  'Design Tips':
    'linear-gradient(135deg, #F4FAF0 0%, #C2DCBB 60%, #7D9B76 100%)',
  'Studio News':
    'linear-gradient(135deg, #FAF8F5 0%, #F7F4EF 60%, #C6A85C 100%)',
  'Client Stories':
    'linear-gradient(135deg, #F4F7FD 0%, #C2D4EE 60%, #C6A85C 100%)',
};

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE — Server Component
   Section order matches the Figma "memoriesinprints" landing design:
   Hero → Who We Are → Our Popular Designs → From the Studio →
   Heard from Our Clients → Delivery Network → Footer.
   ═══════════════════════════════════════════════════════════════════════════ */
// ISR rather than always-dynamic or fully-static: this page pulls live
// portfolio/blog data directly (not through a cached helper), so without a
// revalidate window it would be cached until the next deploy and miss admin
// edits. 60s matches the nav's product cache in app/layout.tsx.
export const revalidate = 60;

export default async function Home() {
  const { featured } = await getHomepagePortfolioData();
  const recentPosts = await getBlogPosts(3);

  return (
    <main>
      <HeroScrollEffect />
      {/* ──────────────────── SECTION 1 — HERO ──────────────────── */}
      <section
        id="hero"
        className="hero-section relative h-[96vh] min-h-[720px] max-h-[980px] overflow-hidden bg-bg-primary flex items-center pt-28 pb-16"
      >
        {/* Banner photo — starts below the fixed nav's height (h-20) plus a
            little breathing room, so the nav always sits on the section's
            plain bg-bg-primary with no photo behind it at all. */}
        <div className="absolute inset-x-0 top-24 bottom-0 z-0">
          <Image
            src="/images/Home-Banner.jpg"
            alt=""
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: '65% 30%' }}
          />

          {/* Scrim — darkens the left side where the copy sits so it reads
              clearly regardless of how bright that part of the photo is,
              fading out toward the right so the image itself stays visible. */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(100deg, rgba(10,14,20,0.55) 0%, rgba(10,14,20,0.32) 35%, rgba(10,14,20,0) 68%)' }}
          />
        </div>

        <div className="container-wide relative z-10 w-full">
          <div className="hero-content">

            <AnimatedHeadline
              text="Made for Every Moment"
              accentWord="Moment"
              className="font-display text-display-lg text-white max-w-lg mt-5 [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]"
            />

            <p className="font-body text-body-lg text-white/90 max-w-lg mt-6 [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]">
              Funerals and Weddings.
              <br />
              Beautiful design and printing for life’s important moments from funeral stationery and keepsakes to wedding invitations.
              <br />
              Created with care to reflect your story and the people who matter most.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
              <Button variant="primary" size="lg" href="/portfolio" className="w-full sm:w-auto">
                View Our Work
              </Button>
              <Button variant="ghost" size="lg" href="/contact" className="w-full sm:w-auto">
                Start a Project →
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-bounce-slow text-text-muted"
            aria-hidden="true"
          >
            <path
              d="M12 5L12 19M12 19L5 12M12 19L19 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* ──────────────────── SECTION 2 — WHO WE ARE ──────────────────── */}
      <section id="about" className="relative overflow-hidden py-10 md:py-14 lg:py-16 bg-bg-primary">
        <SectionReveal>
          <div className="container-wide">
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
              {/* Divider line — centered in the gap between the two columns */}
              <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-border lg:block" />

              {/* Left column — copy */}
              <div>
                <span
                  className="font-mono text-label uppercase text-accent-gold tracking-wider"
                  data-delay="1"
                >
                  Who We Are
                </span>

                <AnimatedHeadline
                  as="h2"
                  text="We are Here to Help You"
                  accentWord="Help"
                  className="font-display text-display-md text-text-heading mt-3"
                />

                <div data-delay="3">
                  <p className="font-body text-body-lg text-text-muted mt-4 leading-relaxed">
                    Memories in Prints is a full-service design and print studio serving a global client base.
                    We create digital and printed materials for life&rsquo;s most meaningful occasions, as well
                    as brands and organisations that shape communities.
                  </p>

                  <p className="font-body text-body-lg text-text-muted mt-4 leading-relaxed">
                    With roots in funeral print, we bring precision, sensitivity and a commitment to quality to
                    every project. From funeral stationery and weddings to events and organisations, every brief
                    receives the same level of care.
                  </p>

                  <p className="font-body text-body-lg text-text-muted mt-4 leading-relaxed">
                    We are committed to providing compassionate, comfortable and supportive services tailored to
                    your needs.
                  </p>
                </div>

                <div data-delay="4">
                  <Button variant="text" href="/about" className="mt-6">
                    Our Story →
                  </Button>
                </div>
              </div>

              {/* Right column — a single studio-made photo, stretched to
                  match the text column's exact height so there's no extra
                  gap above or below it. */}
              <div data-delay="3">
                <ImageRevealCard
                  src="/images/design_with_intention.jpeg"
                  alt="We are Here to Help You"
                  delay={0.1}
                  className="h-full min-h-[320px] rounded-[2rem]"
                  sizes="(min-width: 1024px) 45vw, 90vw"
                />
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ──────────────────── SECTION 3 — OUR POPULAR DESIGNS ──────────────────── */}
      <section id="popular-designs" className="py-16 md:py-24 lg:py-28 bg-bg-alternate border-t border-border/60">
        <SectionReveal>
          <div className="container-wide">
            <h2 className="font-display text-display-lg text-text-heading">
              Our Popular Designs
            </h2>
            <p className="font-body text-body-lg text-text-muted mt-4 max-w-2xl">
              We offer a wide range of personalised services and printed materials to help you honour, remember
              and celebrate meaningful moments.
            </p>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 md:grid-cols-3 mt-10">
              {featured.map((item) => (
                <div key={item.id} data-category={item.category} className="group">
                  <Link href={`/portfolio/${item.id}`} className="block">
                    <ImageRevealCard
                      src={item.image_url}
                      alt={item.title}
                      delay={0.1}
                      className="aspect-[3/4] w-full rounded-[1.25rem]"
                      fallbackGradient={portfolioGradients[item.category] || 'linear-gradient(160deg, #FAF8F5, #F7F4EF)'}
                      sizes="(min-width: 768px) 33vw, 50vw"
                    />

                    <span className="font-mono text-label uppercase text-cat-accent-dark block mt-4">
                      {item.category}
                    </span>
                    <h3 className="mt-1 font-display text-xl text-text-heading transition-colors duration-300 group-hover:text-accent-gold">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="mt-2 font-body text-base text-text-muted line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button variant="ghost" href="/portfolio">
                View more →
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ──────────────────── SECTION 4 — FROM THE STUDIO ────────────────────
           Pulled live from the same posts table /blog reads from, so the
           homepage never shows an article that isn't actually published —
           and the whole section is skipped rather than padded with
           placeholder cards when nothing's published yet. ──────────────── */}
      {recentPosts.length > 0 && (
      <section id="blog" className="py-16 md:py-24 lg:py-28 bg-bg-primary">
        <SectionReveal>
          <div className="container-wide">
            <h2 className="font-display text-display-lg text-text-heading">
              From the Studio
            </h2>
            <p className="font-body text-body-lg text-text-muted mt-3">
              Articles and resources to guide you with confidence
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              {recentPosts.map((post, i) => (
                <article key={post.id} data-delay={String(Math.min(i + 1, 5))}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    {/* Image placeholder */}
                    <div
                      className="aspect-video rounded-[1.5rem] overflow-hidden"
                      style={{
                        background:
                          blogGradients[post.category || ''] ||
                          'linear-gradient(135deg, #FAF8F5, #F7F4EF)',
                      }}
                    />

                    {/* Category */}
                    <span className="font-mono text-label text-accent-gold uppercase mt-4 block">
                      {post.category}
                    </span>

                    {/* Title */}
                    <h3 className="font-display text-xl text-text-heading mt-2 group-hover:text-accent-gold transition-colors duration-300">
                      {post.title}
                    </h3>

                    {/* Read more */}
                    <span className="font-body text-body-base text-accent-gold link-underline mt-3 inline-block">
                      Read more →
                    </span>
                  </Link>
                </article>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="text" href="/blog">
                All posts →
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>
      )}

      {/* ──────────────────── SECTION 5 — HEARD FROM OUR CLIENTS ──────────────────── */}
      <section
        id="testimonials"
        className="relative overflow-hidden py-16 md:py-20"
      >
        {/* Background image — swap the src to any image path you provide */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/Review_BG.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          {/* Dark overlay so text stays legible */}
          <div className="absolute inset-0 bg-black/10" />
        </div>

        <div className="relative z-10 container-wide max-w-4xl text-center">
          <h2 className="font-display text-display-lg text-accent-gold">
            Heard from Our Clients
          </h2>

          <div className="mt-8">
            <TestimonialSlider dark />
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 6 — DELIVERY NETWORK ──────────────────── */}
      <section id="global" className="py-10 md:py-14 lg:py-16 bg-bg-primary border-t border-border/60">
        <SectionReveal>
          <div className="container-wide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left — modern delivery map */}
              <div className="flex items-center justify-center" data-delay="1">
                <div className="w-full max-w-lg rounded-[2rem] bg-[#f7efe6] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.08)] md:p-6">
                  <Image
                    src="/world_map.png"
                    alt="World map showing delivery coverage"
                    width={1200}
                    height={655}
                    sizes="(min-width: 1024px) 512px, 90vw"
                    className="w-full h-auto rounded-[1.25rem] object-contain"
                  />
                </div>
              </div>

              {/* Right — copy */}
              <div data-delay="2">
                <span className="font-mono text-label uppercase text-accent-forest tracking-wider">
                  Delivery Network
                </span>

                <h2 className="font-display text-display-md text-text-heading mt-3">
                  Designed Here. Delivered Everywhere.
                </h2>

                <p className="font-body text-body-lg text-text-muted mt-4 leading-relaxed">
                  We create custom print for families, planners, brands, and clubs across North
                  America, United Kingdom, Europe. Each order
                  ships tracked, with digital delivery available for clients who print locally.
                </p>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>
    </main>
  );
}
