// src/components/abix/about/EverydayRitual.jsx
//
// A short, practical section: using the product as part of a routine. The three
// steps are the product's own usage guidance (featuredProduct.howToUse). No
// medical promises. Links to the full "How to take Shilajit" page.
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import Eyebrow from '@/components/abix/Eyebrow';
import LeafShadow from '@/components/abix/home/LeafShadow';
import { useInViewReveal } from '@/hooks/useInViewReveal';
import { featuredProduct } from '@/data/products';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

// Ritual photo. To use a different one, change this import line.
import ritualImg from '@/assets/HowToUse/30-50/female/DISSOLVE IN WARM WATER.png';

const ARCH = '50% 50% 0 0 / 30% 30% 0 0';
const TITLES = ['Dissolve', 'Once a day', 'Store with care'];
const STEPS = featuredProduct.howToUse.slice(0, 3).map((text, i) => ({
  number: String(i + 1).padStart(2, '0'),
  title: TITLES[i] || `Step ${i + 1}`,
  text,
}));

export default function EverydayRitual() {
  const rootRef = useRef(null);
  useInViewReveal(rootRef);

  return (
    <section
      id="ritual"
      ref={rootRef}
      aria-labelledby="ritual-title"
      className="relative overflow-hidden grain"
      style={{
        background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deep} 16%, ${FOREST.mid} 60%, ${FOREST.deep} 100%)`,
      }}
    >
      <LeafShadow side="left" opacity={0.05} className="inset-x-0 top-0 h-[60%]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-32 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-14 lg:gap-16 items-center">
        <div className="lg:col-span-6 min-w-0 order-2 lg:order-1">
          <div data-reveal><Eyebrow light>The everyday ritual</Eyebrow></div>
          <h2
            id="ritual-title"
            data-reveal
            data-reveal-delay="0.08"
            className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.03] tracking-tight"
            style={{ color: ABIX.ivory }}
          >
            A small daily practice.
          </h2>
          <p data-reveal data-reveal-delay="0.16" className="mt-5 max-w-md text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
            Keep it simple. Keep it consistent. Consistency over quantity.
          </p>

          <ol className="mt-10 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-x-6 gap-y-8">
            {STEPS.map((s) => (
              <li key={s.number} data-reveal className="list-none">
                <span data-line className="block h-px w-full" style={{ background: ABIX.gold25 }} />
                <span className="mt-4 block font-grotesk text-[10px] tracking-luxe-sm" style={{ color: ABIX.gold }}>{s.number}</span>
                <span className="mt-1 block font-display text-2xl" style={{ color: ABIX.ivory }}>{s.title}</span>
                <span className="mt-2 block text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>{s.text}</span>
              </li>
            ))}
          </ol>

          <div data-reveal className="mt-10">
            <Link
              to="/how-to-take-shilajit"
              className={`group inline-flex w-full sm:w-auto items-center justify-center h-14 px-8 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full border transition-colors duration-300 hover:bg-[rgba(199,174,125,0.08)] ${FOCUS_RING}`}
              style={{ color: ABIX.goldLight, borderColor: `${ABIX.goldLight}66` }}
            >
              How to take Shilajit
              <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 min-w-0 order-1 lg:order-2">
          <div className="relative mx-auto w-full max-w-sm lg:max-w-md aspect-[4/5]">
            <div aria-hidden="true" className="absolute -inset-2 sm:-inset-3 pointer-events-none" style={{ border: `1px solid ${ABIX.gold25}`, borderRadius: ARCH }} />
            <div data-clip className="absolute inset-0 overflow-hidden" style={{ borderRadius: ARCH, background: FOREST.deepest }}>
              <img
                src={ritualImg}
                alt="Dissolving a small portion of ABIXMART Shilajit in warm water"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${FOREST.deepest}80 0%, transparent 40%)` }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}