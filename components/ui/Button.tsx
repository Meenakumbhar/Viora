'use client';

import Link from 'next/link';
import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

const MotionLink = motion.create(Link);

type ButtonVariant = 'primary' | 'ghost' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  href?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-gold text-bg-primary hover:bg-accent-gold-hover',
  ghost:
    'border border-accent-gold text-accent-gold bg-transparent hover:bg-accent-gold hover:text-bg-primary',
  text:
    'border-none bg-transparent text-accent-gold link-underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-body-base',
  lg: 'px-8 py-4 text-body-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  href,
  className = '',
  type = 'button',
  disabled = false,
  onClick,
  ...rest
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center',
    'font-body font-medium uppercase tracking-wider text-label',
    'transition-all duration-300',
    'focus-visible:ring-2 focus-visible:ring-cat-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
    'disabled:opacity-50 disabled:pointer-events-none',
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (href) {
    const isExternal = href.startsWith('http');

    if (isExternal) {
      return (
        <motion.a
          href={href}
          className={base}
          rel="noopener noreferrer"
          target="_blank"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {children}
        </motion.a>
      );
    }

    return (
      <MotionLink
        href={href}
        className={base}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type={type}
      className={base}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...(rest as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
}
