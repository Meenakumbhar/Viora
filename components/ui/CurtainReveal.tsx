'use client';

import { motion } from 'framer-motion';

export function CurtainReveal({
  children,
  color = '#C6A85C',
  delay = 0,
  className = '',
  style = {},
}: {
  children: React.ReactNode;
  color?: string;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-block',
        ...style,
      }}
    >
      {children}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background: color,
          transformOrigin: 'left',
        }}
        initial={{ scaleX: 1 }}
        whileInView={{ scaleX: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay, ease: [0.77, 0, 0.18, 1] as any }}
      />
    </div>
  );
}

export default CurtainReveal;
