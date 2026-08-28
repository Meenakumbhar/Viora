'use client';

import { motion } from 'framer-motion';

export function AnimatedHeadline({
  text,
  className = '',
  accentWord = '',
  as: Tag = 'h1',
}: {
  text: string;
  className?: string;
  accentWord?: string;
  // A page should only ever have one real <h1> — pass as="h2" (etc.) for
  // every other headline on the page so heading levels stay sequential.
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}) {
  const words = text.split(' ');

  return (
    <Tag className={className}>
      {words.map((word, i) => {
        // Normalize checking for accent word (e.g. remove trailing punctuation if any)
        const isAccent = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') === accentWord.toLowerCase();
        
        return (
          <motion.span
            key={i}
            style={{ display: 'inline-block', marginRight: '0.25em' }}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            {isAccent ? (
              <em
                className="not-italic font-semibold text-accent-gold"
                style={{ color: 'var(--color-accent-gold)', fontStyle: 'normal' }}
              >
                {word}
              </em>
            ) : (
              word
            )}
          </motion.span>
        );
      })}
    </Tag>
  );
}

export default AnimatedHeadline;
