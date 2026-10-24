// src/hooks/useScrollReveal.js
//
// Scroll reveals for anything inside `scopeRef`:
//   data-reveal (+ optional data-reveal-delay="0.15", seconds) — fade and rise
//   data-line                                                  — gold rule draws in
//   data-clip                                                  — image wipes open
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

      context.selector('[data-line]').forEach((el) => {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: '0% 50%' },
          {
            scaleX: 1,
            duration: 1.1,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          }
        );
      });

      context.selector('[data-clip]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.2,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });
    },
    { scope: scopeRef, dependencies: [ready], revertOnUpdate: true }
  );
}