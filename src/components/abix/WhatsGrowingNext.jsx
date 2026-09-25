// src/components/abix/WhatsGrowingNext.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/abix/Eyebrow';
import { products } from '@/data/products';
import { ABIX } from './brandColors';
import ashwagandhaImg from '@/assets/home/products/ashwagandha.png';
import dayavedaImg from '@/assets/home/products/dayaveda.png';
import orthovedaImg from '@/assets/home/products/orthoveda.png';
import triphalaImg from '@/assets/home/products/triphala.png';

export default function WhatsGrowingNext() {
  const comingSoon = products.filter((p) => p.status === 'coming_soon');
  const sectionRef = useRef(null);
  const rowRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  const COMING_SOON_IMAGES = {
    ashwagandha: ashwagandhaImg,
    dayaveda: dayavedaImg,
    orthoveda: orthovedaImg,
    triphala: triphalaImg,
  };

  function resolveImage(p) {
    const key = p.name?.toLowerCase().replace(/\s+/g, '');
    return COMING_SOON_IMAGES[key] || p.image;
  }

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handleChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useGSAP(
    () => {
      const items = rowRef.current?.querySelectorAll('[data-reveal]');
      if (!items?.length) return;
      if (reduceMotion) {
        gsap.set(items, { opacity: 1, y: 0, scale: 1 });
        return;
      }
      gsap.set(items, { opacity: 0, y: 28, scale: 0.97 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: sectionRef, dependencies: [reduceMotion] }
  );

  if (comingSoon.length === 0) return null;

  return (
    // CHANGED: base is now a settled solid Dark Moss instead of a
    // Black Olive → Espresso diagonal wash. The full-section green-
    // to-brown sweep was the single most jarring color moment on the
    // page — earth tones now show up only as small warm glows behind
    // each product (a "clearing" per item) instead of recoloring the
    // whole section.
    <section
      id="growing"
      ref={sectionRef}
      className="relative py-24 lg:py-36 overflow-hidden grain"
      style={{ backgroundColor: ABIX.darkMoss }}
    >
      {/* REMOVED: the top fade-to-transparent strip that used to fade
          FROM ABIX.deep here — it never matched this section's own
          background underneath. SectionDivider now owns this seam in
          Home.jsx, matched to deep → darkMoss. */}

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-xl mb-16 lg:mb-24">
          <Eyebrow light>What's Next</Eyebrow>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
            What's growing next.
          </h2>
          <p className="mt-5 text-sm sm:text-base max-w-md" style={{ color: ABIX.ivory70 }}>
            A few more rituals are on their way, drawn from the same Himalayan tradition as the collection you already know.
          </p>
        </div>

        <div
          ref={rowRef}
          className="flex flex-col sm:flex-row sm:items-end gap-10 sm:gap-8 lg:gap-14"
        >
          {comingSoon.map((p, i) => (
            <div
              key={p.id}
              data-reveal
              className="relative flex-1 sm:max-w-[280px]"
              style={{
                marginBottom: i % 2 === 1 ? 'clamp(0px, 4vw, 48px)' : 0,
              }}
            >
              {/* NEW — the "warm clearing": a soft, localized glow behind
                  each product image only, blending Espresso/Walnut into
                  this otherwise-green section as a small earth pocket,
                  not a section-wide wash. */}
              <div
                aria-hidden="true"
                className="absolute -inset-x-6 -inset-y-8 -z-10"
                style={{
                  background: `radial-gradient(60% 60% at 50% 40%, ${ABIX.walnut}55 0%, ${ABIX.espresso}22 45%, transparent 75%)`,
                }}
              />

              <div className="overflow-hidden">
                <img
                  src={resolveImage(p)}
                  alt={p.name}
                  className="w-full h-auto object-contain"
                  style={{ filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.35))' }}
                  draggable={false}
                />
              </div>

              <div className="mt-6 flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl tracking-tight" style={{ color: ABIX.ivory }}>
                  {p.name}
                </h3>
                <span
                  className="shrink-0 text-[10px] font-semibold uppercase tracking-luxe-sm"
                  style={{ color: ABIX.gold }}
                >
                  Coming Soon
                </span>
              </div>
              {p.tagline && (
                <p className="mt-1.5 text-sm" style={{ color: ABIX.ivory45 }}>
                  {p.tagline}
                </p>
              )}
              <div className="mt-4 h-px w-full" style={{ backgroundColor: ABIX.ivory12 }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}