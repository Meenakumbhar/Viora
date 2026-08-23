import type { Testimonial, ProcessStep } from '@/types/database';

// ─── TESTIMONIALS ────────────────────────────────────────────────────────────

export const testimonials: Testimonial[] = [
  {
    quote: 'Absolutely stunning designs. The team was very helpful in guiding me through the process.',
    name: 'David Smith',
    location: 'London, UK',
  },
  {
    quote: 'I found the perfect tribute for my father. The quality exceeded my expectations.',
    name: 'Emily Davis',
    location: 'Dallas, TX',
  },
  {
    quote: 'Professional, beautiful, and compassionate service. Highly recommend',
    name: 'Amelia brown',
    location: 'Melbourne, Australia',
  },
  {
    quote: 'Very smooth process and such heartfelt designs. I am truly grateful.',
    name: 'Jame Lee',
    location: 'London, UK',
  },
  {
    quote: 'The templates were beautiful and easy to customize. It made a difficult time much more comforting.',
    name: 'Sarah Johnson',
    location: 'Edinburgh, UK',
  },
];

// ─── PROCESS STEPS ───────────────────────────────────────────────────────────

export const processSteps: ProcessStep[] = [
  {
    number: 1,
    title: 'Enquire',
    description: 'Fill in the quote form with your project details. Tell us what you need, when you need it, and any style preferences. We respond within 24 hours — usually much sooner.',
    timeframe: 'Day 1',
  },
  {
    number: 2,
    title: 'Brief',
    description: 'We confirm your requirements, timeline, and style direction. If helpful, we arrange a short call to discuss the finer details. No commitment required at this stage.',
    timeframe: 'Day 1–2',
  },
  {
    number: 3,
    title: 'Design',
    description: 'Your first proof is delivered as a high-resolution PDF. We walk you through the design choices and welcome your feedback. Revisions are included as standard.',
    timeframe: 'Day  2-3',
  },
  {
    number: 4,
    title: 'Approve',
    description: 'Once you are happy, sign off the final proof. We run a pre-flight check on every file before it goes to print — nothing leaves the studio without a final review.',
    timeframe: 'Day 3-4',
  },
  {
    number: 5,
    title: 'Deliver',
    description: 'Printed items ship tracked worldwide. Digital files are sent directly via email. You receive a confirmation with tracking details and an estimated arrival date.',
    timeframe: 'Day 4-6',
  },
];

// ─── FAQ DATA ────────────────────────────────────────────────────────────────

export const pricingFaqs = [
  { question: 'Are prices listed inclusive of VAT?', answer: 'All prices shown exclude VAT. VAT is added at the applicable rate for UK clients. International orders are zero-rated for VAT purposes.' },
  { question: 'Is shipping included in the price?', answer: 'Shipping is calculated separately at quote stage based on destination, weight, and your preferred delivery speed. We always provide the full cost upfront.' },
  { question: 'Can I get an exact quote before committing?', answer: 'Absolutely. Every enquiry receives a detailed, no-obligation quote within 24 hours. We break down costs so you know exactly what you are paying for.' },
  { question: 'Do you offer discounts for bulk orders?', answer: 'Yes. Volume pricing is available for larger print runs. The more you order, the lower the per-unit cost. Ask us for a bulk quote.' },
  { question: 'What payment methods do you accept?', answer: 'We accept bank transfer, credit/debit card, and PayPal. Payment terms are typically 50% deposit upfront, with the balance due on approval.' },
  { question: 'What is your refund policy?', answer: 'If you are not satisfied with the quality of the final printed product, we will reprint at no additional cost. Design fees for completed work are non-refundable.' },
];
