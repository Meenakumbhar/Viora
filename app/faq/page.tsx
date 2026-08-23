import type { Metadata } from 'next';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import { generalFaqs } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description: 'Answers to common questions about ordering, worldwide delivery, payment, revisions, refunds, and how to reach Memories in Prints.',
};

export default function FaqPage() {
  return (
    <div className="bg-bg-primary min-h-screen pt-28 pb-24 md:pb-36">
      <div className="container-wide max-w-3xl">
        <span className="font-mono text-label uppercase text-accent-gold tracking-wider">
          Support
        </span>
        <h1 className="mt-4 font-display text-display-lg text-text-primary">
          Frequently asked <em className="not-italic font-semibold text-accent-gold">questions</em>
        </h1>
        <p className="mt-4 font-body text-body-lg text-text-muted leading-relaxed">
          Everything you need to know about ordering, worldwide delivery, payment, and revisions. Can&apos;t find your answer?{' '}
          <Button variant="text" href="/contact">Get in touch</Button>.
        </p>

        <div className="mt-12 border-t border-border pt-4">
          <Accordion items={generalFaqs} />
        </div>
      </div>
    </div>
  );
}
