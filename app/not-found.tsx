'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

const LINKS = [
  { label: 'Return to Studio', href: '/', primary: true },
  { label: 'View Our Portfolio', href: '/portfolio', primary: false },
  { label: 'Browse Services', href: '/services', primary: false },
  { label: 'Get a Quote', href: '/contact', primary: false },
];

// Animated ink-bleed letters
function InkLetter({ char, delay }: { char: string; delay: number }) {
  return (
    <span
      className="inline-block"
      style={{
        animation: `inkBleed 1.4s ease forwards`,
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      {char}
    </span>
  );
}

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Subtle particle effect — scattered ink dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] =
      [];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.25 + 0.05,
      });
    }

    let rafId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(198, 168, 92, ${p.alpha})`; // gold
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      rafId = requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const digits = ['4', '0', '4'];

  return (
    <>
      <style>{`
        @keyframes inkBleed {
          0%   { opacity: 0; transform: scale(1.15) translateY(8px); filter: blur(8px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ruledLines {
          from { background-position: 0 0; }
          to   { background-position: 0 48px; }
        }
        .ruled {
          background-image: repeating-linear-gradient(
            180deg,
            transparent,
            transparent 47px,
            rgba(198,168,92,0.07) 47px,
            rgba(198,168,92,0.07) 48px
          );
          animation: ruledLines 4s linear infinite;
        }
        .fade-up { animation: fadeUp 0.7s ease forwards; }
      `}</style>

      <div
        className="ruled relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
        style={{ background: '#0E1117', color: '#F0EDE8' }}
      >
        {/* Ink particle canvas */}
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        />

        {/* Decorative corner marks — like print registration marks */}
        {[
          'top-6 left-6',
          'top-6 right-6',
          'bottom-6 left-6',
          'bottom-6 right-6',
        ].map((pos) => (
          <span
            key={pos}
            className={`absolute ${pos} h-4 w-4 opacity-20`}
            aria-hidden="true"
            style={{
              backgroundImage:
                'linear-gradient(#C6A85C 1px, transparent 1px), linear-gradient(90deg, #C6A85C 1px, transparent 1px)',
              backgroundSize: '100% 100%',
            }}
          />
        ))}

        {/* Studio label */}
        <p
          className="fade-up relative z-10 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30"
          style={{ animationDelay: '0ms' }}
        >
          Memories in Prints · Error
        </p>

        {/* 404 — large ink-bleed headline */}
        <div
          className="relative z-10 mt-8 select-none font-display leading-none"
          style={{
            fontSize: 'clamp(7rem, 25vw, 18rem)',
            letterSpacing: '-0.04em',
            color: '#C6A85C',
          }}
          aria-label="404"
        >
          {digits.map((d, i) => (
            <InkLetter key={i} char={d} delay={i * 120} />
          ))}
        </div>

        {/* Horizontal rule */}
        <div
          className="relative z-10 mt-8 h-px w-24 opacity-30"
          style={{ background: 'linear-gradient(90deg, transparent, #C6A85C, transparent)' }}
        />

        {/* Primary message */}
        <h1
          className="fade-up relative z-10 mt-8 font-display text-3xl font-light md:text-5xl"
          style={{
            animationDelay: '500ms',
            opacity: 0,
            letterSpacing: '-0.02em',
          }}
        >
          This page didn&rsquo;t{' '}
          <em className="italic" style={{ color: '#C6A85C' }}>
            make it to print.
          </em>
        </h1>

        {/* Sub-copy */}
        <p
          className="fade-up relative z-10 mt-6 max-w-md font-body leading-relaxed text-white/50"
          style={{ animationDelay: '700ms', opacity: 0 }}
        >
          The proof has been lost somewhere between brief and press. It happens even in the
          finest studios. Let&rsquo;s get you back on the right page.
        </p>

        {/* Navigation links */}
        <div
          className="fade-up relative z-10 mt-12 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: '900ms', opacity: 0 }}
        >
          {LINKS.map(({ label, href, primary }) =>
            primary ? (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 px-8 py-3.5 font-body text-sm uppercase tracking-widest transition-all duration-300 hover:opacity-90"
                style={{ background: '#C6A85C', color: '#0E1117' }}
              >
                {label}
              </Link>
            ) : (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-2 border px-6 py-3 font-body text-sm uppercase tracking-widest transition-all duration-300 hover:border-[#C6A85C] hover:text-[#C6A85C]"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
              >
                {label}
              </Link>
            )
          )}
        </div>

        {/* Footer note */}
        <p
          className="fade-up absolute bottom-8 z-10 font-mono text-[10px] uppercase tracking-widest text-white/15"
          style={{ animationDelay: '1100ms', opacity: 0 }}
        >
          Error 404 · Page not found · memoriesinprints.com
        </p>
      </div>
    </>
  );
}
