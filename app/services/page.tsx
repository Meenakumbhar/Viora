import type { Metadata } from 'next';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import { services } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Explore our design and print services. We specialize in wedding stationery, funeral orders of service, sports programmes, brand identity, and custom print production.',
};

const serviceGradients: Record<string, string> = {
  'wedding-events': 'from-accent-blush/20 via-bg-secondary to-accent-gold/20',
  'funeral-memorial': 'from-bg-surface via-bg-secondary to-border',
  'sports-branding': 'from-accent-sage/20 via-bg-secondary to-bg-surface',
  'graphic-design': 'from-accent-gold/10 via-bg-secondary to-accent-blush/10',
  'print-production': 'from-accent-gold/20 via-bg-secondary to-bg-surface',
};

export default function ServicesPage() {
  return (
    <div data-category="all">
      {/* Hero Section */}
      <HeroVideo>
        <span className="block font-mono text-label uppercase tracking-wider text-cat-muted">
          What We Do
        </span>
        <h1 className="mt-4 font-display text-display-xl text-cat-heading max-w-4xl">
          Our <em className="italic text-accent-gold">services</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-cat-body max-w-2xl leading-relaxed">
          Premium design and print services tailored for life&apos;s most significant moments. From wedding suites to corporate branding and technical production.
        </p>
      </HeroVideo>

      {/* Services List Section */}
      <section className="bg-cat-bg py-24 md:py-36">
        <div className="container-wide space-y-24 md:space-y-48">
          {services.map((service, index) => {
            const isEven = index % 2 === 0;
            const gradientClass = serviceGradients[service.slug] || 'from-bg-surface to-bg-secondary';

            // Determine specific row category
            let rowCategory = 'all';
            if (service.slug === 'wedding-events') rowCategory = 'wedding';
            else if (service.slug === 'funeral-memorial') rowCategory = 'funeral';
            else if (service.slug === 'sports-branding') rowCategory = 'sports';
            else if (service.slug === 'graphic-design' || service.slug === 'print-production') rowCategory = 'branding';

            return (
              <SectionReveal key={service.slug}>
                <div
                  data-category={rowCategory}
                  className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-center ${
                    isEven ? '' : 'lg:flex-row-reverse'
                  }`}
                >
                  {/* Visual/Image Side */}
                  <div
                    className={`lg:col-span-6 relative aspect-[4/3] w-full overflow-hidden border border-border group ${
                      isEven ? 'lg:order-1' : 'lg:order-2'
                    }`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-tr ${gradientClass} transition-transform duration-700 group-hover:scale-105`}
                    />
                    <div className="absolute inset-0 bg-cat-bg/25" />
                    
                    {/* Decorative service initials/typography watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
                      <span className="font-display text-[12rem] font-bold text-cat-heading">
                        {service.title.substring(0, 1)}
                      </span>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div
                    className={`lg:col-span-6 flex flex-col justify-center ${
                      isEven ? 'lg:order-2 lg:pl-12' : 'lg:order-1 lg:pr-12'
                    }`}
                  >
                    <span className="font-mono text-label uppercase text-cat-muted tracking-wider">
                      {service.slug.replace('-', ' & ')}
                    </span>
                    <h2 className="mt-4 font-display text-display-lg text-cat-heading">
                      {service.title}{' '}
                      <em className="italic text-accent-gold">{service.titleAccent}</em>
                    </h2>
                    
                    <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed">
                      {service.description}
                    </p>

                    {/* What's Included */}
                    <div className="mt-8 border-t border-border pt-8">
                      <h3 className="font-mono text-label uppercase tracking-wider text-cat-heading">
                        What we provide
                      </h3>
                      <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {service.included.slice(0, 4).map((item) => (
                          <li key={item.name} className="flex items-start gap-3">
                            <span className="text-cat-accent font-body text-body-base mt-0.5" aria-hidden="true">
                              &rarr;
                            </span>
                            <div>
                              <span className="block font-body text-body-base font-medium text-cat-heading">
                                {item.name}
                              </span>
                              <span className="block font-body text-sm text-cat-body mt-0.5 opacity-90">
                                {item.description}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pricing Teaser & Actions */}
                    <div className="mt-8 flex flex-wrap gap-4 items-center border-t border-border pt-8">
                      <div className="mr-6">
                        <span className="block font-mono text-xs text-cat-muted uppercase tracking-wider">
                          Starting at
                        </span>
                        <span className="font-display text-xl text-cat-accent">
                          {service.tiers[0]?.price || 'On request'}
                        </span>
                      </div>
                      
                      <Button variant="primary" size="md" href={`/services/${service.slug}`}>
                        Learn More
                      </Button>
                    </div>
                  </div>
                </div>
              </SectionReveal>
            );
          })}
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="bg-cat-surface border-t border-border py-24 md:py-36">
        <SectionReveal>
          <div className="container-wide text-center max-w-3xl">
            <h2 className="font-display text-display-lg text-cat-heading">
              Let&apos;s build your <em className="italic text-accent-gold">project</em>
            </h2>
            <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed">
              Whether you need a custom wedding suite or a full-season sports programme, our studio handles every project with quiet confidence and technical precision.
            </p>
            <div className="mt-10 flex justify-center gap-6">
              <Button variant="primary" size="lg" href="/contact">
                Start a Project
              </Button>
              <Button variant="ghost" size="lg" href="/portfolio">
                View Portfolio
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
