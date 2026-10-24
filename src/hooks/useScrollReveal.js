// src/hooks/useScrollReveal.js
//
// Staggered fade-and-rise for any element inside `scopeRef` marked
// data-reveal (optional data-reveal-delay="0.15", in seconds).
// Content is visible by default: elements are only hidden here, inside the
// effect, and never when the visitor prefers reduced motion.
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';

export function useScrollReveal(scopeRef, { ready = true } = {}) {
  useGSAP(
    (context) => {
      if (!ready) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      context.selector('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 26 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            delay: Number(el.dataset.revealDelay || 0),
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });
    },
    { scope: scopeRef, dependencies: [ready], revertOnUpdate: true }
  );
}