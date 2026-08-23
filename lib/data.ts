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

export const generalFaqs = [
  { question: 'What services does Memories in Prints provide?', answer: 'We specialise in memorial and funeral card designs, tribute templates, personalised graphic design services, printing and delivery solutions (available in select regions), and worldwide digital file delivery.' },
  { question: 'Do you provide services worldwide?', answer: 'Yes. Our digital design services are available globally. Printing and physical delivery are available in select countries. For international clients, we provide high-resolution digital files that can be printed locally.' },
  { question: 'How do I place an order?', answer: 'You can place an order directly through our website by selecting a template or requesting a custom design. Once details are confirmed and payment is received, our team will contact you to begin the project and keep you updated throughout.' },
  { question: 'How long does it take to receive my order?', answer: 'Digital designs are typically delivered within 1–3 business days, depending on complexity. Printed orders usually take 3–5 business days to produce, plus delivery time depending on your location.' },
  { question: 'What payment methods do you accept?', answer: 'We accept major international payment methods including credit/debit cards, PayPal, and bank transfers where applicable. International clients are responsible for any currency conversion or bank fees.' },
  { question: 'Can I request changes after I receive my design?', answer: 'Yes — minor revisions are included in your order. Major revisions, such as significant layout or content changes outside the agreed scope, may require additional charges.' },
  { question: 'Do you offer refunds?', answer: 'Digital services and custom designs are non-refundable once delivered, as they are personalised. Template sales are final. Printing orders can only be cancelled before production begins. If an error occurs on our part, we will correct or replace the design at no extra cost.' },
  { question: 'Will my personal information be safe?', answer: 'Absolutely. We take your privacy seriously — your information is only used to complete your order and improve our services. See our Privacy Policy for full details.' },
  { question: 'Can I use your designs for commercial purposes?', answer: 'By default, our designs are for personal use only. If you need a commercial licence — for resale or business use — please contact us for a tailored agreement.' },
  { question: 'How do I contact Memories in Prints?', answer: 'Email us at info@memoriesinprints.com or call 8421210204. We offer worldwide online and remote support.' },
];

export const pricingFaqs = [
  { question: 'Are prices listed inclusive of VAT?', answer: 'All prices shown exclude VAT. VAT is added at the applicable rate for UK clients. International orders are zero-rated for VAT purposes.' },
  { question: 'Is shipping included in the price?', answer: 'Shipping is calculated separately at quote stage based on destination, weight, and your preferred delivery speed. We always provide the full cost upfront.' },
  { question: 'Can I get an exact quote before committing?', answer: 'Absolutely. Every enquiry receives a detailed, no-obligation quote within 24 hours. We break down costs so you know exactly what you are paying for.' },
  { question: 'Do you offer discounts for bulk orders?', answer: 'Yes. Volume pricing is available for larger print runs. The more you order, the lower the per-unit cost. Ask us for a bulk quote.' },
  { question: 'What payment methods do you accept?', answer: 'We accept bank transfer, credit/debit card, and PayPal. Payment terms are typically 50% deposit upfront, with the balance due on approval.' },
  { question: 'What is your refund policy?', answer: 'If you are not satisfied with the quality of the final printed product, we will reprint at no additional cost. Design fees for completed work are non-refundable.' },
];
