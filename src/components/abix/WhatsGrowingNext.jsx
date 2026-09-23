// src/components/abix/WhatsGrowingNext.jsx
import React from 'react';
import ShopCollectionCard from '@/components/abix/ShopCollectionCard';
import Eyebrow from '@/components/abix/Eyebrow';
import { products } from '@/data/products';
import { ABIX } from './brandColors';

export default function WhatsGrowingNext() {
  const comingSoon = products.filter((p) => p.status === 'coming_soon');

  if (comingSoon.length === 0) return null;

  return (
    <section id="growing" className="relative py-24 lg:py-36 overflow-hidden grain" style={{ background: ABIX.deep }}>
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-xl mb-12 lg:mb-16">
          <Eyebrow light>What's Next</Eyebrow>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
            What's growing next.
          </h2>
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