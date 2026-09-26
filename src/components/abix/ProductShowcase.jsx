// src/components/abix/ProductShowcase.jsx
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { featuredProduct } from '@/data/products';
import productShowcaseBg from '@/assets/home/productShowcase_bg.png';
import shilajitJarImg from '@/assets/home/products/shilajit-jar-cutout.png';
import ashwagandhaImg from '@/assets/home/products/ashwagandha-jar-cutout.svg';
import triphalaImg from '@/assets/home/products/triphala-jar-cutout.svg';
import { ABIX } from './brandColors';

const SHOWCASE_PRODUCTS = [
  {
    id: 'shilajit',
    name: 'Shilajit',
    tagline: featuredProduct?.tagline || 'Ancient origin. Modern experience.',
    image: shilajitJarImg,
  },
  { id: 'triphala', name: 'Triphala', tagline: 'Herbal daily wellness', image: triphalaImg },
  { id: 'ashwagandha', name: 'Ashwagandha', tagline: 'Adaptogenic wellness', image: ashwagandhaImg },
];

const ROTATE_MS = 3000;

export default function ProductShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handleChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % SHOWCASE_PRODUCTS.length);
    }, ROTATE_MS);
    return () => clearInterval(timerRef.current);
  }, [reduceMotion]);

  const active = SHOWCASE_PRODUCTS[activeIndex];

  return (
    // CHANGED: flat Obsidian, not a multi-stop gradient. Its top exactly
    // matches Hero's bottom, and its bottom exactly matches What's
    // Growing Next's new top — no gradient math for anything to
    // misalign against.
    <section className="relative w-full py-20 lg:py-28 overflow-hidden" style={{ backgroundColor: ABIX.obsidian }}>
      <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10 text-center mb-12 lg:mb-16">
        <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
          The Collection
        </span>
        <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
          One ritual. A growing family.
        </h2>
      </div>

      {/* CHANGED: no more edge mask on this box — that was the source
          of the visible seam (its own overlay never reliably matched
          whatever color sat behind it at the fade point). It now just
          sits as a normal rectangle on the flat Obsidian section —
          simple, and there's nothing left for it to misalign with. */}
      <div
        className="relative w-full mx-auto max-w-[1600px] abix-stage"
        style={{
          backgroundImage: `url(${productShowcaseBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* CHANGED: darker, greener overlay tint (deep botanical into
            espresso, both darkened) instead of the previous lighter,
            more olive-reading mix. */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background: `linear-gradient(180deg, rgba(18,28,18,0.45) 0%, rgba(28,20,15,0.65) 100%)`,
          }}
          aria-hidden="true"
        />

        <div className="abix-glow" aria-hidden="true" />

        <div className="abix-platform">
          <AnimatePresence mode="wait">
            <motion.img
              key={active.id}
              src={active.image}
              alt={active.name}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 22 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: -12 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-auto select-none"
              style={{ filter: 'drop-shadow(0 22px 24px rgba(0,0,0,0.5))' }}
              draggable={false}
            />
          </AnimatePresence>
          <div className="abix-contact-shadow" aria-hidden="true" />
        </div>

        <div className="abix-info" role="status" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="font-display text-3xl sm:text-4xl tracking-tight" style={{ color: ABIX.ivory }}>
                {active.name}
              </h3>
              <p className="mt-2 text-sm sm:text-base" style={{ color: ABIX.ivory70 }}>
                {active.tagline}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-col gap-2 items-start">
            {SHOWCASE_PRODUCTS.map((p, i) => {
              const isActive = i === activeIndex;
              return (
                <div key={p.id} className="flex items-center gap-3">
                  <span
                    className="block h-[2px] transition-all duration-500"
                    style={{ width: isActive ? '28px' : '14px', backgroundColor: isActive ? ABIX.gold : ABIX.ivory25 }}
                  />
                  <span
                    className="text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-500"
                    style={{ color: isActive ? ABIX.ivory : ABIX.ivory45 }}
                  >
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .abix-stage { aspect-ratio: 21 / 10; min-height: 460px; }

        .abix-platform {
          position: absolute; z-index: 2; left: 50%; top: 68%;
          transform: translate(-50%, -78%);
          width: clamp(120px, 15vw, 210px);
        }

        .abix-contact-shadow {
          position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%);
          width: 70%; height: 14px; border-radius: 999px;
          background: radial-gradient(closest-side, rgba(28,20,15,0.55), transparent 75%);
        }

        .abix-glow {
          position: absolute; z-index: 1; left: 50%; top: 66%;
          transform: translate(-50%, -50%);
          width: clamp(220px, 26vw, 380px); height: clamp(220px, 26vw, 380px);
          border-radius: 9999px;
          background: radial-gradient(closest-side, ${ABIX.gold25}, transparent 72%);
          filter: blur(8px); pointer-events: none;
        }

        .abix-info {
          position: absolute; z-index: 3; left: 76%; top: 55%;
          transform: translate(-50%, -50%);
          max-width: 260px; text-align: left;
        }

        @media (max-width: 767px) {
          .abix-stage { aspect-ratio: 3 / 4; min-height: 420px; }
          .abix-platform { left: 50%; top: 58%; transform: translate(-50%, -60%); width: clamp(110px, 34vw, 160px); }
          .abix-glow { left: 50%; top: 56%; }
          .abix-info { left: 50%; top: auto; bottom: 6%; transform: translateX(-50%); text-align: center; max-width: 88%; }
          .abix-info > div:last-child { align-items: center; }
        }
      `}</style>
    </section>
  );
}