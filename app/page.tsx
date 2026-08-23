import Link from 'next/link';
import Image from 'next/image';
import HeroScrollEffect from '@/components/ui/HeroScrollEffect';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';
import TestimonialSlider from '@/components/ui/TestimonialSlider';
import AnimatedHeadline from '@/components/ui/AnimatedHeadline';
import ImageRevealCard from '@/components/ui/ImageRevealCard';
import { PANEL_TONES } from '@/components/ui/SplitHero';
import { ACTIVE_CATEGORIES } from '@/lib/active-services';
import { getPortfolioItems, getBlogPosts } from '@/lib/db';
import type { PortfolioItem } from '@/types/database';

// Real studio work for the Featured Work strip — pulled live from the
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
  for (let i = 0; i < maxLen && featured.length < 8; i++) {
    for (const items of perCategory) {
      const item = items[i];
      if (!item) continue;
      if (featured.length < 8) featured.push(item);
    }
  }

  return { featured };
}


/* ───────────────────────────────────────────────────────────────────────────
   Portfolio gradient map — light, category-specific pastels
   ─────────────────────────────────────────────────────────────────────────── */
const portfolioGradients: Record<string, string> = {
  wedding:
    'linear-gradient(160deg, #FDF7F5 0%, #F5E6DF 40%, #E8D5C4 80%, #C4958F 100%)',
  funeral:
    'linear-gradient(160deg, #F8F7FD 0%, #EDEAF8 40%, #D6D3EE 80%, #8B82C4 100%)',
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
    'linear-gradient(135deg, #F8F7FD 0%, #D6D3EE 60%, #8B82C4 100%)',
  'Design Tips':
    'linear-gradient(135deg, #F4FAF0 0%, #C2DCBB 60%, #7D9B76 100%)',
  'Studio News':
    'linear-gradient(135deg, #FAF8F5 0%, #F7F4EF 60%, #C6A85C 100%)',
  'Client Stories':
    'linear-gradient(135deg, #F4F7FD 0%, #C2D4EE 60%, #C6A85C 100%)',
};

/* ═══════════════════════════════════════════════════════════════════════════
   HOME PAGE — Server Component
   ═══════════════════════════════════════════════════════════════════════════ */
