import type { Metadata } from 'next';
import LegalSections, { type LegalSection } from '@/components/ui/LegalSections';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'The terms and conditions governing orders, payments, revisions, delivery, and intellectual property for Memories in Prints.',
  robots: { index: false, follow: true },
};

const sections: LegalSection[] = [
  {
    heading: 'Introduction',
    paragraphs: [
      'Welcome to Memories in Prints. By accessing or using our services, you agree to comply with these Terms & Conditions. Please read them carefully before placing an order.',
    ],
    list: [
      'Registered company name: Viora Memories in Prints.',
      'Trading/brand name: Memories in Prints.',
    ],
  },
  {
    heading: 'Services Provided',
    list: [
      'We provide design, customisation, printing, and delivery services worldwide.',
      'All designs are created based on the details provided by the client.',
      'Final approval from the client is required before printing or delivery.',
    ],
  },
  {
    heading: 'Orders & Payments',
    list: [
      'Orders are confirmed only after full or agreed payment has been received.',
      'Pricing may vary depending on customisation, printing, and delivery requirements.',
      'All payments are non-refundable once the design work has started.',
    ],
  },
  {
    heading: 'Revisions & Approval',
    list: [
      'Clients are entitled to limited revisions, as per the package selected.',
      'Once a design is approved, Memories in Prints is not responsible for any errors — spelling, images, or content — overlooked by the client.',
    ],
  },
  {
    heading: 'Delivery & Timelines',
    list: [
      'We strive to deliver all projects on time, but delivery schedules may vary depending on order complexity, location, and third-party shipping providers.',
      'Memories in Prints is not liable for delays caused by courier or postal services.',
    ],
  },
  {
    heading: 'Intellectual Property',
    list: [
      'All original designs created by Memories in Prints remain our intellectual property until full payment is made.',
      'Clients may not resell, distribute, or reproduce our designs without written consent.',
    ],
  },
  {
    heading: 'Cancellations & Refunds',
    list: [
      'Cancellations are accepted only before the design process begins.',
      'Once design work has started, payments are non-refundable.',
      'Refunds, if any, are processed at the sole discretion of Memories in Prints.',
    ],
  },
  {
    heading: 'Limitation of Liability',
    paragraphs: ['While we ensure high-quality design and printing, Memories in Prints is not responsible for:'],
    list: [
      'Errors in client-provided information.',
      'Delays caused by external delivery services.',
      'Any indirect, incidental, or consequential damages arising from our services.',
    ],
  },
  {
    heading: 'Privacy & Confidentiality',
    list: [
      'Client information and uploaded content will be treated with strict confidentiality.',
      'We do not share or sell personal data to third parties.',
    ],
  },
  {
    heading: 'Governing Law',
    list: [
      'These Terms & Conditions are governed by and interpreted in accordance with applicable international service laws.',
      'Any disputes shall be subject to the jurisdiction of relevant legal authorities.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-bg-primary min-h-screen pt-28 pb-24 md:pb-36">
      <div className="container-wide max-w-3xl">
        <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
          Legal
        </span>
        <h1 className="mt-4 font-display text-display-lg text-text-primary">
          Terms & Conditions
        </h1>
        <p className="mt-4 font-body text-body-base text-text-muted leading-relaxed">
          These terms apply to every order placed with Memories in Prints, worldwide.
        </p>

        <LegalSections sections={sections} />
      </div>
    </div>
  );
}
