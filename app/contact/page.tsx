import type { Metadata } from 'next';
import HeroVideo from '@/components/ui/HeroVideo';
import QuoteForm from '@/components/ui/QuoteForm';

export const metadata: Metadata = {
  title: 'Get a Quote',
  description: 'Request a quote from Memories in Prints. Wedding stationery, funeral print, sports programmes, branding, and more — tell us about your project.',
};

const CONTACTS = [
  {
    label: 'Email',
    handle: 'info@memoriesinprints.com',
    href: 'mailto:info@memoriesinprints.com',
    icon: (
      <img src="/images/icons/Outlook.svg" alt="" className="w-full h-full object-cover" aria-hidden="true" />
    ),
  },
  {
    label: 'Instagram',
    handle: '@memoriesinprints',
    href: 'https://www.instagram.com/memoriesin.prints/',
    external: true,
    icon: (
      <img src="/images/icons/Instagram.svg" alt="" className="w-full h-full object-cover" aria-hidden="true" />
    ),
  },
  {
    label: 'Facebook',
    handle: '/memoriesinprints',
    href: 'https://www.facebook.com/profile.php?id=61584548137585&sk=photos',
    external: true,
    icon: (
      <img src="/images/icons/Facebook.svg" alt="" className="w-full h-full object-cover" aria-hidden="true" />
    ),
  },
  {
    label: 'LinkedIn',
    handle: '/memoriesinprints',
    href: 'https://www.linkedin.com/company/memoriesinprintseu/',
    external: true,
    icon: (
      <img src="/images/icons/Linkedin.svg" alt="" className="w-full h-full object-cover" aria-hidden="true" />
    ),
  },
];

interface ContactPageProps {
  searchParams: Promise<{ service?: string; details?: string; cart?: string }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { service, details, cart } = await searchParams;

  return (
    <main id="main-content" className="bg-bg-primary min-h-screen">
      {/* ── Page header — the dandelion photo as the hero's own background,
          not a separate strip below it. No divider after: HeroVideo's own
          gradient already blends into this page's bg-bg-primary. */}
      <HeroVideo
        image="/images/Quote-Banner.jpg"
        imagePosition="75% 45%"
        minHeightClassName="min-h-[360px] md:min-h-[400px] lg:min-h-[440px]"
        contentPaddingClassName="px-6 pt-28 pb-12 md:px-12 md:pt-32 md:pb-14 lg:px-20 lg:pt-36 lg:pb-16"
        overlayGradient="linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(253,252,250,0.08) 65%, rgba(253,252,250,0.18) 75%, rgba(253,252,250,0.32) 85%, rgba(253,252,250,0.5) 92%, rgba(253,252,250,0.75) 97%, #FDFCFA 100%)"
      >
        <span className="font-mono text-label uppercase tracking-wider text-text-heading">
          Request a Quote
        </span>
        <h1 className="mt-3 font-display text-display-lg text-text-heading max-w-xl">
          Start Your{' '}
          <em className="not-italic font-semibold text-text-heading">Project</em>
        </h1>
        <p className="mt-4 font-body text-body-lg text-text-heading max-w-lg">
          Tell us what you need — we respond within 24 hours.
        </p>
      </HeroVideo>

      {/* ── Form (left) + socials (right) ─────────────────────────── */}
      <section className="container-wide py-16">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1.6fr_1fr]">
          <QuoteForm initialService={service} initialDetails={details} fromCart={cart === '1'} />

          <aside className="lg:border-l lg:border-border lg:pl-16">
            <p className="font-mono text-base uppercase tracking-widest text-text-muted">
              Other ways to reach us
            </p>
            <div className="mt-6 flex flex-col gap-5">
              {CONTACTS.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.external ? '_blank' : undefined}
                  rel={c.external ? 'noopener noreferrer' : undefined}
                  className="group flex items-center gap-3 text-text-heading transition-all duration-200 hover:text-accent-gold"
                >
                  {/* Icon */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-border rounded-full overflow-hidden text-text-muted transition-all duration-200 group-hover:border-accent-gold group-hover:text-accent-gold">
                    {c.icon}
                  </span>
                  {/* Text */}
                  <span className="flex flex-col">
                    <span className="font-mono text-base uppercase tracking-wider text-text-muted">
                      {c.label}
                    </span>
                    <span className="font-body text-body-base leading-tight">
                      {c.handle}
                    </span>
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-border bg-cat-surface p-6">
              <p className="font-display text-lg italic text-accent-gold">
                We respond within 24 hours
              </p>
              <p className="mt-2 font-body text-base text-text-muted leading-relaxed">
                Every enquiry is read by a real person on the studio team — no
                automated replies, no waiting in a queue.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
