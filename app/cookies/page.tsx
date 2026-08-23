import type { Metadata } from 'next';
import LegalSections, { type LegalSection } from '@/components/ui/LegalSections';

export const metadata: Metadata = {
  title: 'Cookies Policy',
  description: 'How Memories in Prints uses cookies and similar technologies on our website.',
  robots: { index: false, follow: true },
};

const sections: LegalSection[] = [
  {
    heading: 'Introduction',
    paragraphs: [
      'This Cookies Policy explains how Memories in Prints uses cookies and similar technologies on our website. By using our site, you agree to the use of cookies as described in this policy.',
    ],
  },
  {
    heading: 'What Are Cookies?',
    paragraphs: [
      'Cookies are small text files stored on your device when you visit a website.',
      'They help websites remember your preferences and improve your browsing experience.',
    ],
  },
  {
    heading: 'Types of Cookies We Use',
    list: [
      'Essential cookies: required for the operation of our website, e.g. login and checkout.',
      'Performance cookies: help us analyse how visitors use our site so we can improve it.',
      'Functional cookies: allow us to remember your preferences, e.g. language and region.',
      'Advertising cookies: used to deliver relevant ads based on your browsing activity.',
    ],
  },
  {
    heading: 'Why We Use Cookies',
    list: [
      'To ensure secure and smooth functionality of our services.',
      'To improve website performance and user experience.',
      'To personalise content and remember your choices.',
      'To analyse traffic and understand user behaviour.',
    ],
  },
  {
    heading: 'Managing Cookies',
    paragraphs: [
      'Most browsers allow you to control or block cookies through settings. You can delete cookies stored on your device at any time. Please note that disabling cookies may affect the functionality of certain features.',
    ],
  },
  {
    heading: 'Third-Party Cookies',
    paragraphs: [
      'We may use third-party tools, such as analytics and advertising platforms, that set cookies. These third parties are responsible for their own cookie practices.',
    ],
  },
  {
    heading: 'Updates to This Policy',
    paragraphs: [
      'We may update this Cookies Policy from time to time. Any changes will be posted here with the updated effective date.',
    ],
  },
  {
    heading: 'Contact Us',
    paragraphs: [
      'If you have any questions about our Cookies Policy, please contact us at info@memoriesinprints.com.',
    ],
  },
];

export default function CookiesPage() {
  return (
    <div className="bg-bg-primary min-h-screen pt-28 pb-24 md:pb-36">
      <div className="container-wide max-w-3xl">
        <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
          Legal
        </span>
        <h1 className="mt-4 font-display text-display-lg text-text-primary">
          Cookies Policy
        </h1>
        <p className="mt-4 font-body text-body-base text-text-muted leading-relaxed">
          How Memories in Prints uses cookies and similar technologies on this website.
        </p>

        <LegalSections sections={sections} />
      </div>
    </div>
  );
}
