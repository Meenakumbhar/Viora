import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import { services, getServiceBySlug, getRelatedServices } from '@/lib/data';
import { isServiceSlugActive } from '@/lib/active-services';
import { SITE_URL } from '@/lib/site-url';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return services.filter((s) => isServiceSlugActive(s.slug)).map((s) => ({
    slug: s.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = isServiceSlugActive(slug) ? getServiceBySlug(slug) : undefined;

  if (!service) {
    return {
      title: 'Service Not Found',
      description: 'This service page could not be found.',
    };
  }

  const title = `${service.title} ${service.titleAccent}`;
  const description = service.description;
  const url = `${SITE_URL}/services/${service.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      siteName: 'Memories in Prints',
      locale: 'en_GB',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.jpg'],
    },
  };
}


const serviceGradients: Record<string, string> = {
  'wedding-events': 'from-accent-blush/20 via-bg-secondary to-accent-gold/20',
  'funeral-memorial': 'from-bg-surface via-bg-secondary to-border',
  'sports-branding': 'from-accent-sage/20 via-bg-secondary to-bg-surface',
  'graphic-design': 'from-accent-gold/10 via-bg-secondary to-accent-blush/10',
  'print-production': 'from-accent-gold/20 via-bg-secondary to-bg-surface',
};

export default async function ServicePage({ params }: PageProps) {
  const { slug } = await params;
  const service = isServiceSlugActive(slug) ? getServiceBySlug(slug) : undefined;

  if (!service) {
    notFound();
  }

  const related = getRelatedServices(service.relatedSlugs).filter((r) => isServiceSlugActive(r.slug));
  const gradientClass = serviceGradients[service.slug] || 'from-bg-surface to-bg-secondary';

  // Determine the category for this service
  let category = 'all';
  if (service.slug === 'wedding-events') category = 'wedding';
  else if (service.slug === 'funeral-memorial') category = 'funeral';
  else if (service.slug === 'sports-branding') category = 'sports';
  else if (service.slug === 'graphic-design') category = 'branding';
  else if (service.slug === 'print-production') category = 'events';

  return (
    <div data-category={category}>
      {/* Hero Section */}
      <HeroVideo>
        <div className="flex flex-col items-start">
          <span className="font-mono text-label uppercase tracking-wider text-cat-muted">
            Services / {service.slug.replace('-', ' & ')}
          </span>
          <h1 className="mt-4 font-display text-display-xl text-cat-heading max-w-4xl">
            {service.title}{' '}
            <em className="italic text-accent-gold">{service.titleAccent}</em>
          </h1>
          <p className="mt-6 font-body text-body-lg text-cat-body max-w-2xl leading-relaxed">
            {service.description}
          </p>

          <div className="mt-6 border-l border-cat-accent pl-4 py-1">
            <span className="block font-mono text-xs text-cat-muted uppercase tracking-wider">
              Creative Tone
            </span>
            <span className="font-body text-body-base text-cat-body">
              {service.tone}
            </span>
          </div>

          <div className="mt-10 flex gap-4">
            <Button variant="primary" size="lg" href="/contact">
              Start a Project
            </Button>
            <Button variant="ghost" size="lg" href="#pricing">
              View Pricing
            </Button>
          </div>
        </div>
      </HeroVideo>

      {/* What's Included */}
      <section className="bg-cat-bg py-24 md:py-36 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-5">
                <span className="font-mono text-label uppercase text-cat-muted tracking-wider">
                  The Offer
                </span>
                <h2 className="mt-4 font-display text-display-lg text-cat-heading">
                  What we <em className="italic text-accent-gold">provide</em>
                </h2>
                <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed">
                  We approach every project with thorough preparation, ensuring that the details correspond exactly to your creative direction. No compromises on paper or print quality.
                </p>
              </div>
              <div className="lg:col-span-7">
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {service.included.map((item) => (
                    <li key={item.name} className="border border-border p-6 bg-cat-surface hover:border-cat-accent transition-colors duration-300">
                      <span className="block font-display text-xl text-cat-heading">
                        {item.name}
                      </span>
                      <p className="mt-3 font-body text-body-base text-cat-body leading-relaxed">
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Visual Break Section */}
      <section className="relative h-[40vh] md:h-[60vh] overflow-hidden border-y border-border">
        <div className={`absolute inset-0 bg-gradient-to-tr ${gradientClass}`} />
        <div className="absolute inset-0 bg-cat-bg/30" />
      </section>

      {/* Ideal Client (Who It's For) */}
      <section className="bg-cat-surface py-24 md:py-36">
        <div className="container-wide">
          <SectionReveal>
            <div className="max-w-3xl mx-auto text-center">
              <span className="font-mono text-label uppercase text-cat-muted tracking-wider">
                Suitability
              </span>
              <h2 className="mt-4 font-display text-display-lg text-cat-heading">
                Designed for <em className="italic text-accent-gold">you</em>
              </h2>
              <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed italic">
                &ldquo;{service.idealClient}&rdquo;
              </p>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section id="pricing" className="bg-cat-bg py-24 md:py-36 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="font-mono text-label uppercase text-cat-muted tracking-wider">
                Investment
              </span>
              <h2 className="mt-4 font-display text-display-lg text-cat-heading">
                Service <em className="italic text-accent-gold">packages</em>
              </h2>
              <p className="mt-4 font-body text-body-lg text-cat-body">
                Choose a pricing package that fits your project scope, or request a custom quote.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {service.tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`flex flex-col justify-between p-8 bg-cat-surface border transition-colors duration-300 relative ${
                    tier.highlighted
                      ? 'border-cat-accent'
                      : 'border-border hover:border-cat-accent/50'
                  }`}
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cat-pill-bg text-cat-pill-text font-mono text-[10px] uppercase tracking-widest px-3 py-1 font-semibold">
                      Recommended
                    </span>
                  )}
                  <div>
                    <h3 className="font-mono text-label uppercase tracking-wider text-cat-heading">
                      {tier.name}
                    </h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="font-display text-display-md text-cat-accent">
                        {tier.price}
                      </span>
                    </div>
                    
                    <ul className="mt-8 space-y-4 border-t border-border pt-8">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <span className="h-1.5 w-1.5 rounded-full bg-cat-accent flex-shrink-0" />
                          <span className="font-body text-body-base text-cat-body">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 border-t border-border pt-6">
                    <Button
                      variant={tier.highlighted ? 'primary' : 'ghost'}
                      size="md"
                      className="w-full"
                      href={`/contact?service=${service.slug}&tier=${tier.name.toLowerCase()}`}
                    >
                      {tier.cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-cat-surface py-24 md:py-36 border-t border-border">
        <div className="container-wide max-w-4xl">
          <SectionReveal>
            <div className="text-center mb-16">
              <span className="font-mono text-label uppercase text-cat-muted tracking-wider">
                Support
              </span>
              <h2 className="mt-4 font-display text-display-lg text-cat-heading">
                Frequently asked <em className="italic text-accent-gold">questions</em>
              </h2>
            </div>

            <div className="space-y-2">
              {service.faqs.map((faq) => (
                <details key={faq.question} className="group border-b border-border py-6">
                  <summary className="flex justify-between items-center cursor-pointer list-none font-display text-xl text-cat-heading group-open:text-cat-accent transition-colors duration-200">
                    {faq.question}
                    <span className="text-cat-accent font-mono transition-transform duration-300 group-open:rotate-180">
                      &darr;
                    </span>
                  </summary>
                  <p className="mt-4 font-body text-body-base text-cat-body leading-relaxed max-w-3xl">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Related Services */}
      {related.length > 0 && (
        <section className="bg-cat-bg py-24 md:py-36 border-t border-border">
          <div className="container-wide">
            <SectionReveal>
              <div className="text-center mb-16">
                <span className="font-mono text-label uppercase text-cat-muted tracking-wider">
                  More Options
                </span>
                <h2 className="mt-4 font-display text-display-lg text-cat-heading">
                  Explore related <em className="italic text-accent-gold">disciplines</em>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {related.map((rel) => {
                  const relGradient = serviceGradients[rel.slug] || 'from-bg-surface to-bg-secondary';
                  const relCategory = rel.slug.includes('wedding') ? 'wedding' : rel.slug.includes('funeral') ? 'funeral' : rel.slug.includes('sports') ? 'sports' : 'branding';
                  return (
                    <div key={rel.slug} className="group border border-border bg-cat-surface flex flex-col justify-between" data-category={relCategory}>
                      {/* Image header */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border">
                        <div className={`absolute inset-0 bg-gradient-to-tr ${relGradient} transition-transform duration-700 group-hover:scale-105`} />
                        <div className="absolute inset-0 bg-cat-bg/20" />
                      </div>
                      
                      <div className="p-8 flex flex-col flex-1 justify-between">
                        <div>
                          <span className="font-mono text-xs uppercase tracking-wider text-cat-muted">
                            {rel.slug.replace('-', ' & ')}
                          </span>
                          <h3 className="mt-2 font-display text-2xl text-cat-heading">
                            {rel.title} {rel.titleAccent}
                          </h3>
                          <p className="mt-3 font-body text-body-base text-cat-body leading-relaxed">
                            {rel.description}
                          </p>
                        </div>
                        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                          <span className="font-mono text-xs text-cat-body uppercase tracking-wider">
                            Starting from {rel.tiers[0]?.price}
                          </span>
                          <Button variant="text" size="sm" href={`/services/${rel.slug}`}>
                            View details &rarr;
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionReveal>
          </div>
        </section>
      )}

      {/* final CTA */}
      <section className="bg-cat-surface border-t border-border py-24 text-center">
        <SectionReveal>
          <div className="container-wide max-w-3xl">
            <h2 className="font-display text-display-lg text-cat-heading">
              Ready to <em className="italic text-accent-gold">start?</em>
            </h2>
            <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed">
              Contact our design studio today for a custom quote on {service.title.toLowerCase()} {service.titleAccent.toLowerCase()} print and assets.
            </p>
            <div className="mt-10">
              <Button variant="primary" size="lg" href="/contact">
                Start a Project
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
