// src/components/abix/about/Transparency.jsx
//
// "What we don't claim", made scannable: what you can check today, next to what
// we do not claim. Every line comes from product data and copy already in the
// project. The documentation row does not assert that any document exists.
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import Eyebrow from '@/components/abix/Eyebrow';
import { useInViewReveal } from '@/hooks/useInViewReveal';
import { faqs, featuredProduct, storyStages } from '@/data/products';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

const safety = faqs.find((f) => f.q === 'Is Shilajit safe for everyone?')?.a;

// If you publish real documents later (lab reports, certificates), add them here.
const CAN_CHECK = [
  {
    label: 'Product details',
    value: featuredProduct.facts.map((f) => f.value).join(' · '),
    to: '/shop/shilajit',
    cta: 'View product',
  },
  {
    label: 'Process',
    value: `${storyStages.length} stages, shown openly from sourcing to the final check.`,
    to: '/shop/shilajit',
    cta: 'See the story',
  },
  {
    label: 'Usage',
    value: featuredProduct.howToUse[0],
    to: '/how-to-take-shilajit',
    cta: 'How to take it',
  },
  {
    label: 'Documentation',
    value: 'We only share documents we can stand behind. Ask us about a specific batch.',
    to: '/support#contact',
    cta: 'Ask us',
  },
];

const NOT_CLAIMED = [
  'No invented certifications.',
  'No fabricated laboratory results.',
  'No miracle promises.',
  'No exaggerated health claims.',
];

export default function Transparency() {
  const rootRef = useRef(null);
  useInViewReveal(rootRef);

  return (
    <section
      id="transparency"
      ref={rootRef}
      aria-labelledby="transparency-title"
      className="relative overflow-hidden grain"
      style={{
        background: `linear-gradient(180deg, ${FOREST.deepest} 0%, ${ABIX.obsidian} 30%, ${ABIX.obsidian} 80%, ${ABIX.obsidian} 100%)`,
      }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-32">
        <div className="max-w-xl">
          <div data-reveal><Eyebrow light>The line we won't cross</Eyebrow></div>
          <h2
            id="transparency-title"
            data-reveal
            data-reveal-delay="0.08"
            className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.03] tracking-tight"
            style={{ color: ABIX.ivory }}
          >
            What we don't claim.
          </h2>
          <p data-reveal data-reveal-delay="0.16" className="mt-5 text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
            We'd rather show you what we know than manufacture certainty around what we don't.
          </p>
        </div>

        <div className="mt-12 lg:mt-16 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* what you can check */}
          <div className="lg:col-span-7 min-w-0">
            <p data-reveal className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
              What you can check
            </p>
            <ul className="mt-4">
              {CAN_CHECK.map((row) => (
                <li key={row.label} data-reveal className="list-none">
                  <span data-line className="block h-px w-full" style={{ background: ABIX.ivory12 }} />
                  <div className="py-5 grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)_auto] gap-x-6 gap-y-2 sm:items-baseline">
                    <span className="font-display text-xl" style={{ color: ABIX.ivory }}>{row.label}</span>
                    <span className="text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>{row.value}</span>
                    <Link
                      to={row.to}
                      className={`inline-flex items-center min-h-[44px] sm:min-h-0 text-[11px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline whitespace-nowrap ${FOCUS_RING}`}
                      style={{ color: ABIX.goldLight }}
                    >
                      {row.cta} →
                    </Link>
                  </div>
                </li>
              ))}
              <li aria-hidden="true" className="list-none"><span data-line className="block h-px w-full" style={{ background: ABIX.ivory12 }} /></li>
            </ul>
          </div>

          {/* what we do not claim */}
          <div className="lg:col-span-5 min-w-0">
            <div
              data-reveal
              className="p-7 lg:p-9 border"
              style={{ borderColor: ABIX.border, background: `${FOREST.deep}99` }}
            >
              <p className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
                We do not claim
              </p>
              <ul className="mt-5 space-y-3.5">
                {NOT_CLAIMED.map((t) => (
                  <li key={t} className="list-none flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 rounded-full border inline-flex items-center justify-center"
                      style={{ borderColor: ABIX.gold25, color: ABIX.gold }}
                    >
                      <X size={11} />
                    </span>
                    <span className="text-base leading-snug" style={{ color: ABIX.ivory }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {safety && (
              <p data-reveal className="mt-6 text-sm leading-relaxed" style={{ color: ABIX.ivory45 }}>
                <span className="font-semibold" style={{ color: ABIX.ivory70 }}>Good to know. </span>
                {safety}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}