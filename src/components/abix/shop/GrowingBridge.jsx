// src/components/abix/shop/GrowingBridge.jsx
//
// A short, quiet bridge from the reviews into "What's Growing Next": a gold
// stem draws as it is scrolled past and small buds open along it.
// Rendered only when there are upcoming products.
import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { useCatalog } from '@/lib/CatalogContext';
import Eyebrow from '@/components/abix/Eyebrow';
import { FOREST } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

const BUD = 'M0 0 C 7 -7 19 -7 25 0 C 19 7 7 7 0 0 Z';
const BUDS = [
  { x: 60, y: 160, r: -40 },
  { x: 60, y: 118, r: 215 },
  { x: 60, y: 78, r: -35 },
  { x: 60, y: 40, r: 210 },
];

export default function GrowingBridge() {
  const { comingSoonProducts, loading } = useCatalog();
  const show = !loading && comingSoonProducts.length > 0;
  const rootRef = useRef(null);

  useGSAP(
    (context) => {
      if (!show) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const stem = context.selector('[data-stem]')[0];
      const buds = context.selector('[data-bud]');
      if (!stem) return;

      gsap.set(stem, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(buds, { autoAlpha: 0, scale: 0.3, transformOrigin: '0% 50%' });

      const range = { trigger: rootRef.current, start: 'top 85%', end: 'bottom 55%', scrub: true };
      gsap.to(stem, { strokeDashoffset: 0, ease: 'none', scrollTrigger: range });
      gsap.to(buds, {
        autoAlpha: 1,
        scale: 1,
        stagger: 0.25,
        ease: 'none',
        scrollTrigger: { ...range, start: 'top 70%' },
      });
      gsap.fromTo(
        context.selector('[data-reveal]'),
        { autoAlpha: 0, y: 24 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 75%', once: true },
        }
      );
    },
    { scope: rootRef, dependencies: [show], revertOnUpdate: true }
  );

  if (!show) return null;

  return (
    <section
      ref={rootRef}
      aria-labelledby="bridge-title"
      className="relative overflow-hidden grain"
      style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deepest} 100%)` }}
    >
      <div className="relative z-10 mx-auto max-w-2xl px-6 pt-16 lg:pt-24 text-center">
        <div data-reveal className="flex justify-center">
          <Eyebrow light>Rooted in the same ground</Eyebrow>
        </div>
        <h2
          id="bridge-title"
          data-reveal
          className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight"
          style={{ color: ABIX.ivory }}
        >
          More is <span className="italic" style={{ color: ABIX.gold }}>growing.</span>
        </h2>
        <p data-reveal className="mt-4 mx-auto max-w-md text-sm sm:text-base" style={{ color: ABIX.ivory70 }}>
          Shilajit is only the beginning of the collection.
        </p>
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 120 220"
        className="relative z-10 mx-auto block h-40 sm:h-52 w-auto"
        fill="none"
      >
        <path
          data-stem
          pathLength="1"
          d="M60 220 C 60 170, 52 130, 60 90 S 68 30, 60 0"
          stroke={ABIX.gold}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {BUDS.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.r})`}>
            <path data-bud d={BUD} fill={ABIX.gold} fillOpacity="0.55" />
          </g>
        ))}
      </svg>
    </section>
  );
}