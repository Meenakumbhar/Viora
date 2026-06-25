import type { Metadata } from 'next';
import Link from 'next/link';
import QuoteForm from '@/components/ui/QuoteForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Memories in Prints. Request a quote for wedding stationery, funeral print, sports programmes, branding, and more.',
};

export default function ContactPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Panel — Quote Form */}
      <div className="bg-bg-primary px-6 py-24 md:px-12 lg:px-20 lg:py-32">
        <h1 className="font-display text-display-lg text-text-primary">
          Start your <em className="italic text-accent-gold">project</em>
        </h1>
        <p className="mt-4 font-body text-body-lg text-text-muted">
          Tell us what you need. We respond within 24 hours.
        </p>

        <div className="mt-12">
          <QuoteForm />
        </div>
      </div>

      {/* Right Panel — Contact Info */}
      <div className="bg-bg-secondary px-6 py-24 md:px-12 lg:px-20 lg:py-32 border-t border-border lg:border-t-0 lg:border-l">
        <h2 className="font-display text-display-md text-text-primary">
          Other ways to <em className="italic text-accent-gold">reach us</em>
        </h2>

        {/* Email */}
        <div className="mt-12">
          <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
            Email
          </span>
          <a
            href="mailto:hello@memoriesinprints.com"
            className="mt-2 inline-block font-body text-body-lg text-text-primary transition-colors duration-300 hover:text-accent-gold"
          >
            hello@memoriesinprints.com
          </a>
        </div>

        {/* Response Time */}
        <div className="mt-8">
          <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
            Response Time
          </span>
          <p className="mt-2 font-body text-body-lg text-text-muted">
            We reply within 24 hours, usually much sooner.
          </p>
        </div>

        {/* Instagram */}
        <div className="mt-8">
          <span className="block font-mono text-label uppercase tracking-wider text-accent-gold">
            Instagram
          </span>
          <a
            href="https://instagram.com/memoriesinprints"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-body text-body-lg text-text-primary transition-colors duration-300 hover:text-accent-gold"
          >
            @memoriesinprints
          </a>
        </div>

        {/* Studio Note */}
        <div className="mt-12 border border-border p-6">
          <h3 className="font-display text-xl text-text-primary">
            Global studio
          </h3>
          <p className="mt-3 font-body text-body-base text-text-muted leading-relaxed">
            We are a remote studio serving clients worldwide. All communication is handled via email and video call. No physical showroom — but we ship sample packs on request.
          </p>
        </div>

        {/* FAQ Teaser */}
        <p className="mt-8 font-body text-body-base text-text-muted">
          Have a question? Check our{' '}
          <Link
            href="/pricing#faq"
            className="text-accent-gold link-underline font-medium"
          >
            frequently asked questions
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
