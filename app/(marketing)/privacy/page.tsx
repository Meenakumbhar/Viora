import type { Metadata } from 'next';
import Link from 'next/link';
import LegalSections, { type LegalSection } from '@/components/ui/LegalSections';

export const metadata: Metadata = {
  title: 'Privacy & Refund Policy',
  description: 'How Memories in Prints collects, uses, and protects your information, and our refund and cancellation terms for services offered worldwide.',
  robots: { index: false, follow: true },
};

const sections: LegalSection[] = [
  {
    heading: 'Information We Collect',
    paragraphs: [
      'At Memories in Prints, we value your privacy and are committed to protecting your personal information. This policy explains how we collect, use, and safeguard your data, as well as our refund and cancellation terms for services offered worldwide.',
    ],
    list: [
      'Personal information: name, email address, phone number, billing and shipping address.',
      'Order details: text, images, and files you provide for your design projects.',
      'Payment information: processed securely through third-party payment providers — we do not store credit card details.',
      'Technical information: IP address, browser type, device information, and website usage data.',
    ],
  },
  {
    heading: 'How We Use Your Information',
    paragraphs: ['We use your information to:'],
    list: [
      'Process and deliver your orders.',
      'Communicate with you about your projects, payments, and updates.',
      'Improve our services and customer experience.',
      'Send marketing and promotional content, only if you opt in.',
      'Comply with legal obligations and prevent fraudulent activity.',
    ],
  },
  {
    heading: 'Sharing of Information',
    paragraphs: ['We do not sell or rent your data. We may share your information with:'],
    list: [
      'Service providers: payment processors, shipping partners, and IT support.',
      'Legal authorities: if required by law, regulation, or legal process.',
    ],
  },
  {
    heading: 'Data Security',
    paragraphs: [
      'We implement strict security measures to protect your information against unauthorised access, alteration, or disclosure.',
      'However, no internet-based service is 100% secure. By using our services, you acknowledge the inherent risks of online data transmission.',
    ],
  },
  {
    heading: 'International Clients',
    paragraphs: [
      'Since we provide services worldwide, your data may be transferred and stored outside your home country. We ensure that appropriate safeguards are in place to protect your data in compliance with international privacy laws.',
    ],
  },
  {
    heading: 'Your Rights',
    paragraphs: ['Depending on your location, you may have the right to:'],
    list: [
      'Access the personal data we hold about you.',
      'Request corrections or updates.',
      'Request deletion of your data.',
      'Opt out of marketing communications.',
      'Request a copy of your data (data portability).',
    ],
  },
  {
    heading: 'Cookies & Tracking',
    paragraphs: [
      'Our website may use cookies and similar technologies to enhance user experience and analyse website performance. You can disable cookies in your browser settings, but some features may not function properly.',
    ],
  },
  {
    heading: 'Refund & Cancellation Policy',
    list: [
      'Digital services & custom designs: non-refundable once delivered, as these are personalised and created specifically for each client.',
      'Template purchases: digital template sales are final and non-refundable.',
      'Printing orders: can only be cancelled before production begins. Once printing is in progress, cancellations are not possible.',
      'Errors & corrections: if an error occurs on our part, we will provide a correction, replacement, or appropriate resolution at no extra cost.',
      'Refund processing: approved refunds, where applicable, are processed within 7–10 business days to the original payment method.',
    ],
  },
  {
    heading: 'Changes to This Policy',
    paragraphs: [
      'We may update this Privacy & Refund Policy from time to time. Updates will be posted on this page with a new effective date.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-bg-primary min-h-screen pt-28 pb-24 md:pb-36">
      <div className="container-wide max-w-3xl">
        <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
          Legal
        </span>
        <h1 className="mt-4 font-display text-display-lg text-text-primary">
          Privacy & Refund Policy
        </h1>
        <p className="mt-4 font-body text-body-base text-text-muted leading-relaxed">
          To exercise any of your rights described below, contact us at{' '}
          <a href="mailto:support@memoriesinprints.com" className="text-accent-gold link-underline">
            support@memoriesinprints.com
          </a>
          . For the full detail on how we use cookies, see our{' '}
          <Link href="/cookies" className="text-accent-gold link-underline">
            Cookies Policy
          </Link>
          .
        </p>

        <LegalSections sections={sections} />
      </div>
    </div>
  );
}
