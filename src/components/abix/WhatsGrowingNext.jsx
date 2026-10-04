// src/components/abix/WhatsGrowingNext.jsx
import React from 'react';
import Eyebrow from '@/components/abix/Eyebrow';
import ComingSoonMarquee from '@/components/abix/ComingSoonMarquee';
import { useCatalog } from '@/lib/CatalogContext';
import { ABIX } from './brandColors';

// CHANGED: the static GrowingCard row is gone — replaced by the shared
// ComingSoonMarquee (continuous reel). The section wrapper, heading,
// and background gradient are unchanged.
// G3: the coming-soon list now comes from the Firestore-backed catalog.
export default function WhatsGrowingNext() {
  const { comingSoonProducts, loading } = useCatalog();

  if (loading || comingSoonProducts.length === 0) return null;

  return (
    <section
      id="growing"
      className="relative py-24 lg:py-36 overflow-hidden grain"
      style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${ABIX.deep} 35%, ${ABIX.deep} 65%, ${ABIX.obsidian} 100%)` }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 mb-12 lg:mb-16">
        <div className="max-w-xl">
          <Eyebrow light>What's Next</Eyebrow>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
            What's growing next.
          </h2>
          <p className="mt-5 text-sm sm:text-base max-w-md" style={{ color: ABIX.ivory70 }}>
            A few more rituals are on their way, drawn from the same Himalayan tradition as the collection you already know.
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <ComingSoonMarquee />
      </div>
    </section>
  );
}