'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger outside the component if in browser env
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const obj = { val: 0 };
      gsap.fromTo(
        obj,
        { val: 0 },
        {
          val: end,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
          onUpdate: function () {
            if (el) {
              el.textContent = Math.round(obj.val) + suffix;
            }
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [mounted, end, suffix]);

  return <span ref={ref}>{end}{suffix}</span>;
}

export default CountUp;
