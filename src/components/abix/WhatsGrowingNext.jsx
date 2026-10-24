// src/components/abix/WhatsGrowingNext.jsx
import React from 'react';
import Eyebrow from '@/components/abix/Eyebrow';
import ProductFamilyScroll from '@/components/abix/upcoming/ProductFamilyScroll';
import { useCatalog } from '@/lib/CatalogContext';
import { ABIX } from './brandColors';

// CHANGED: the Coming Soon marquee is replaced here by ProductFamilyScroll,
// a pinned, scroll-responsive product family (Shilajit, then each upcoming
// product). The marquee is unchanged on Shop and About. The heading, copy
// and background gradient are unchanged.
//
// NOTE: this section must NOT use overflow-hidden. The family stage is
// position: sticky, and an overflow-hidden ancestor would stop it pinning.
// The list still comes from the Firestore-backed catalog (G3).
export default function WhatsGrowingNext() {
  const { comingSoonProducts, loading } = useCatalog();

  if (loading || comingSoonProducts.length === 0) return null;

  return (
    <section
      id="growing"
      className="relative pt-24 lg:pt-36 pb-16 lg:pb-24 grain"
      style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${ABIX.deep} 12%, ${ABIX.deep} 88%, ${ABIX.obsidian} 100%)` }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 mb-12 lg:mb-8">
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
        <ProductFamilyScroll />
      </div>
    </section>
  );
}