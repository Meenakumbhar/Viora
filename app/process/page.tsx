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
      <HeroVideo poster="/images/Process_banner.jpg">
        <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
          Studio Workflow
        </span>
        <h1 className="mt-4 font-display text-display-xl text-text-primary max-w-4xl">
          Simple from start to <em className="not-italic font-semibold text-accent-gold">delivery</em>
        </h1>
        <p className="mt-6 font-body text-body-lg text-text-muted max-w-2xl leading-relaxed">
          We manage the design, coordination, and print details so you can focus on the event itself. Here is how we bring your project to life.
        </p>
      </HeroVideo>

      {/* Timeline Section — a horizontal stepper on lg+ (all steps in one
          row, connected by a single line behind the numbered circles) that
          collapses back to a stacked list below lg, where five columns of
          this much text would no longer be readable. Top padding kept
          lighter than the bottom's: the hero above already ends in its own
          lg:pb-32 + gradient fade, so a full py-16/24/28 here on top of
          that read as a dead gap — but it still needs its own clear
          breathing room from the hero, not zero. */}
      <section className="bg-bg-primary pt-14 pb-16 md:pt-20 md:pb-24 lg:pt-20 lg:pb-14 border-t border-border">
        <div className="container-wide">
          <SectionReveal>
            <div className="mx-auto max-w-4xl lg:max-w-none">
              <div className="relative space-y-10 before:absolute before:inset-y-0 before:left-6 before:w-[1px] before:bg-border md:before:left-12 lg:grid lg:grid-cols-5 lg:gap-6 lg:space-y-0 lg:before:inset-x-0 lg:before:top-4 lg:before:left-0 lg:before:h-[1px] lg:before:w-full lg:before:bg-border">
                {processSteps.map((step) => (
                  <div
                    key={step.number}
                    className="relative flex flex-col gap-6 pl-16 md:flex-row md:gap-12 md:pl-28 lg:flex-col lg:items-center lg:gap-0 lg:pl-0 lg:text-center"
                  >
                    {/* Circle counter */}
                    <div className="absolute left-2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-bg-primary font-mono text-base font-bold text-accent-gold md:left-8 lg:static lg:translate-x-0">
                      {step.number}
                    </div>

                    <div className="flex-1 lg:mt-3">
                      <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-center lg:gap-2">
                        <h2 className="font-display text-3xl text-text-primary lg:text-xl">
                          {step.title}
                        </h2>
                        <span className="font-mono text-base text-text-muted uppercase tracking-widest border border-border px-2 py-0.5 bg-bg-secondary">
                          {step.timeframe}
                        </span>
                      </div>

                      <p className="mt-4 font-body text-body-lg text-text-muted leading-relaxed max-w-2xl lg:mt-2 lg:text-base">
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
                Process & production <em className="not-italic font-semibold text-accent-gold">FAQs</em>
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
              Ready to <em className="not-italic font-semibold text-accent-gold">start?</em>
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
