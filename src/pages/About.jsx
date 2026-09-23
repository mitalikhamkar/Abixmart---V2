// src/pages/About.jsx
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import ShopCollectionCard from '@/components/abix/ShopCollectionCard';
import MountainToRitual from '@/components/abix/MountainToRitual';
import { products } from '@/data/products';

import aboutHero from '@/assets/about/about-hero.png';
import aboutOrigin from '@/assets/about/about-origin.png';
import aboutProcess from '@/assets/about/about-process.png';
import aboutQuality from '@/assets/about/about-quality.png';
import aboutJourney from '@/assets/about/about-journey.png';

const INK = '#151417';
const GRAPHITE = '#1E1C1F';
const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';
const AMBER = '#D3A467';

// Single source of truth for the "Know what matters." section.
// Every field a step needs — number, label, title, body, image — lives
// on the SAME object, keyed by the SAME array index. There is no second
// parallel image array anywhere in this section.
//
// Image mapping (verified 1:1, no duplicates):
//   01 ORIGIN        -> about-origin.png
//   02 PROCESS       -> about-process.png
//   03 QUALITY       -> about-quality.png
//   04 TRANSPARENCY  -> about-journey.png  (previously incorrectly reused
//                        about-quality.png — that was the root cause of
//                        "same image appears twice / one state invisible")
const MATTERS = [
  {
    id: 'origin',
    number: '01',
    label: 'Origin',
    title: 'Know where it begins.',
    body: 'Our Shilajit is gathered from high-altitude Himalayan rock, where it forms slowly over centuries. We collect in small quantities, with respect for the mountain.',
    image: aboutOrigin,
  },
  {
    id: 'process',
    number: '02',
    label: 'Process',
    title: 'Know what happens to it.',
    body: 'From sourcing to sealing, every jar passes through deliberate stages of traditional purification and careful handling — shown openly, not summarised away.',
    image: aboutProcess,
  },
  {
    id: 'quality',
    number: '03',
    label: 'Quality',
    title: 'Know what we check.',
    body: 'Each batch is checked for quality and consistency before it moves forward. We focus on what we can verify, and we do not make claims we cannot stand behind.',
    image: aboutQuality,
  },
  {
    id: 'transparency',
    number: '04',
    label: 'Transparency',
    title: 'What we show, we show fully.',
    body: 'We share our process openly — no invented certifications, no fabricated results, no claims we cannot stand behind.',
    image: aboutJourney,
  },
];

