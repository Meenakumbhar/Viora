import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER DATA
   ═══════════════════════════════════════════════════════════════════════════ */

interface FooterLink {
  label: string;
  href: string;
}

const STUDIO_LINKS: FooterLink[] = [
  { label: 'Services', href: '/services' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Process', href: '/process' },
  { label: 'About', href: '/about' },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: 'Contact', href: '/contact' },
  { label: 'Turnaround Times', href: '/process' },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Sitemap', href: '/sitemap.xml' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   SOCIAL ICONS
   ═══════════════════════════════════════════════════════════════════════════ */

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.182-.78 1.172-4.97 1.172-4.97s-.299-.6-.299-1.486c0-1.39.806-2.428 1.81-2.428.853 0 1.264.64 1.264 1.408 0 .858-.546 2.14-.828 3.33-.236.995.5 1.807 1.48 1.807 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.134-4.515 4.34 0 .859.33 1.781.744 2.282a.3.3 0 0 1 .069.287l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.937.29 1.931.446 2.962.446 5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LINK COLUMN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <h3 className="font-body text-label uppercase tracking-wider text-accent-gold mb-6">
        {heading}
      </h3>
      <ul className="space-y-0">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="block py-1.5 font-body text-body-base text-dark-text-muted hover:text-dark-text-primary transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function Footer() {
  return (
    <footer className="bg-dark-bg-secondary border-t border-dark-border">
      <div className="container-wide py-20 md:py-24">
        {/* ── 4-Column Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1 — Brand */}
          <div>
            <Link
              href="/"
              className="font-display font-light text-xl text-dark-text-primary"
            >
              Memories in Prints
            </Link>
            <p className="font-body text-body-base text-dark-text-muted mt-4">
              A full-service design and print studio.
              <br />
              Serving families, brands, and clubs worldwide.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-dark-text-muted hover:text-accent-gold transition-colors"
              >
                <InstagramIcon />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-dark-text-muted hover:text-accent-gold transition-colors"
              >
                <LinkedInIcon />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pinterest"
                className="text-dark-text-muted hover:text-accent-gold transition-colors"
              >
                <PinterestIcon />
              </a>
            </div>
          </div>

          {/* Column 2 — Studio */}
          <FooterColumn heading="Studio" links={STUDIO_LINKS} />

          {/* Column 3 — Support */}
          <FooterColumn heading="Support" links={SUPPORT_LINKS} />

          {/* Column 4 — Legal */}
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>

        {/* ── Bottom Bar ─────────────────────────────────────────────── */}
        <div className="border-t border-dark-border mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-sm text-dark-text-muted">
            &copy; 2026 Memories in Prints &middot; Worldwide design &amp; print
          </p>
          <p className="font-mono text-label text-dark-text-muted">
            memoriesinprints.com
          </p>
        </div>
      </div>
    </footer>
  );
}
