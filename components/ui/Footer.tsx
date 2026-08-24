import Link from 'next/link';
import Logo from '@/components/ui/Logo';

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER DATA
   ═══════════════════════════════════════════════════════════════════════════ */

interface FooterLink {
  label: string;
  href: string;
}

const STUDIO_LINKS: FooterLink[] = [
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Process', href: '/process' },
  { label: 'About Us', href: '/about' },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Turnaround Times', href: '/process' },
  { label: 'FAQ', href: '/faq' },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Cookies Policy', href: '/cookies' },
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

function FacebookIcon() {
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
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.5l.5-4h-4V7a1 1 0 0 1 1-1h3z" />
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
            <Link href="/" className="flex items-center">
              <Logo
                wordmark="Memories in Prints"
                containerWidth={240}
                containerHeight={60}
                textClassName="font-display font-light text-2xl text-dark-text-primary"
              />
            </Link>
            <p className="font-body text-body-base text-dark-text-muted mt-4">
              A full-service design and print studio.
              <br />
              Serving families, brands, and clubs worldwide.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4 mt-6">
              <a
                href="https://www.instagram.com/memoriesin.prints/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-dark-text-muted hover:text-accent-gold transition-colors"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61584548137585&sk=photos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-dark-text-muted hover:text-accent-gold transition-colors"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.linkedin.com/company/122754103/admin/dashboard/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-dark-text-muted hover:text-accent-gold transition-colors"
              >
                <LinkedInIcon />
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
          <p className="font-body text-base text-dark-text-muted">
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
