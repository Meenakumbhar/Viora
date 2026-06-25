'use client';

import { useState } from 'react';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import { services, pricingFaqs } from '@/lib/data';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState(services[0].slug);

  const activeService = services.find((s) => s.slug === activeTab) || services[0];

  return (
    <div>
      {/* Hero Section */}
      <HeroVideo>
        <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
          Investment
        </span>
        <h1 className="mt-4 font-display text-display-xl text-text-primary max-w-4xl">
          Transparent, flat <em className="italic text-accent-gold">pricing</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-text-muted max-w-2xl leading-relaxed">
          Select a category below to see our standard packages, features, and rates. Contact us directly for bespoke project estimates.
        </p>
      </HeroVideo>

      {/* Dynamic Content Area */}
      {(() => {
        let category = 'all';
        if (activeTab === 'wedding-events') category = 'wedding';
        else if (activeTab === 'funeral-memorial') category = 'funeral';
        else if (activeTab === 'sports-branding') category = 'sports';
        else if (activeTab === 'graphic-design') category = 'branding';
        else if (activeTab === 'print-production') category = 'events';

        return (
          <div data-category={category}>
            {/* Pricing Tiers Section */}
            <section className="bg-cat-bg py-24 md:py-36 border-t border-border transition-colors duration-500">
              <div className="container-wide">
                <SectionReveal>
                  {/* Tabs selector */}
                  <div className="mb-16 border-b border-border overflow-x-auto">
                    <div className="flex gap-8 min-w-max pb-4" role="tablist" aria-label="Pricing categories">
                      {services.map((service) => {
                        const isActive = service.slug === activeTab;
                        // Determine category of tab for highlight styling
                        let tabCategory = 'all';
                        if (service.slug === 'wedding-events') tabCategory = 'wedding';
                        else if (service.slug === 'funeral-memorial') tabCategory = 'funeral';
                        else if (service.slug === 'sports-branding') tabCategory = 'sports';
                        else if (service.slug === 'graphic-design') tabCategory = 'branding';
                        else if (service.slug === 'print-production') tabCategory = 'events';

                        return (
                          <button
                            key={service.slug}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => setActiveTab(service.slug)}
                            data-category={tabCategory}
                            className={[
                              'pb-2 font-body text-body-base uppercase tracking-wider transition-all duration-300 font-medium',
                              isActive
                                ? 'border-b-2 border-cat-accent text-cat-accent'
                                : 'border-b-2 border-transparent text-cat-muted hover:text-cat-heading',
                            ].join(' ')}
                          >
                            {service.title.replace(' &', '')} {service.titleAccent}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active service package tiers */}
                  <div>
                    <div className="mb-12">
                      <span className="font-mono text-xs text-cat-accent-dark uppercase tracking-widest">
                        Selected Category
                      </span>
                      <h2 className="font-display text-3xl text-cat-heading mt-1">
                        {activeService.title} {activeService.titleAccent}
                      </h2>
                      <p className="font-body text-body-lg text-cat-body mt-2 max-w-2xl">
                        {activeService.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                      {activeService.tiers.map((tier) => (
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
                              <span className="font-display text-display-md text-cat-accent font-light">
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
                              href={`/contact?service=${activeService.slug}&tier=${tier.name.toLowerCase()}`}
                            >
                              {tier.cta}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionReveal>
              </div>
            </section>

            {/* FAQ Accordion */}
            <section id="faq" className="bg-cat-surface py-24 md:py-36 border-t border-border transition-colors duration-500">
              <div className="container-wide max-w-4xl">
                <SectionReveal>
                  <div className="text-center mb-16">
                    <span className="font-mono text-label uppercase text-cat-accent-dark tracking-wider">
                      Support
                    </span>
                    <h2 className="mt-4 font-display text-display-lg text-cat-heading">
                      Pricing & logistics <em className="italic text-accent-gold">FAQs</em>
                    </h2>
                  </div>

                  <div className="space-y-2">
                    {pricingFaqs.map((faq) => (
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

            {/* CTA Section */}
            <section className="bg-cat-bg border-t border-border py-24 md:py-36 text-center transition-colors duration-500">
              <SectionReveal>
                <div className="container-wide max-w-3xl">
                  <h2 className="font-display text-display-lg text-cat-heading">
                    Need a custom <em className="italic text-accent-gold">brief?</em>
                  </h2>
                  <p className="mt-6 font-body text-body-lg text-cat-body leading-relaxed">
                    If your requirements don&apos;t fit our standard packages, our designers can prepare a bespoke estimate based on your specific print size, stock, and volume.
                  </p>
                  <div className="mt-10">
                    <Button variant="primary" size="lg" href="/contact">
                      Get a Custom Quote
                    </Button>
                  </div>
                </div>
              </SectionReveal>
            </section>
          </div>
        );
      })()}
    </div>
  );
}
