import Link from 'next/link';
import Image from 'next/image';
import HeroScrollEffect from '@/components/ui/HeroScrollEffect';
import Button from '@/components/ui/Button';
import SectionReveal from '@/components/ui/SectionReveal';
import TestimonialSlider from '@/components/ui/TestimonialSlider';
import AnimatedHeadline from '@/components/ui/AnimatedHeadline';
import ImageRevealCard from '@/components/ui/ImageRevealCard';
import CountUp from '@/components/ui/CountUp';
import { processSteps, blogPosts } from '@/lib/data';
import { ACTIVE_CATEGORIES } from '@/lib/active-services';
import { getPortfolioItems } from '@/lib/db';
import type { PortfolioItem } from '@/types/database';

// Real studio work, shared across the About grid and the Featured Work strip
// — pulled live from the portfolio so the homepage always reflects what's
// actually been made, never seed/placeholder data. Interleaved across active
// categories (rather than one big recency-sorted pull) so the mix doesn't
// get swamped by whichever category has more items.
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

  const aboutItems = perCategory
    .map((items) => items[0])
    .filter((item): item is PortfolioItem => Boolean(item));

  return { featured, aboutItems };
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
  const { featured, aboutItems } = await getHomepagePortfolioData();

  return (
    <main>
      <HeroScrollEffect />
      {/* ──────────────────── SECTION 1 — HERO ──────────────────── */}
      <section
        id="hero"
        className="hero-section relative min-h-svh overflow-hidden bg-bg-primary flex items-center py-32 lg:py-24"
      >
        {/* Banner photo — heavily veiled so the existing hero text stays fully readable over it */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/Home-Banner.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-bg-primary/90" />
        </div>

        <div className="container-wide relative z-10 w-full">
          <div className="hero-content">
            <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
              Global Design &amp; Print Studio
            </span>

            <AnimatedHeadline
              text="Made for every moment"
              accentWord="moment"
              className="font-display text-display-xl text-text-heading max-w-xl mt-4"
            />

            <p className="font-body text-body-lg text-text-muted max-w-lg mt-6">
              Funerals and Weddings.
              <br />
              Design and print that honours what matters.
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
      <section id="about" className="py-24 md:py-36 lg:py-48 bg-bg-primary">
        <SectionReveal>
          <div className="container-wide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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
                  className="font-display text-display-lg text-text-heading mt-4"
                />

                <div data-delay="3">
                  <p className="font-body text-body-lg text-text-muted mt-6 leading-relaxed">
                    Memories in Prints is a full-service design and print studio with a
                    global client base. We produce print for life&rsquo;s most meaningful
                    occasions and for the brands and organisations that shape communities.
                  </p>

                  <p className="font-body text-body-lg text-text-muted mt-6 leading-relaxed">
                    Founded with roots in funeral print, we understand the weight some
                    briefs carry. That background informs everything we do precision,
                    sensitivity, and a refusal to cut corners.
                  </p>

                  <p className="font-body text-body-lg text-text-muted mt-6 leading-relaxed">
                    We serve families, wedding planners and event organisers. Whether digital or
                    printed, every project receives the same level of care.
                  </p>
                </div>

                <div data-delay="4">
                  <Button variant="text" href="/about" className="mt-8">
                    Our Story →
                  </Button>
                </div>
              </div>

              {/* Right column — real studio work, one per active category */}
              <div className="grid grid-cols-2 gap-4" data-delay="3">
                {aboutItems.map((item, i) => (
                  <ImageRevealCard
                    key={item.id}
                    src={item.image_url}
                    alt={item.title}
                    label={item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    delay={0.1 + i * 0.1}
                    className="aspect-square"
                    fallbackGradient={portfolioGradients[item.category]}
                    sizes="(min-width: 1024px) 22vw, 45vw"
                    priority={i === 0}
                  />
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ──────────────────── SECTION 4 — FEATURED WORK (PORTFOLIO STRIP) ──────────────────── */}
      <section id="portfolio" className="py-24 md:py-36 lg:py-48 bg-bg-primary">
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
                className="font-display text-display-lg text-text-heading mt-4"
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
                    className="group border border-border bg-cat-surface p-6 flex flex-col justify-between h-[450px] w-[320px] flex-shrink-0 transition-[transform,border-color] duration-300 hover:border-cat-accent hover:-translate-y-1"
                  >
                    <ImageRevealCard
                      src={item.image_url}
                      alt={item.title}
                      delay={0.1}
                      className="aspect-[4/3] w-full mb-6"
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
        className="relative min-h-[80vh] overflow-hidden bg-bg-alternate"
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
        <div className="relative z-10 container-wide flex flex-col items-center justify-center min-h-[80vh] py-24 md:py-36 lg:py-48 text-center">
          <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
            Our Approach
          </span>

          <h2 className="font-display text-display-lg text-text-heading mt-4">
            Where craft meets <em className="italic text-accent-gold">care</em>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16 w-full">
            {/* Precision */}
            <div className="text-center">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-accent-gold mx-auto"
                aria-hidden="true"
              >
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="24" cy="24" r="2.5" fill="currentColor" />
              </svg>
              <h3 className="font-display text-xl text-text-heading mt-6">Precision</h3>
              <p className="font-body text-body-base text-text-muted mt-3 max-w-xs mx-auto">
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
                className="w-12 h-12 text-accent-gold mx-auto"
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
              <h3 className="font-display text-xl text-text-heading mt-6">Sensitivity</h3>
              <p className="font-body text-body-base text-text-muted mt-3 max-w-xs mx-auto">
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
                className="w-12 h-12 text-accent-gold mx-auto"
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
              <h3 className="font-display text-xl text-text-heading mt-6">Inclusive</h3>
              <p className="font-body text-body-base text-text-muted mt-3 max-w-xs mx-auto">
                Transparent pricing with no surprises. what you see is what you pay.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Button variant="ghost" href="/about">
              Behind the Studio →
            </Button>
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 6 — PROCESS STEPS ──────────────────── */}
      <section id="process" className="bg-bg-secondary py-24 md:py-36 lg:py-48">
        <SectionReveal>
          <div className="container-wide">
            <h2 className="font-display text-display-lg text-text-heading text-center">
              Simple from start to{' '}
              <em className="italic text-accent-gold">delivery</em>
            </h2>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-0 mt-16">
              {processSteps.map((step, i) => (
                <div
                  key={step.number}
                  className="flex-1 relative"
                  data-delay={String(Math.min(i + 1, 5))}
                >
                  {/* Connecting line (desktop only) */}
                  {i < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-5 left-[calc(50%+1rem)] right-0 h-[2px] bg-accent-gold/30" />
                  )}

                  <div className="lg:pr-8">
                    <span className="font-mono text-display-md text-accent-gold">
                      {String(step.number).padStart(2, '0')}
                    </span>
                    <h3 className="font-display text-xl text-text-heading mt-2">
                      {step.title}
                    </h3>
                    <p className="font-body text-body-base text-text-muted mt-3">
                      {step.description}
                    </p>
                    <span className="font-mono text-label text-text-muted mt-4 block">
                      {step.timeframe}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ──────────────────── SECTION 7 — TESTIMONIALS ──────────────────── */}
      <section id="testimonials" className="bg-bg-primary py-24 md:py-36 lg:py-48">
        <div className="container-wide text-center">
          <h2 className="font-display text-display-lg text-text-heading">
            Heard from our <em className="italic text-accent-gold">clients</em>
          </h2>

          <div className="mt-16">
            <TestimonialSlider />
          </div>
        </div>
      </section>

      {/* ──────────────────── SECTION 8 — GLOBAL REACH ──────────────────── */}
      <section id="global" className="py-24 md:py-36 lg:py-48 bg-bg-alternate">
        <SectionReveal>
          <div className="container-wide">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
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

                <h2 className="font-display text-display-lg text-text-heading mt-4">
                  Designed here.{' '}
                  <em className="italic text-accent-gold">Delivered everywhere.</em>
                </h2>

                <p className="font-body text-body-lg text-text-muted mt-6 leading-relaxed">
                  We create custom print for families, planners, brands, and clubs across North
                  America, United Kingdom, Europe. Each order
                  ships tracked, with digital delivery available for clients who print locally.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                    'United Kingdom',
                    'United States',
                    'Europe',
                  ].map((region) => (
                    <span
                      key={region}
                      className="border border-border bg-bg-primary/70 px-3 py-1 font-mono text-label uppercase tracking-wider text-text-muted"
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

      {/* ──────────────────── SECTION 10 — BLOG PREVIEW ──────────────────── */}
      <section id="blog" className="py-24 md:py-36 lg:py-48 bg-bg-primary">
        <SectionReveal>
          <div className="container-wide">
            <h2 className="font-display text-display-lg text-text-heading">
              From the <em className="italic text-accent-gold">studio</em>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              {blogPosts.slice(0, 3).map((post, i) => (
                <article key={post.id} data-delay={String(Math.min(i + 1, 5))}>
                  <Link href={`/blog/${post.slug}`} className="group block">
                    {/* Image placeholder */}
                    <div
                      className="aspect-video rounded-none overflow-hidden"
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
    </main>
  );
}
