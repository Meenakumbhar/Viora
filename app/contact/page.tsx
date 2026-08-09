import type { Metadata } from 'next';
import QuoteForm from '@/components/ui/QuoteForm';

export const metadata: Metadata = {
  title: 'Get a Quote',
  description: 'Request a quote from Memories in Prints. Wedding stationery, funeral print, sports programmes, branding, and more — tell us about your project.',
};

const CONTACTS = [
  {
    label: 'Email',
    handle: 'hello@memoriesinprints.com',
    href: 'mailto:hello@memoriesinprints.com',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 7 10 7 10-7" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    handle: '@memoriesinprints',
    href: 'https://instagram.com/memoriesinprints',
    external: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    handle: '/memoriesinprints',
    href: 'https://facebook.com/memoriesinprints',
    external: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    handle: '/memoriesinprints',
    href: 'https://linkedin.com/company/memoriesinprints',
    external: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
];

export default function ContactPage() {
  return (
    <main id="main-content" className="bg-bg-primary min-h-screen">
      {/* ── Page header ────────────────────────────────────────────── */}
      <div className="container-wide pt-32 pb-12">
        <span className="font-mono text-label uppercase tracking-wider text-accent-gold">
          Request a Quote
        </span>
        <h1 className="mt-3 font-display text-display-lg text-text-heading max-w-xl">
          Start your{' '}
          <em className="italic text-accent-gold">project</em>
        </h1>
        <p className="mt-4 font-body text-body-lg text-text-muted max-w-lg">
          Tell us what you need — we respond within 24 hours.
        </p>
      </div>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div className="border-t border-border" />

      {/* ── Form section ───────────────────────────────────────────── */}
      <section className="container-wide py-16 max-w-2xl">
        <QuoteForm />
      </section>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div className="border-t border-border" />

      {/* ── Contact strip ──────────────────────────────────────────── */}
      <section className="container-wide py-10" aria-label="Contact channels">
        <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Other ways to reach us
        </p>
        <div className="flex flex-wrap gap-x-8 gap-y-5">
          {CONTACTS.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target={c.external ? '_blank' : undefined}
              rel={c.external ? 'noopener noreferrer' : undefined}
              className="group flex items-center gap-3 text-text-heading transition-all duration-200 hover:text-accent-gold"
            >
              {/* Icon */}
              <span className="flex h-9 w-9 items-center justify-center border border-border rounded-full text-text-muted transition-all duration-200 group-hover:border-accent-gold group-hover:text-accent-gold">
                {c.icon}
              </span>
              {/* Text */}
              <span className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  {c.label}
                </span>
                <span className="font-body text-body-base leading-tight">
                  {c.handle}
                </span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
