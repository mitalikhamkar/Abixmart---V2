// src/components/abix/MountainToRitual.jsx
//
// "From the mountain to your ritual": five stages, each with ONE image, a number,
// a heading and one short line. Photos change with a rising mask (shared
// MaskedImageStack); text rises in gently. Previous/next buttons, a path
// indicator (dots on small screens), swipe and arrow keys. There is no autoplay.
//
// REBUILT: the old component layered a separate Shilajit jar cutout over the
// stage-5 photo, animated by its own tween that was killed and restarted on
// every step change, drag and autoplay tick, so it could drift out of sync and
// appear over the wrong frame. That overlay is gone. Each stage is one image in
// one layer, and inactive layers are hidden, not just transparent.
//
// Mobile: the photo sits above the text in normal page flow. Swiping works, but
// vertical page scrolling is never trapped (touch-action: pan-y).
import React, { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Eyebrow from '@/components/abix/Eyebrow';
import LeafShadow from '@/components/abix/home/LeafShadow';
import MaskedImageStack from '@/components/abix/about/MaskedImageStack';
import { ABOUT_CSS } from '@/components/abix/about/aboutMotion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { storyStages, featuredProduct } from '@/data/products';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

import himalayaBG from '@/assets/shilajit-steps/himalayaBG.png';
import collectionImg from '@/assets/shilajit-steps/collection.png';
import purificationImg from '@/assets/shilajit-steps/purification.png';
import resinFormulationImg from '@/assets/shilajit-steps/resin_formulation.png';
import readyToReachImg from '@/assets/shilajit-steps/ReadyToReach.jpeg';

const stageText = (title, fallback) => storyStages.find((s) => s.title === title)?.text || fallback;

const STEPS = [
  {
    key: 'mountain',
    label: 'Mountain',
    title: 'High in the Himalayas',
    body: stageText('Sourcing', 'Raw Shilajit is gathered from the high-altitude rocks of the Himalayas, where it forms over centuries.'),
    image: himalayaBG,
    alt: 'The high Himalayas, where Shilajit forms',
  },
  {
    key: 'raw',
    label: 'Gathered',
    title: 'Gathered by hand',
    body: stageText('Collection', 'Collected by hand in small quantities, with care for the mountain and its rhythms.'),
    image: collectionImg,
    alt: 'Raw Shilajit being gathered by hand',
  },
  {
    key: 'purified',
    label: 'Purified',
    title: 'Purified with care',
    body: stageText('Purification', 'The raw resin is gently purified using traditional methods to remove impurities.'),
    image: purificationImg,
    alt: 'Traditional purification of Shilajit',
  },
  {
    key: 'resin',
    label: 'Resin',
    title: 'Formed into resin',
    body: stageText('Resin Formulation', 'Formulated into the smooth resin you receive. Nothing rushed, nothing added.'),
    image: resinFormulationImg,
    alt: 'Shilajit formed into smooth resin',
  },
  {
    key: 'ritual',
    label: 'Ritual',
    title: 'Part of your ritual',
    body: featuredProduct.howToUse[0],
    image: readyToReachImg,
    alt: 'Shilajit ready to become part of a daily ritual',
  },
];
const N = STEPS.length;
const LAST = N - 1;
const IMAGES = STEPS.map((s) => ({ src: s.image, alt: s.alt }));
const pad = (n) => String(n).padStart(2, '0');

// Descent path: nodes (x, y) in a 1000 x 60 box, high on the left to low on the right.
const NODES = [
  { x: 20, y: 10 },
  { x: 260, y: 26 },
  { x: 500, y: 38 },
  { x: 740, y: 46 },
  { x: 980, y: 50 },
];
const SEGMENTS = [
  'M20 10 C 140 10, 140 26, 260 26',
  'M260 26 C 380 26, 380 38, 500 38',
  'M500 38 C 620 38, 620 46, 740 46',
  'M740 46 C 860 46, 860 50, 980 50',
];

export default function MountainToRitual() {
  const rootRef = useRef(null);
  const swipeStart = useRef(null);
  const [sel, setSel] = useState({ active: 0, prev: 0 });
  useScrollReveal(rootRef);

  const go = useCallback((i) => {
    setSel((s) => {
      const n = Math.max(0, Math.min(LAST, i));
      return n === s.active ? s : { active: n, prev: s.active };
    });
  }, []);
  const step = useCallback((d) => {
    setSel((s) => {
      const n = Math.max(0, Math.min(LAST, s.active + d));
      return n === s.active ? s : { active: n, prev: s.active };
    });
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  };

  const { active, prev } = sel;
  const s = STEPS[active];
  const arrow = `h-12 w-12 rounded-full inline-flex items-center justify-center border transition-colors duration-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-[rgba(199,174,125,0.1)] ${FOCUS_RING}`;

  return (
    <section
      id="journey"
      ref={rootRef}
      aria-labelledby="journey-title"
      className="relative overflow-hidden grain"
      style={{
        background: `linear-gradient(180deg, ${FOREST.deep} 0%, ${FOREST.mid} 45%, ${FOREST.deepest} 100%)`,
      }}
    >
      <style>{ABOUT_CSS}</style>
      <LeafShadow side="left" opacity={0.05} className="inset-x-0 top-0 h-[55%]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-32">
        <div className="max-w-xl">
          <div data-reveal><Eyebrow light>The Journey</Eyebrow></div>
          <h2
            id="journey-title"
            data-reveal
            data-reveal-delay="0.08"
            className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.03] tracking-tight"
            style={{ color: ABIX.ivory }}
          >
            From the mountain to your ritual.
          </h2>
          <p data-reveal data-reveal-delay="0.16" className="mt-5 text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
            Five stages, from high-altitude Himalayan rock to your everyday ritual. No shortcuts.
          </p>
        </div>

        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="From the mountain to your ritual"
          onKeyDown={onKeyDown}
          data-reveal
          className="mt-12 lg:mt-16"
        >
          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            {/* one image per stage */}
            <div className="lg:col-span-7 min-w-0">
              <div
                className="relative"
                style={{ touchAction: 'pan-y' }}
                onPointerDown={(e) => { swipeStart.current = e.clientX; }}
                onPointerUp={(e) => {
                  if (swipeStart.current == null) return;
                  const dx = e.clientX - swipeStart.current;
                  swipeStart.current = null;
                  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
                }}
                onPointerCancel={() => { swipeStart.current = null; }}
              >
                <div aria-hidden="true" className="absolute -inset-2 sm:-inset-3 border pointer-events-none" style={{ borderColor: ABIX.gold25 }} />
                <MaskedImageStack
                  images={IMAGES}
                  active={active}
                  prev={prev}
                  className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3]"
                  style={{ background: FOREST.deepest }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                  style={{ background: `linear-gradient(0deg, ${FOREST.deepest}B3 0%, transparent 100%)`, zIndex: 3 }}
                />
                <span
                  key={s.key}
                  aria-hidden="true"
                  className="abix-in absolute left-4 bottom-2 font-display leading-none select-none pointer-events-none"
                  style={{
                    zIndex: 4,
                    fontSize: 'clamp(4.5rem, 13vw, 8.5rem)',
                    color: 'transparent',
                    WebkitTextStroke: `1px ${ABIX.ivory45}`,
                  }}
                >
                  {pad(active + 1)}
                </span>
              </div>
            </div>

            {/* one heading and one line per stage */}
            <div className="lg:col-span-5 min-w-0">
              <div aria-live="polite">
                <div key={s.key} className="abix-rise">
                  <p className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
                    {pad(active + 1)} / {pad(N)} · {s.label}
                  </p>
                  <h3 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
                    {s.title}
                  </h3>
                  <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
                    {s.body}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  disabled={active === 0}
                  aria-label="Previous stage"
                  className={arrow}
                  style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={active === LAST}
                  aria-label="Next stage"
                  className={arrow}
                  style={{ borderColor: ABIX.gold, color: ABIX.goldLight }}
                >
                  <ChevronRight size={18} />
                </button>
                {/* small screens: stage dots */}
                <div className="md:hidden ml-auto flex items-center">
                  {STEPS.map((st, i) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => go(i)}
                      aria-label={`Stage ${i + 1}: ${st.title}`}
                      aria-current={i === active ? 'step' : undefined}
                      className={`h-11 w-6 inline-flex items-center justify-center ${FOCUS_RING}`}
                    >
                      <span
                        className="block h-1.5 rounded-full transition-all duration-500"
                        style={{ width: i === active ? 18 : 6, background: i <= active ? ABIX.gold : ABIX.ivory25 }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* larger screens: the descent path from mountain to ritual */}
          <div className="hidden md:block mt-14 lg:mt-20">
            <div className="relative mx-auto" style={{ aspectRatio: '1000 / 60' }}>
              <svg viewBox="0 0 1000 60" className="absolute inset-0 h-full w-full" aria-hidden="true" fill="none">
                {SEGMENTS.map((d, i) => (
                  <g key={d}>
                    <path d={d} stroke={ABIX.ivory25} strokeWidth="1.2" strokeLinecap="round" />
                    <path
                      d={d}
                      pathLength="1"
                      stroke={ABIX.gold}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeDasharray="1"
                      style={{
                        strokeDashoffset: i < active ? 0 : 1,
                        transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </g>
                ))}
                {NODES.map((n, i) => (
                  <g key={i}>
                    {i === active && <circle cx={n.x} cy={n.y} r="10" stroke={ABIX.gold} strokeOpacity="0.45" strokeWidth="1" />}
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="4.5"
                      fill={i <= active ? ABIX.gold : FOREST.deepest}
                      stroke={i <= active ? ABIX.gold : ABIX.ivory25}
                      strokeWidth="1.2"
                    />
                  </g>
                ))}
              </svg>
              {NODES.map((n, i) => (
                <button
                  key={STEPS[i].key}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Stage ${i + 1}: ${STEPS[i].title}`}
                  aria-current={i === active ? 'step' : undefined}
                  className={`absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full ${FOCUS_RING}`}
                  style={{ left: `${n.x / 10}%`, top: `${(n.y / 60) * 100}%` }}
                />
              ))}
            </div>
            <div className="relative mt-3 h-6">
              {NODES.map((n, i) => (
                <span
                  key={STEPS[i].key}
                  aria-hidden="true"
                  className="absolute -translate-x-1/2 whitespace-nowrap font-grotesk text-[10px] uppercase tracking-luxe-sm transition-colors duration-500"
                  style={{ left: `${n.x / 10}%`, color: i === active ? ABIX.goldLight : ABIX.ivory45 }}
                >
                  {STEPS[i].label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}