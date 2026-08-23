import type { Metadata } from 'next';
import HeroVideo from '@/components/ui/HeroVideo';
import SectionReveal from '@/components/ui/SectionReveal';
import Button from '@/components/ui/Button';
import Accordion from '@/components/ui/Accordion';
import { processSteps } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Our Process',
  description: 'Learn how Memories in Prints works. Our simple 5-step process from initial enquiry and design to final print delivery.',
};

const processFaqs = [
  {
    question: 'How long does the design phase typically take?',
    answer: 'For standard orders, you will receive your first high-resolution PDF proof within 3–5 working days. For memorial print, we expedite this to 12–24 hours to accommodate urgent timelines.',
  },
  {
    question: 'Can I supply my own completed designs for printing?',
    answer: 'Yes. We accept print-ready PDF files with 3mm crop marks and bleed. We run a full technical check on all artwork before sending it to the press, and we will flag any issues with resolution or alignment.',
  },
  {
    question: 'How many revisions can I request during design?',
    answer: 'Our packages include standard rounds of revisions (typically 1 for Essential and 3 for Premium). We work with you to make sure details like spelling, dates, and layouts are exactly right before approval.',
  },
  {
    question: 'What are your shipping and turnaround times?',
    answer: 'Once you approve the final proof, printing takes 2–4 working days. Tracked courier shipping takes 1–3 days in the UK, 3–5 days to Europe/US, and 5–7 days to Australia/Asia.',
  },
];

export default function ProcessPage() {
  return (
    <div>
      {/* Hero Section */}
      <HeroVideo>
        <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
          Studio Workflow
        </span>
        <h1 className="mt-4 font-display text-display-xl text-text-primary max-w-4xl">
          Simple from start to <em className="italic text-accent-gold">delivery</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-text-muted max-w-2xl leading-relaxed">
          We manage the design, coordination, and print details so you can focus on the event itself. Here is how we bring your project to life.
        </p>
      </HeroVideo>

      {/* Timeline Section */}
      <section className="bg-bg-primary py-16 md:py-24 lg:py-28 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-10 relative before:absolute before:inset-y-0 before:left-6 md:before:left-12 before:w-[1px] before:bg-border">
                {processSteps.map((step) => (
                  <div key={step.number} className="relative pl-16 md:pl-28 flex flex-col md:flex-row gap-6 md:gap-12">
                    {/* Circle counter */}
                    <div className="absolute left-2 md:left-8 -translate-x-1/2 w-8 h-8 rounded-full border border-border bg-bg-secondary flex items-center justify-center font-mono text-xs text-accent-gold font-bold">
                      {step.number}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-3xl text-text-primary">
                          {step.title}
                        </h2>
                        <span className="font-mono text-[11px] text-text-muted uppercase tracking-widest border border-border px-2 py-0.5 bg-bg-secondary">
                          {step.timeframe}
                        </span>
                      </div>
                      
                      <p className="mt-4 font-body text-body-lg text-text-muted leading-relaxed max-w-2xl">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="bg-bg-alternate py-16 md:py-24 lg:py-28 border-t border-border">
        <div className="container-wide max-w-4xl">
          <SectionReveal>
            <div className="text-center mb-10">
              <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
                Support
              </span>
              <h2 className="mt-4 font-display text-display-lg text-text-primary">
                Process & production <em className="italic text-accent-gold">FAQs</em>
              </h2>
            </div>

            <Accordion items={processFaqs} />
          </SectionReveal>
        </div>
      </section>

      {/* final CTA — pale gold tint reserved for calls-to-action, consistent across pages */}
      <section className="bg-bg-cta border-t border-border py-16 md:py-20 text-center">
        <SectionReveal>
          <div className="container-wide max-w-3xl">
            <h2 className="font-display text-display-lg text-text-primary">
              Ready to <em className="italic text-accent-gold">start?</em>
            </h2>
            <p className="mt-6 font-body text-body-lg text-text-muted leading-relaxed">
              Fill in our brief form and we will review your requirements and respond with a detailed quote within 24 hours.
            </p>
            <div className="mt-10">
              <Button variant="primary" size="lg" href="/contact">
                Request a Quote
              </Button>
            </div>
          </div>
        </SectionReveal>
      </section>
    </div>
  );
}