export default async function Home() {
  const { featured } = await getHomepagePortfolioData();
  const recentPosts = await getBlogPosts(3);

  return (
    <main>
      <HeroScrollEffect />
      {/* ──────────────────── SECTION 1 — HERO ──────────────────── */}
      <section
        id="hero"
        className="hero-section relative h-[88vh] min-h-[680px] max-h-[880px] overflow-hidden bg-bg-primary flex items-center pt-28 pb-16"
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
            quality={90}
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
              text="Made for every moment"
              accentWord="moment"
              className="font-display text-display-lg text-white max-w-lg mt-5 [text-shadow:0_2px_16px_rgba(0,0,0,0.35)]"
            />

            <p className="font-body text-body-lg text-white/90 max-w-lg mt-6 [text-shadow:0_1px_10px_rgba(0,0,0,0.35)]">
              Funerals and Weddings.
              <br />
              Beautiful design and printing for life’s important moments from funeral stationery and keepsakes to wedding invitations.
              <br />
              Created with care to reflect your story and the people who matter most.
            </p>

            <div className="flex gap-4 mt-8">
              <Button variant="primary" size="lg" href="/portfolio">
                View Our Work
              </Button>
              <Button variant="ghost" size="lg" href="/contact">
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

      {/* ──────────────────── SECTION 2 — STUDIO INTRODUCTION ──────────────────── */}
      <section id="about" className="py-10 md:py-14 lg:py-16 bg-bg-primary">
        <SectionReveal>
          <div className="container-wide">
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
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
                  text="Designed with Intention"
                  accentWord="Intention"
                  className="font-display text-display-md text-text-heading mt-3"
                />

                <div data-delay="3">
                  <p className="font-body text-body-lg text-text-muted mt-4 leading-relaxed">
                    Memories in Prints is a full-service design and print studio serving a global client base.
                    We create digital and printed materials for life&rsquo;s most meaningful occasions,
                    as well as brands and organisations that shape communities.
                  </p>

                  <p className="font-body text-body-lg text-text-muted mt-4 leading-relaxed">
                    With roots in funeral print, we bring precision, sensitivity and a commitment to quality to every project.
                    From funeral stationery and weddings to events and organisations, every brief receives the same level of care.
                  </p>
                </div>

                <div data-delay="4">
                  <Button variant="text" href="/about" className="mt-6">
                    Our Story →
                  </Button>
                </div>
              </div>

              {/* Right column — a single studio-made photo matching the headline,
                  kept at its own true proportions rather than stretched/cropped
                  to match the taller text column beside it */}
              <div data-delay="3" className="self-center">
                <ImageRevealCard
                  src="/images/design_with_intention.jpeg"
                  alt="Designed with Intention"
                  delay={0.1}
                  className="aspect-square rounded-[2rem]"
                  sizes="(min-width: 1024px) 45vw, 90vw"
                  priority
                />
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ──────────────────── SECTION 4 — FEATURED WORK (PORTFOLIO STRIP) ──────────────────── */}
      <section id="portfolio" className="py-16 md:py-24 lg:py-28 bg-bg-alternate border-t border-border/60">
        <SectionReveal>
          <div className="flex flex-col lg:flex-row">
            {/* Left — sticky text */}
            <div className="lg:w-1/3 lg:sticky lg:top-32 lg:self-start px-6 md:px-12 lg:pl-20 mb-12 lg:mb-0">
              <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
                Our Work
              </span>

              <AnimatedHeadline
                text="Print that speaks"
                accentWord="speaks"
                className="font-display text-display-md text-text-heading mt-4"
              />

              <div className="mt-8">
                <Button variant="text" href="/portfolio">
                  View full portfolio →
                </Button>
              </div>
            </div>

            {/* Right — horizontal scroll strip */}
            <div className="lg:w-2/3 overflow-x-auto drag-scroll">
              <div className="flex gap-6 pb-4 px-6 lg:px-0 lg:pr-12">
                {featured.map((item) => (
                  <div
                    key={item.id}
                    data-category={item.category}
                    className="group border border-border bg-cat-surface p-6 flex flex-col justify-between h-[620px] w-[320px] flex-shrink-0 transition-[transform,border-color] duration-300 hover:border-cat-accent hover:-translate-y-1"
                  >
                    <ImageRevealCard
                      src={item.image_url}
                      alt={item.title}
                      delay={0.1}
                      className="aspect-[3/4] w-full mb-6"
                      fallbackGradient={portfolioGradients[item.category] || 'linear-gradient(160deg, #FAF8F5, #F7F4EF)'}
                      sizes="320px"
                    />

                    {/* Text Details Area */}
                    <div>
                      <span className="font-mono text-label uppercase text-cat-accent-dark block">
                        {item.category}
                      </span>
                      <h3 className="mt-2 font-display text-xl text-cat-heading transition-colors duration-300 group-hover:text-cat-accent-dark">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="mt-3 font-body text-sm text-cat-body line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-cat-muted uppercase tracking-wider">
                        {item.location || 'Worldwide'}
                      </span>
                      <Link
                        href={`/portfolio/${item.id}`}
                        className="inline-flex items-center gap-1 font-body text-xs font-semibold uppercase tracking-wider text-cat-accent-dark"
                      >
                        View Project <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ──────────────────── SECTION 5 — PHILOSOPHY / WHY US ──────────────────── */}
      <section
        id="philosophy"
        className="relative overflow-hidden border-t border-border/60 bg-bg-primary"
      >
        {/* Subtle decorative gradient accent */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at center, #C6A85C22 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 container-wide flex flex-col items-center justify-center py-12 md:py-14 lg:py-16 text-center">
          <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
            Our Approach
          </span>

          <h2 className="font-display text-display-lg text-text-heading mt-3">
            Where craft meets <em className="italic text-accent-gold">care</em>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 w-full">
            {/* Precision */}
            <div className="text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-9 h-9 text-accent-gold mx-auto"
                aria-hidden="true"
              >
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="2.5" fill="currentColor" />
              </svg>
              <h3 className="font-display text-xl text-text-heading mt-4">Precision</h3>
              <p className="font-body text-body-base text-text-muted mt-2 max-w-xs mx-auto">
                Every proof reviewed by hand before print. No detail overlooked, no
                shortcut taken.
              </p>
            </div>

            {/* Sensitivity */}
            <div className="text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-9 h-9 text-accent-gold mx-auto"
                aria-hidden="true"
              >
                <path
                  d="M24 42S6 30 6 18C6 12 10.5 6 17 6C20.5 6 23 8 24 10C25 8 27.5 6 31 6C37.5 6 42 12 42 18C42 30 24 42 24 42Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <h3 className="font-display text-xl text-text-heading mt-4">Sensitivity</h3>
              <p className="font-body text-body-base text-text-muted mt-2 max-w-xs mx-auto">
                We understand the emotional weight of every brief. Some orders carry more
                than ink.
              </p>
            </div>

            {/* Global reach */}
            <div className="text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-9 h-9 text-accent-gold mx-auto"
                aria-hidden="true"
              >
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                <ellipse
                  cx="24"
                  cy="24"
                  rx="10"
                  ry="20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <line
                  x1="4"
                  y1="24"
                  x2="44"
                  y2="24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <line
                  x1="8"
                  y1="14"
                  x2="40"
                  y2="14"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.6"
                />
                <line
                  x1="8"
                  y1="34"
                  x2="40"
                  y2="34"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.6"
                />
              </svg>
              <h3 className="font-display text-xl text-text-heading mt-4">Inclusive</h3>
              <p className="font-body text-body-base text-text-muted mt-2 max-w-xs mx-auto">
                Transparent pricing with no surprises. what you see is what you pay.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Button variant="ghost" href="/about">
              Behind the Studio →
            </Button>
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 6 — CELEBRATION OF LIFE ──────────────────── */}
      <section id="celebration-of-life" className="relative overflow-hidden pt-10 pb-28 md:pt-14 md:pb-36 lg:pt-16 lg:pb-44 border-t border-border/60 bg-bg-secondary">
        <SectionReveal>
          <div className="container-wide max-w-3xl text-center relative z-10">
            <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
              Gather &amp; Remember
            </span>
            <h2 className="font-display text-display-md text-text-heading mt-3">
              Celebration of <em className="italic text-accent-gold">Life</em>
            </h2>
            <p className="mt-4 font-body text-body-lg text-text-muted leading-relaxed">
              Some moments deserve to be gathered around, shared, and remembered. Whether you&apos;re celebrating a new beginning, honoring a loved one, or marking a special milestone, we help you create a gathering that feels personal, warm, and true to your story.
            </p>
            <p className="mt-3 font-body text-body-lg text-text-muted leading-relaxed">
              From flowers, music, food, and décor to photographs and those little details that mean the most, we&apos;ll help bring everything together with care. So you can spend less time worrying about the details and more time being present with the people who matter most.
            </p>
          </div>
        </SectionReveal>

        {/* Doodle strip — decorative, sits along the bottom edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 opacity-70 md:h-28 lg:h-32"
          style={{
            backgroundImage: 'url(/images/doodle.png)',
            backgroundRepeat: '',
            backgroundPosition: 'bottom center',
            backgroundSize: 'auto 100%',
          }}
        />
      </section>

      {/* ──────────────────── SECTION 7 — TESTIMONIALS ──────────────────── */}
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
          <h2 className="font-display text-display-lg text-white">
            Heard from our clients
          </h2>

          <div className="mt-8">
            <TestimonialSlider dark />
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 8 — GLOBAL REACH ──────────────────── */}
      <section id="global" className="py-10 md:py-14 lg:py-16" style={{ backgroundColor: PANEL_TONES.mist.bg }}>
        <SectionReveal>
          <div className="container-wide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              {/* Left — modern delivery map */}
              <div className="flex items-center justify-center" data-delay="1">
                <div className="w-full max-w-lg rounded-[2rem] border border-border/70 bg-[#f7efe6] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.08)] md:p-6">
                  <img
                    src="/world_map.png"
                    alt="World map showing delivery coverage"
                    className="w-full h-auto rounded-[1.25rem] object-contain"
                  />
                </div>
              </div>

              {/* Right — copy */}
              <div data-delay="2">
                <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
                  Delivery network
                </span>

                <h2 className="font-display text-display-md text-text-heading mt-3">
                  Designed here.{' '}
                  <em className="italic text-accent-gold">Delivered everywhere.</em>
                </h2>

                <p className="font-body text-body-lg text-text-muted mt-4 leading-relaxed">
                  We create custom print for families, planners, brands, and clubs across North
                  America, United Kingdom, Europe. Each order
                  ships tracked, with digital delivery available for clients who print locally.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    'United Kingdom',
                    'United States',
                    'Europe',
                  ].map((region) => (
                    <span
                      key={region}
                      className="rounded-full border border-border bg-bg-primary/70 px-3 py-1 font-mono text-label uppercase tracking-wider text-text-muted"
                    >
                      {region}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ──────────────────── SECTION 10 — BLOG PREVIEW ────────────────────
           Pulled live from the same posts table /blog reads from, so the
           homepage never shows an article that isn't actually published —
           and the whole section is skipped rather than padded with
           placeholder cards when nothing's published yet. ──────────────── */}
      {recentPosts.length > 0 && (
      <section id="blog" className="py-16 md:py-24 lg:py-28 bg-bg-primary">
        <SectionReveal>
          <div className="container-wide">
            <h2 className="font-display text-display-lg text-text-heading">
              From the <em className="italic text-accent-gold">studio</em>
            </h2>

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

                    {/* Date */}
                    <time
                      className="font-mono text-label text-text-muted mt-2 block"
                      dateTime={post.published_at}
                    >
                      {new Date(post.published_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>

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
    </main>
  );
}
