// src/components/abix/WhatsGrowingNext.jsx
import React, { useRef } from 'react';
import Eyebrow from '@/components/abix/Eyebrow';
import ProductFamilyScroll from '@/components/abix/upcoming/ProductFamilyScroll';
import LeafShadow from '@/components/abix/home/LeafShadow';
import { FOREST } from '@/components/abix/upcoming/livingCollection/theme';
import { useCatalog } from '@/lib/CatalogContext';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ABIX } from './brandColors';

// Pre-orders ("The Living Collection"). The top colour matches the bottom of
// the Shilajit showcase exactly (FOREST.deepest), and the bottom resolves to
// obsidian, which is where the ABIXMART Circle begins.
//
// NOTE: this section must NOT use overflow-hidden. The collection stage is
// position: sticky, and an overflow-hidden ancestor would stop it pinning.
export default function WhatsGrowingNext() {
  const { comingSoonProducts, loading } = useCatalog();
  const rootRef = useRef(null);
  const ready = !loading && comingSoonProducts.length > 0;

  useScrollReveal(rootRef, { ready });

  if (!ready) return null;

  return (
    <section
      id="growing"
      ref={rootRef}
      aria-labelledby="living-collection-title"
      className="relative pt-24 lg:pt-36 pb-16 lg:pb-24 grain"
      style={{
        background: `linear-gradient(180deg, ${FOREST.deepest} 0%, ${FOREST.deep} 10%, ${FOREST.mid} 50%, ${FOREST.deep} 90%, ${ABIX.obsidian} 100%)`,
      }}
    >
      <LeafShadow side="right" opacity={0.05} className="inset-x-0 top-0 h-[70vh]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 mb-12 lg:mb-8">
        <div className="max-w-xl">
          <div data-reveal>
            <Eyebrow light>Pre-orders</Eyebrow>
          </div>
          <h2
            id="living-collection-title"
            data-reveal
            data-reveal-delay="0.1"
            className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight"
            style={{ color: ABIX.ivory }}
          >
            The Living Collection.
          </h2>
          <p
            data-reveal
            data-reveal-delay="0.2"
            className="mt-5 text-sm sm:text-base max-w-md"
            style={{ color: ABIX.ivory70 }}
          >
            A few more rituals are on their way, drawn from the same Himalayan tradition as the collection you already
            know. Register your pre-order interest and be first to know.
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <ProductFamilyScroll />
      </div>
    </section>
  );
}