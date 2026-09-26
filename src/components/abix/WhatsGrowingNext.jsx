// src/components/abix/WhatsGrowingNext.jsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import Eyebrow from '@/components/abix/Eyebrow';
import { products } from '@/data/products';
import { ABIX } from './brandColors';
import ashwagandhaImg from '@/assets/home/products/ashwagandha.png';
import dayavedaImg from '@/assets/home/products/dayaveda.png';
import orthovedaImg from '@/assets/home/products/orthoveda.png';
import triphalaImg from '@/assets/home/products/triphala.png';

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

// NEW — a single card is now its own component with hover state, so
// each image/frame/label reacts independently instead of the row
// being one flat static grid of "stickers."
function GrowingCard({ p, offset }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      data-reveal
      className="relative flex-1 sm:max-w-[280px] cursor-default"
      style={{ marginBottom: offset }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow behind the frame — intensifies on hover instead of
          sitting at one static intensity. */}
      <div
        aria-hidden="true"
        className="absolute -inset-x-6 -inset-y-8 -z-10 transition-opacity duration-500"
        style={{
          background: `radial-gradient(60% 60% at 50% 40%, ${ABIX.gold25} 0%, rgba(42,33,27,0.35) 45%, transparent 75%)`,
          opacity: hovered ? 1 : 0.55,
        }}
      />

      <div className="relative overflow-hidden">
        <motion.img
          src={resolveImage(p)}
          alt={p.name}
          className="w-full h-auto object-contain"
          style={{ filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.35))' }}
          draggable={false}
          animate={{ scale: hovered ? 1.06 : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Quiet-luxury corner brackets, same device used on the
            product detail page — fade in on hover instead of the
            image just sitting there inert. */}
        {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map(
          (pos) => (
            <span
              key={pos}
              className={`absolute ${pos} w-4 h-4 pointer-events-none transition-opacity duration-500`}
              style={{ borderColor: ABIX.gold, opacity: hovered ? 0.8 : 0 }}
            />
          )
        )}
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h3
          className="font-display text-xl tracking-tight transition-colors duration-400"
          style={{ color: hovered ? ABIX.goldLight : ABIX.ivory }}
        >
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

      {/* Underline now sweeps in from the left on hover instead of
          sitting as a static full-width rule. */}
      <div className="mt-4 h-px w-full relative overflow-hidden" style={{ backgroundColor: ABIX.ivory12 }}>
        <span
          className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{
            width: hovered ? '100%' : '0%',
            background: ABIX.gold,
            transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
    </div>
  );
}

export default function WhatsGrowingNext() {
  const comingSoon = products.filter((p) => p.status === 'coming_soon');
  const sectionRef = useRef(null);
  const rowRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

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
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none none' },
      });
    },
    { scope: sectionRef, dependencies: [reduceMotion] }
  );

  if (comingSoon.length === 0) return null;

  return (
        <section
      id="growing"
      ref={sectionRef}
      className="relative py-24 lg:py-36 overflow-hidden grain"
      style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${ABIX.deep} 35%, ${ABIX.deep} 65%, ${ABIX.obsidian} 100%)` }}
    >
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

        <div ref={rowRef} className="flex flex-col sm:flex-row sm:items-end gap-10 sm:gap-8 lg:gap-14">
          {comingSoon.map((p, i) => (
            <GrowingCard key={p.id} p={p} offset={i % 2 === 1 ? 'clamp(0px, 4vw, 48px)' : 0} />
          ))}
        </div>
      </div>
    </section>
  );
}