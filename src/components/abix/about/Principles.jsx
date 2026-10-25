// src/components/abix/about/Principles.jsx
//
// Four principles: Origin, Process, Quality, Use. Selecting (click, tap) or
// focusing (keyboard) a principle updates its photo and its short explanation
// together. Nothing ever changes automatically while the visitor is reading.
// Arrow keys / Home / End move between the principles.
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Eyebrow from '@/components/abix/Eyebrow';
import LeafShadow from '@/components/abix/home/LeafShadow';
import MaskedImageStack from '@/components/abix/about/MaskedImageStack';
import { ABOUT_CSS } from '@/components/abix/about/aboutMotion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { featuredProduct, storyStages, trustPillars, openProductTabs } from '@/data/products';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

import aboutOrigin from '@/assets/about/about-origin.png';
import aboutProcess from '@/assets/about/about-process.png';
import aboutQuality from '@/assets/about/about-quality.png';
// "Use" photo. To use a different one, change this import line.
import useImage from '@/assets/HowToUse/30-50/female/TAKE THE RIGHT AMOUNT.png';

const factValue = (label) => featuredProduct.facts.find((f) => f.label === label)?.value;
const qualityPillar = trustPillars.find((p) => p.key === 'quality');
const useTab = openProductTabs.find((t) => t.key === 'use');

// All wording comes from copy and data already in the project.
const PRINCIPLES = [
  {
    key: 'origin',
    number: '01',
    label: 'Origin',
    title: 'Know where it begins.',
    body: 'Our Shilajit is gathered from high-altitude Himalayan rock, where it forms slowly over centuries. We collect in small quantities, with respect for the mountain.',
    chip: factValue('Origin') || 'High Himalayas',
    link: { to: '/shop/shilajit', label: 'See the product story' },
    image: aboutOrigin,
    alt: 'The high Himalayan landscape where ABIXMART Shilajit begins',
  },
  {
    key: 'process',
    number: '02',
    label: 'Process',
    title: 'Know what happens to it.',
    body: 'From sourcing to sealing, every jar passes through deliberate stages of traditional purification and careful handling, shown openly, not summarised away.',
    chip: `${storyStages.length} stages`,
    link: { to: '/shop/shilajit', label: 'See every stage' },
    image: aboutProcess,
    alt: 'Traditional purification of ABIXMART Shilajit',
  },
  {
    key: 'quality',
    number: '03',
    label: 'Quality',
    title: 'Know what we check.',
    body: 'Each batch is checked for quality and consistency before it moves forward. We focus on what we can verify, and we do not make claims we cannot stand behind.',
    chip: qualityPillar?.title || 'Reviewed before it reaches you',
    link: { to: '/shop/shilajit', label: 'View the product' },
    image: aboutQuality,
    alt: 'Quality checks on ABIXMART Shilajit',
  },
  {
    key: 'use',
    number: '04',
    label: 'Use',
    title: 'Know how to use it.',
    body: useTab?.body || 'Dissolve a pea-sized portion in warm water or milk, once a day.',
    chip: 'Once a day',
    link: { to: '/how-to-take-shilajit', label: 'How to take Shilajit' },
    image: useImage,
    alt: 'Taking the right amount of ABIXMART Shilajit',
  },
];
const N = PRINCIPLES.length;
const IMAGES = PRINCIPLES.map((p) => ({ src: p.image, alt: p.alt }));

