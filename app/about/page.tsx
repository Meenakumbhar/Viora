import type { Metadata } from 'next';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'About Our Studio',
  description: 'Learn about Memories in Prints. A global design and print studio dedicated to producing elegant, premium print for life’s key milestones.',
};

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <HeroVideo>
        <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
          Our Story
        </span>
        <h1 className="mt-4 font-display text-display-xl text-text-primary max-w-4xl">
          Designed with <em className="italic text-accent-gold">intention</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-text-muted max-w-2xl leading-relaxed">
          We produce design and print that honours life&apos;s most meaningful occasions — and the organisations that shape communities.
        </p>
      </HeroVideo>

      {/* Intro section */}
      <section className="bg-bg-primary py-24 md:py-36 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6">
                <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
                  Philosophy
                </span>
                <h2 className="mt-4 font-display text-display-lg text-text-primary">
                  Where craft meets <em className="italic text-accent-gold">care</em>
                </h2>
                <div className="mt-6 space-y-6 font-body text-body-lg text-text-muted leading-relaxed">
                  <p>
                    Memories in Prints is a full-service design and print studio serving a global client base from our remote setup. We believe that physical prints carry a special weight in a digital world.
                  </p>
                  <p>
                    Whether it is a custom wedding suite, a memorial keepsake, or a matchday programme for your sports club, every project is handled with precision and quiet confidence.
                  </p>
                </div>
              </div>
              <div className="lg:col-span-6 relative aspect-square border border-border overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-accent-gold/20 via-bg-surface to-accent-blush/20" />
                <div className="absolute inset-0 bg-bg-primary/10" />
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Founder's note */}
      <section className="bg-bg-alternate py-24 md:py-36 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 relative aspect-[3/4] border border-border overflow-hidden lg:order-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-bg-surface via-bg-secondary to-border" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
                  <span className="font-display text-[8rem] font-bold text-text-primary">
                    M
                  </span>
                </div>
              </div>
              
              <div className="lg:col-span-7 lg:order-1 lg:pr-12">
                <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
                  The Founder
                </span>
                <h2 className="mt-4 font-display text-display-lg text-text-primary">
                  A note from the <em className="italic text-accent-gold">founder</em>
                </h2>
                <div className="mt-6 space-y-6 font-body text-body-lg text-text-muted leading-relaxed">
                  <p>
                    Our studio started with a simple belief: that print during life&apos;s key passages should feel considered. We began by designing memorial booklets. In that space, there is no room for errors, delays, or clinical templates.
                  </p>
                  <p>
                    That background shapes how we design everything today. We treat every wedding suite, branding brief, and sports card with the exact same level of thoroughness and respect.
                  </p>
                  <div className="pt-6 border-t border-border">
                    <span className="block font-display text-xl text-text-primary italic">
                      Aboli
                    </span>
                    <span className="block font-mono text-xs text-text-muted uppercase tracking-wider mt-1">
                      Founder & Creative Director
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Values */}
      <section className="bg-bg-primary py-24 md:py-36 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
                Principles
              </span>
              <h2 className="mt-4 font-display text-display-lg text-text-primary">
                What we stand <em className="italic text-accent-gold">for</em>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="border border-border p-8 bg-bg-secondary">
                <h3 className="font-display text-2xl text-text-primary">
                  Uncompromising Quality
                </h3>
                <p className="mt-4 font-body text-body-base text-text-muted leading-relaxed">
                  We review every design file, align margins, check resolution, and coordinate print stocks by hand. We do not use generic templates or cut corners.
                </p>
              </div>

              <div className="border border-border p-8 bg-bg-secondary">
                <h3 className="font-display text-2xl text-text-primary">
                  Absolute Sensitivity
                </h3>
                <p className="mt-4 font-body text-body-base text-text-muted leading-relaxed">
                  We understand the gravity of certain briefs. Our customer care is unhurried, respectful, and compassionate. We handle the design so you can focus on the moment.
                </p>
              </div>

              <div className="border border-border p-8 bg-bg-secondary">
                <h3 className="font-display text-2xl text-text-primary">
                  Global Perspective
                </h3>
                <p className="mt-4 font-body text-body-base text-text-muted leading-relaxed">
                  We serve families, clubs, and brands in over 30 countries. Our logistics are designed to handle express custom print packages worldwide.
                </p>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-bg-secondary py-24 md:py-36 border-t border-border">
        <div className="container-wide max-w-4xl">
          <SectionReveal>
            <div className="text-center mb-16">
              <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
                History
              </span>
              <h2 className="mt-4 font-display text-display-lg text-text-primary">
                Our <em className="italic text-accent-gold">journey</em>
              </h2>
            </div>

            <div className="space-y-12 relative before:absolute before:inset-y-0 before:left-4 md:before:left-1/2 before:w-[1px] before:bg-border">
              {/* Event 1 */}
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pl-10 md:pl-0">
                <div className="absolute left-3.5 md:left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-gold z-10" />
                <div className="w-full md:w-[45%] text-left md:text-right">
                  <span className="font-mono text-accent-gold font-bold">2021</span>
                  <h3 className="font-display text-xl text-text-primary mt-1">Studio Founded</h3>
                  <p className="mt-2 font-body text-body-base text-text-muted">
                    Launched with a focus on custom celebration of life print, establishing our core design philosophy.
                  </p>
                </div>
                <div className="hidden md:block w-[45%]" />
              </div>

              {/* Event 2 */}
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pl-10 md:pl-0">
                <div className="absolute left-3.5 md:left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-gold z-10" />
                <div className="hidden md:block w-[45%]" />
                <div className="w-full md:w-[45%]">
                  <span className="font-mono text-accent-gold font-bold">2022</span>
                  <h3 className="font-display text-xl text-text-primary mt-1">Expanding Services</h3>
                  <p className="mt-2 font-body text-body-base text-text-muted">
                    Began designing premium wedding suites and graphic design services for local clients.
                  </p>
                </div>
              </div>

              {/* Event 3 */}
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pl-10 md:pl-0">
                <div className="absolute left-3.5 md:left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-gold z-10" />
                <div className="w-full md:w-[45%] text-left md:text-right">
                  <span className="font-mono text-accent-gold font-bold">2023</span>
                  <h3 className="font-display text-xl text-text-primary mt-1">Going Global</h3>
                  <p className="mt-2 font-body text-body-base text-text-muted">
                    Partnered with premium logistics providers to launch tracked shipping to the US, EU, and Australia.
                  </p>
                </div>
                <div className="hidden md:block w-[45%]" />
              </div>

              {/* Event 4 */}
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pl-10 md:pl-0">
                <div className="absolute left-3.5 md:left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent-gold z-10" />
                <div className="hidden md:block w-[45%]" />
                <div className="w-full md:w-[45%]">
                  <span className="font-mono text-accent-gold font-bold">2025</span>
                  <h3 className="font-display text-xl text-text-primary mt-1">Sports & Branding</h3>
                  <p className="mt-2 font-body text-body-base text-text-muted">
                    Introduced club branding packages and regular season programmes for athletic clubs globally.
                  </p>
                </div>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* final CTA */}
      <section className="bg-bg-primary py-24 text-center">
        <SectionReveal>
          <div className="container-wide max-w-3xl">
            <h2 className="font-display text-display-lg text-text-primary">
              Work with <em className="italic text-accent-gold">us</em>
            </h2>
            <p className="mt-6 font-body text-body-lg text-text-muted leading-relaxed">
              Have an upcoming event or branding requirement? Our designers are ready to help shape your print project.
            </p>
            <div className="mt-10">
              <Button variant="primary" size="lg" href="/contact">
                Start a Conversation
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
