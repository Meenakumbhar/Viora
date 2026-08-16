'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Pure side-effect component — no markup of its own. Lets the hero section
// stay part of the server-rendered page while this one small client island
// handles the scroll-linked parallax fade on `.hero-content`.
export default function HeroScrollEffect() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to('.hero-content', {
        y: -60,
        opacity: 0,
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: '40% top',
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  return null;
}
