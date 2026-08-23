'use client';

import { motion } from 'framer-motion';

export function AnimatedHeadline({
  text,
  className = '',
  accentWord = '',
}: {
  text: string;
  className?: string;
  accentWord?: string;
}) {
  const words = text.split(' ');

  return (
    <h1 className={className}>
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
    </h1>
  );
}

export default AnimatedHeadline;
