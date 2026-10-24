// src/components/abix/upcoming/UpcomingProductPage.jsx
//
// Full product page for a Coming Soon product (/shop/:slug). It replaces the
// old "This product isn't available yet" message and reuses the same content
// as the dialog.

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import ShopCollectionCard from '@/components/abix/ShopCollectionCard';
import UpcomingProductContent from '@/components/abix/upcoming/UpcomingProductContent';
import { useCatalog } from '@/lib/CatalogContext';
import { ABIX } from '@/components/abix/brandColors';

export default function UpcomingProductPage({ product }) {
  const { products } = useCatalog();
  const related = products.filter((p) => p.id !== product.id);

  return (
    <PageTransition>
      <section className="relative pt-16 lg:pt-20 pb-16 lg:pb-24 overflow-hidden" style={{ background: ABIX.obsidian }}>
        <div className="absolute inset-0 grain opacity-[0.04] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm transition-colors mb-8" style={{ color: ABIX.ivory45 }}>
            <ArrowLeft size={16} /> Back to shop
          </Link>
          <UpcomingProductContent product={product} headingId="upcoming-page-title" variant="page" />
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 lg:py-24 border-t" style={{ background: ABIX.espresso, borderColor: ABIX.ivory12 }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="max-w-2xl mb-10 lg:mb-14">
              <Eyebrow light>More From The Collection</Eyebrow>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl leading-tight" style={{ color: ABIX.ivory }}>
                Explore the rest of ABIXMART.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {related.map((p, i) => (
                <ShopCollectionCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PageTransition>
  );
}