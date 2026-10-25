// src/hooks/useInViewReveal.js
//
// Scroll reveals driven by IntersectionObserver, not stored scroll positions.
// It reacts to what is actually on screen, so it stays correct when fonts or
// images change the page height (the cause of reveals firing off-screen on
// phones). Mark elements inside the root with:
//   data-reveal  (+ data-reveal-delay="0.15", seconds) fade and rise
//   data-line    a gold rule draws in
//   data-clip    an image wipes open
//
// Content is visible by default: elements are only hidden from inside this
// effect, never under reduced motion, and a timer reveals anything in view that
// the observer missed. After an element has revealed, its reveal styles are
// removed so they cannot interfere with hover or other transforms.
// Reveals wait for the page transition's veil to lift before starting.
import { useLayoutEffect, useRef } from 'react';
import { whenPageReady } from '@/components/abix/PageTransition';

const SEL = '[data-reveal],[data-line],[data-clip]';

export const REVEAL_CSS = `
  [data-armed] { will-change: opacity, transform; }
  [data-reveal][data-armed] { opacity: 0; transform: translate3d(0, 26px, 0); }
  [data-line][data-armed] { transform: scaleX(0); transform-origin: 0 50%; }
  [data-clip][data-armed] { clip-path: inset(100% 0 0 0); }
  [data-reveal][data-armed].is-in {
    opacity: 1; transform: none;
    transition: opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0s), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--d, 0s);
  }
  [data-line][data-armed].is-in { transform: scaleX(1); transition: transform 1.1s cubic-bezier(0.76, 0, 0.24, 1) var(--d, 0s); }
  [data-clip][data-armed].is-in { clip-path: inset(0 0 0 0); transition: clip-path 1.2s cubic-bezier(0.76, 0, 0.24, 1) var(--d, 0s); }
  @media (prefers-reduced-motion: reduce) {
    [data-armed] { opacity: 1 !important; transform: none !important; clip-path: none !important; transition: none !important; }
  }
`;

// Lines and clipped images are observed through their parent, because an
// element's own scale/clip can make it count as "not intersecting".
const targetOf = (el) => (el.hasAttribute('data-line') || el.hasAttribute('data-clip') ? el.parentElement || el : el);

export function useInViewReveal(ref, deps = []) {
  const store = useRef({
    seen: new WeakSet(),
    armed: new Set(),
    owners: new Map(),
    io: null,
    timers: new Set(),
    stops: new Set(),
  });

  // Arm and observe any new elements (runs again when `deps` change).
  useLayoutEffect(() => {
    const root = ref.current;
    const s = store.current;
    if (!root || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

    const fresh = Array.from(root.querySelectorAll(SEL)).filter((el) => !s.seen.has(el));
    if (!fresh.length) return;

    const later = (fn, ms) => {
      const t = window.setTimeout(() => {
        s.timers.delete(t);
        fn();
      }, ms);
      s.timers.add(t);
    };

    const reveal = (el) => {
      if (!s.armed.has(el) || el.classList.contains('is-in')) return;
      el.classList.add('is-in');
      const d = Number(el.getAttribute('data-reveal-delay') || 0);
      later(() => {
        el.removeAttribute('data-armed');
        el.classList.remove('is-in');
        el.style.removeProperty('--d');
        s.armed.delete(el);
      }, 1500 + d * 1000);
    };

    const targets = new Set();
    fresh.forEach((el) => {
      s.seen.add(el);
      s.armed.add(el);
      el.setAttribute('data-armed', '');
      const d = el.getAttribute('data-reveal-delay');
      if (d) el.style.setProperty('--d', `${d}s`);
      const t = targetOf(el);
      if (!s.owners.has(t)) s.owners.set(t, new Set());
      s.owners.get(t).add(el);
      targets.add(t);
    });

    const begin = () => {
      if (!s.io) {
        s.io = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (!en.isIntersecting) return;
              s.io.unobserve(en.target);
              const set = s.owners.get(en.target);
              s.owners.delete(en.target);
              if (set) set.forEach(reveal);
            });
          },
          { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }
        );
      }
      targets.forEach((t) => s.io.observe(t));
      // Safety net: anything already on screen that the observer has not flagged.
      later(() => {
        fresh.forEach((el) => {
          if (!s.armed.has(el) || el.classList.contains('is-in')) return;
          const r = targetOf(el).getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) reveal(el);
        });
      }, 2500);
    };

    s.stops.add(whenPageReady(begin));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Full cleanup on unmount.
  useLayoutEffect(() => {
    const s = store.current;
    return () => {
      if (s.io) s.io.disconnect();
      s.io = null;
      s.timers.forEach((t) => window.clearTimeout(t));
      s.timers.clear();
      s.stops.forEach((stop) => stop());
      s.stops.clear();
      s.armed.forEach((el) => {
        el.removeAttribute('data-armed');
        el.classList.remove('is-in');
        el.style.removeProperty('--d');
      });
      s.armed.clear();
      s.owners.clear();
      s.seen = new WeakSet();
    };
  }, []);
}