export default function About() {
  const [activeIndex, setActiveIndex] = useState(0);
  const comingSoon = products.filter((p) => p.status === 'coming_soon');

  // Drives activeIndex from continuous scroll progress across the section
  // (not from discrete per-row viewport-enter events). This is what
  // guarantees every state is reached in order and none can be skipped:
  // activeIndex is always `floor(progress * 4)`, a pure function of
  // wherever scroll currently sits — there's no sequential event to miss
  // even on a very fast scroll.
  const timelineRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ['start center', 'end center'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(MATTERS.length - 1, Math.max(0, Math.floor(v * MATTERS.length)));
    setActiveIndex(idx);
  });

  return (
    <PageTransition>
      {/* ============ HERO ============ */}
      <section className="relative min-h-[78vh] flex items-end overflow-hidden" style={{ background: INK }}>
        <motion.div
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 0.55, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
        >
          <img src={aboutHero} alt="ABIXMART origin" className="h-full w-full object-cover object-center" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#151417] via-[#151417]/55 to-[#151417]/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#151417]/70 via-[#151417]/10 to-transparent" />
        <div className="absolute inset-0 grain opacity-[0.05]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 pb-20 lg:pb-28 pt-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <Eyebrow light>About ABIXMART</Eyebrow>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl text-[#F2ECE2] leading-[0.98] tracking-tight">
              Built slowly.
              <br />
              Shown honestly.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed" style={{ color: `${IVORY}B3` }}>
              ABIXMART is being built around a simple principle: if we put something into your daily
              ritual, you should be able to understand where it came from, how it was made, and why it
              belongs there.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ ABIXMART STANDARD — "Know what matters." ============ */}
      <section className="py-16 lg:py-24 border-t" style={{ background: GRAPHITE, borderColor: `${IVORY}0D` }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-xl mb-12 lg:mb-16">
            <Eyebrow light>The ABIXMART Standard</Eyebrow>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl text-[#F2ECE2] leading-[1.03] tracking-tight">
              Know what matters.
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
              We focus on four things you can actually verify — not stories we can't back up.
            </p>
          </div>

          {/* ---------- DESKTOP / TABLET: focus-shift interaction ----------
              activeIndex comes from continuous scroll progress (see
              useScroll/useMotionValueEvent above), so the timeline
              highlight, the progress fill, and the image are always
              reading the exact same index in the exact same render —
              there is no separate trigger per element that could
              disagree with another. */}
          <div className="hidden lg:grid grid-cols-12 gap-16 items-start">
            <div ref={timelineRef} className="col-span-5">
              <div className="relative pl-9">
                {/* Track */}
                <div className="absolute left-[3px] top-1 bottom-1 w-px" style={{ background: `${IVORY}14` }} />
                {/* Progress fill — height corresponds exactly to activeIndex */}
                <motion.div
                  className="absolute left-[3px] top-1 w-px origin-top"
                  style={{ background: AMBER }}
                  animate={{ height: `${(activeIndex / (MATTERS.length - 1)) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                />

                {MATTERS.map((m, i) => {
                  const active = i === activeIndex;
                  return (
                    <div key={m.id} className="relative py-8">
                      <span
                        className="absolute -left-9 top-[30px] h-[7px] w-[7px] rounded-full transition-all duration-500"
                        style={{
                          background: active ? AMBER : `${IVORY}30`,
                          transform: active ? 'scale(1.35)' : 'scale(1)',
                        }}
                      />
                      <span
                        className="font-grotesk text-xs tracking-luxe-sm transition-colors duration-500"
                        style={{ color: active ? AMBER : MUTED }}
                      >
                        {m.number} — {m.label.toUpperCase()}
                      </span>
                      <h3
                        className="mt-2 font-display text-2xl xl:text-3xl leading-tight transition-colors duration-500"
                        style={{ color: active ? IVORY : `${IVORY}45` }}
                      >
                        {m.title}
                      </h3>
                      {/* Always rendered — never mounted/unmounted — so
                          this row's height never changes and can't
                          reflow rows below it while scrolling. */}
                      <p
                        className="mt-3 text-sm leading-relaxed max-w-sm transition-opacity duration-500"
                        style={{ color: MUTED, opacity: active ? 1 : 0.35 }}
                      >
                        {m.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="col-span-7 sticky top-28 self-start">
              <div className="relative aspect-[4/3] xl:aspect-[16/11] overflow-hidden" style={{ background: INK }}>
                {/* All four images stay mounted at all times — they only
                    ever transition opacity/blur/clip, never remount, so
                    there is no swap-in/swap-out race that could show a
                    stale or mismatched frame. */}
                {MATTERS.map((m, i) => {
                  const active = i === activeIndex;
                  return (
                    <motion.img
                      key={m.id}
                      src={m.image}
                      alt={m.title}
                      className="absolute inset-0 h-full w-full object-cover"
                      initial={false}
                      animate={{
                        opacity: active ? 1 : 0,
                        clipPath: active ? 'inset(0% 0% 0% 0%)' : 'inset(4% 4% 4% 4%)',
                        filter: active ? 'blur(0px)' : 'blur(6px)',
                      }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  );
                })}
                <div className="absolute inset-0 ring-1 ring-inset" style={{ boxShadow: `inset 0 0 0 1px ${IVORY}1A` }} />
              </div>
            </div>
          </div>

          {/* ---------- MOBILE / TABLET-NARROW: plain stacked timeline ----------
              Each step is fully self-contained with its own inline image
              — no shared activeIndex, no shared image pool, so there is
              nothing that can desync. Each block fades in once as it
              enters the viewport, in guaranteed document order. */}
          <div className="lg:hidden space-y-14">
            {MATTERS.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: AMBER }} />
                  <span className="font-grotesk text-xs tracking-luxe-sm" style={{ color: AMBER }}>
                    {m.number} — {m.label.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-display text-2xl leading-tight" style={{ color: IVORY }}>
                  {m.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed max-w-md" style={{ color: MUTED }}>
                  {m.body}
                </p>
                <div className="mt-5 relative aspect-[4/3] overflow-hidden" style={{ background: INK }}>
                  <img src={m.image} alt={m.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 ring-1 ring-inset" style={{ boxShadow: `inset 0 0 0 1px ${IVORY}1A` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FROM THE MOUNTAIN TO THE RITUAL ============ */}
      <section className="pt-16 lg:pt-24 border-t" style={{ background: INK, borderColor: `${IVORY}0D` }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-10 pb-4">
          <div className="max-w-xl">
            <Eyebrow light>The Journey</Eyebrow>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl text-[#F2ECE2] leading-[1.03] tracking-tight">
              From the mountain to your ritual.
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
              Every batch of ABIXMART Shilajit travels a long, deliberate path — from high-altitude
              Himalayan rock to your everyday ritual. No shortcuts.
            </p>
          </div>
        </div>
      </section>
      <MountainToRitual />

      {/* ============ WHAT WE DON'T CLAIM ============ */}
      <section className="py-16 lg:py-24 border-t" style={{ background: GRAPHITE, borderColor: `${IVORY}0D` }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl px-6 lg:px-10 text-center"
        >
          <Eyebrow light className="justify-center">The Line We Won't Cross</Eyebrow>
          <h2 className="mt-6 font-display text-4xl sm:text-5xl text-[#F2ECE2] leading-[1.05] tracking-tight">
            What we don't claim.
          </h2>
          <ul className="mt-8 space-y-3 text-lg" style={{ color: `${IVORY}CC` }}>
            <li>No invented certifications.</li>
            <li>No fabricated laboratory results.</li>
            <li>No miracle promises.</li>
            <li>No exaggerated health claims.</li>
          </ul>
          <p className="mt-8 text-base leading-relaxed max-w-xl mx-auto" style={{ color: MUTED }}>
            We'd rather show you what we know than manufacture certainty around what we don't.
          </p>
        </motion.div>
      </section>

      {/* ============ THE COLLECTION IS JUST BEGINNING ============ */}
      {comingSoon.length > 0 && (
        <section className="py-16 lg:py-24 border-t" style={{ background: INK, borderColor: `${IVORY}0D` }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="max-w-xl mb-10 lg:mb-14">
              <Eyebrow light>The Collection</Eyebrow>
              <h2 className="mt-5 font-display text-4xl sm:text-5xl text-[#F2ECE2] leading-[1.03] tracking-tight">
                The collection is just beginning.
              </h2>
              <p className="mt-5 text-base leading-relaxed" style={{ color: MUTED }}>
                Shilajit is where ABIXMART begins. These products are coming next.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {comingSoon.map((p, i) => (
                <ShopCollectionCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ FINAL CTA ============ */}
      <section className="py-24 lg:py-36 border-t" style={{ background: GRAPHITE, borderColor: `${IVORY}0D` }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl px-6 lg:px-10 text-center"
        >
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#F2ECE2] leading-[1.05] tracking-tight">
            The collection is only beginning.
          </h2>
          <p className="mt-7 text-lg leading-relaxed max-w-xl mx-auto" style={{ color: `${IVORY}B3` }}>
            Shilajit is where ABIXMART begins. More products will follow — carefully, transparently, and
            with the same respect for origin and process.
          </p>
          <Link
            to="/shop"
            className="group mt-10 inline-flex items-center h-14 px-9 text-[#151417] text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
            style={{ background: AMBER }}
          >
            Explore the shop
            <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </motion.div>
      </section>
    </PageTransition>
  );
}