export default function Principles() {
  const rootRef = useRef(null);
  const tabRefs = useRef([]);
  const [sel, setSel] = useState({ active: 0, prev: 0 });
  useScrollReveal(rootRef);

  const choose = (i) => setSel((s) => (s.active === i ? s : { active: i, prev: s.active }));

  const onKeyDown = (e, i) => {
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % N;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + N) % N;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = N - 1;
    if (next === null) return;
    e.preventDefault();
    choose(next);
    tabRefs.current[next]?.focus();
  };

  const p = PRINCIPLES[sel.active];

  return (
    <section
      id="principles"
      ref={rootRef}
      aria-labelledby="principles-title"
      className="relative overflow-hidden grain"
      style={{
        background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deep} 14%, ${FOREST.mid} 55%, ${FOREST.deep} 100%)`,
      }}
    >
      <style>{ABOUT_CSS}</style>
      <LeafShadow side="right" opacity={0.05} className="inset-x-0 top-0 h-[60%]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-32">
        <div className="max-w-xl">
          <div data-reveal><Eyebrow light>The ABIXMART Standard</Eyebrow></div>
          <h2
            id="principles-title"
            data-reveal
            data-reveal-delay="0.08"
            className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.03] tracking-tight"
            style={{ color: ABIX.ivory }}
          >
            Know what matters.
          </h2>
          <p data-reveal data-reveal-delay="0.16" className="mt-5 text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
            Four things we focus on, and show.
          </p>
        </div>

        <div className="mt-12 lg:mt-16 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          {/* the four principles */}
          <div className="lg:col-span-5 min-w-0">
            <div
              role="tablist"
              aria-label="The four principles"
              className="relative grid grid-cols-2 gap-2 lg:block lg:pl-9"
            >
              <span aria-hidden="true" className="hidden lg:block absolute left-[3px] top-2 bottom-2 w-px" style={{ background: ABIX.ivory12 }} />
              <span
                aria-hidden="true"
                className="hidden lg:block absolute left-[3px] top-2 w-px origin-top transition-[height] duration-700"
                style={{ background: ABIX.gold, height: `calc(${sel.active / (N - 1)} * (100% - 1rem))` }}
              />
              {PRINCIPLES.map((item, i) => {
                const on = i === sel.active;
                return (
                  <button
                    key={item.key}
                    ref={(el) => { tabRefs.current[i] = el; }}
                    id={`principle-tab-${item.key}`}
                    role="tab"
                    type="button"
                    aria-selected={on}
                    aria-controls="principle-panel"
                    tabIndex={on ? 0 : -1}
                    onClick={() => choose(i)}
                    onFocus={() => choose(i)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={`relative text-left px-4 py-3 lg:px-0 lg:py-6 border lg:border-0 lg:border-b transition-colors duration-300 ${FOCUS_RING}`}
                    style={{ borderColor: on ? ABIX.gold : ABIX.ivory25 }}
                  >
                    <span
                      aria-hidden="true"
                      className="hidden lg:block absolute -left-9 top-[36px] h-[7px] w-[7px] rounded-full transition-all duration-500"
                      style={{ background: on ? ABIX.gold : ABIX.ivory25, transform: on ? 'scale(1.5)' : 'scale(1)' }}
                    />
                    <span className="block font-grotesk text-[10px] tracking-luxe-sm" style={{ color: ABIX.gold }}>
                      {item.number}
                    </span>
                    <span
                      className="block font-display text-2xl lg:text-4xl leading-tight transition-colors duration-500"
                      style={{ color: on ? ABIX.ivory : ABIX.ivory45 }}
                    >
                      {item.label}
                    </span>
                    <span className="hidden lg:block mt-1 text-sm transition-colors duration-500" style={{ color: on ? ABIX.ivory70 : ABIX.ivory25 }}>
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* photo and explanation, changing together */}
          <div
            id="principle-panel"
            role="tabpanel"
            aria-labelledby={`principle-tab-${p.key}`}
            className="lg:col-span-7 min-w-0"
          >
            <div className="relative">
              <div aria-hidden="true" className="absolute -inset-2 sm:-inset-3 border pointer-events-none" style={{ borderColor: ABIX.gold25 }} />
              <MaskedImageStack
                images={IMAGES}
                active={sel.active}
                prev={sel.prev}
                className="aspect-[4/3]"
                style={{ background: FOREST.deepest }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                style={{ background: `linear-gradient(0deg, ${FOREST.deepest}B3 0%, transparent 100%)`, zIndex: 3 }}
              />
              <span
                key={p.key}
                aria-hidden="true"
                className="abix-in absolute left-4 bottom-3 font-display text-5xl sm:text-6xl leading-none select-none"
                style={{ zIndex: 4, color: 'transparent', WebkitTextStroke: `1px ${ABIX.ivory45}` }}
              >
                {p.number}
              </span>
            </div>

            <div aria-live="polite" className="mt-9 lg:mt-10">
              <div key={p.key} className="abix-rise">
                <h3 className="font-display text-3xl lg:text-4xl leading-tight" style={{ color: ABIX.ivory }}>
                  {p.title}
                </h3>
                <p className="mt-3 max-w-lg text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
                  {p.body}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-semibold uppercase tracking-luxe-sm"
                    style={{ borderColor: ABIX.gold25, color: ABIX.goldLight }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: ABIX.gold }} />
                    {p.chip}
                  </span>
                  <Link
                    to={p.link.to}
                    className={`inline-flex items-center min-h-[44px] text-[11px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline ${FOCUS_RING}`}
                    style={{ color: ABIX.goldLight }}
                  >
                    {p.link.label} →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}