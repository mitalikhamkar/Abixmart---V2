// src/components/abix/WhatsGrowingNext.jsx
import React from 'react';
import ShopCollectionCard from '@/components/abix/ShopCollectionCard';
import Eyebrow from '@/components/abix/Eyebrow';
import { products } from '@/data/products';

const IVORY = '#F2ECE2';

// Discovery/anticipation — charcoal/mineral surface matching the Shop page
// system. Cards reuse ShopCollectionCard so Notify Me, Firebase
// notification writes, authenticated-email reuse, and duplicate-
// subscription prevention are identical to Shop — no second
// implementation to maintain or drift out of sync.
export default function WhatsGrowingNext() {
  const comingSoon = products.filter((p) => p.status === 'coming_soon');

  if (comingSoon.length === 0) return null;

  return (
    <section id="growing" className="relative py-24 lg:py-36 overflow-hidden grain" style={{ background: '#1E1C1F' }}>
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl mb-14 lg:mb-20">
          <Eyebrow light>What's Next</Eyebrow>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight" style={{ color: IVORY }}>
            What's growing next.
          </h2>
          <p className="mt-6 text-lg leading-relaxed max-w-lg" style={{ color: `${IVORY}B3` }}>
            More wellness, crafted with the same patience. Be the first to know when they land.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {comingSoon.map((p, i) => (
            <ShopCollectionCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}