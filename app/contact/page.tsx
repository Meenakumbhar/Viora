import type { Metadata } from 'next';
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
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="container-wide pt-32 pb-12">
        <span className="font-mono text-label uppercase tracking-wider text-accent-gold">
          Request a Quote
        </span>
        <h1 className="mt-3 font-display text-display-lg text-text-heading max-w-xl">
          Start your{' '}
          <em className="not-italic font-semibold text-accent-gold">project</em>
        </h1>
        <p className="mt-4 font-body text-body-lg text-text-muted max-w-lg">
          Tell us what you need — we respond within 24 hours.
        </p>
      </div>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div className="border-t border-border" />

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
