// src/components/abix/upcoming/livingCollection/CollectionParts.jsx
//
// Small pieces shared by the pinned (desktop) and stacked (mobile) layouts.

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUpcoming } from '@/lib/Upcomingcontext';
import { ABIX } from '@/components/abix/brandColors';
import Botanical from '@/components/abix/upcoming/livingCollection/Botanicals';
import { FOCUS_RING, FOREST, isAvailableProduct } from '@/components/abix/upcoming/livingCollection/theme';

export function StatusPill({ available }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-luxe-sm"
      style={{ color: available ? ABIX.gold : ABIX.goldLight }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: available ? ABIX.gold : 'transparent', border: `1px solid ${ABIX.gold}` }}
      />
      {available ? 'Available now' : 'Coming Soon · In development'}
    </span>
  );
}

export function ConceptualTag({ className = '' }) {
  return (
    <span
      className={`text-[10px] tracking-wide ${className}`}
      style={{ color: ABIX.ivory70, textShadow: '0 1px 6px rgba(0,0,0,0.7)' }}
    >
      Conceptual visual
    </span>
  );
}

const hashId = (id = '') => Array.from(String(id)).reduce((n, c) => n + c.charCodeAt(0), 0);

// Fills its (relatively positioned) parent. Shows the product image when it
// loads; if the product has no image or the file fails to load, it shows
// original botanical artwork with the product name instead of an empty box.
export function ProductImage({ product, alt = '', eager = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [product.shopImage]);

  if (!product.shopImage || failed) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center px-4 text-center"
        style={{ background: `linear-gradient(160deg, ${FOREST.moss} 0%, ${FOREST.deepest} 100%)` }}
      >
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-[80%] w-[55%] -translate-x-1/2"
          style={{ color: FOREST.leaf, opacity: 0.5 }}
        >
          <Botanical variant={hashId(product.id)} className="h-full w-full" />
        </div>
        <span className="relative font-display text-3xl" style={{ color: ABIX.ivory70 }}>{product.name}</span>
      </div>
    );
  }

  return (
    <img
      src={product.shopImage}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

// Discover works for every product. Pre-order interest is offered only for
// products that are still Coming Soon (the same rule the dialogs enforce).
export function ItemActions({ item }) {
  const { openView, openPreOrder } = useUpcoming();
  const baseBtn = `inline-flex items-center justify-center h-12 px-7 text-[11px] font-semibold tracking-luxe-sm uppercase border transition-colors duration-300 hover:bg-white/10 ${FOCUS_RING}`;

  if (isAvailableProduct(item)) {
    return (
      <div className="mt-8">
        <Link to={`/shop/${item.slug}`} className={baseBtn} style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}>
          Discover
          <span className="ml-3" aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  const eligible = item.status === 'coming_soon';
  return (
    <>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openView(item)}
          className={baseBtn}
          style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
        >
          Discover
        </button>
        {eligible && (
          <button
            type="button"
            onClick={() => openPreOrder(item)}
            className={`inline-flex items-center justify-center h-12 px-7 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300 ${FOCUS_RING}`}
            style={{ background: ABIX.gold, color: FOREST.deepest }}
            onMouseEnter={(e) => { e.currentTarget.style.background = ABIX.goldLight; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ABIX.gold; }}
          >
            Pre-order
          </button>
        )}
      </div>
      {eligible && (
        <p className="mt-3 max-w-sm text-xs leading-relaxed" style={{ color: ABIX.ivory45 }}>
          Pre-order is an expression of interest only. It is not an order, a reservation or a payment.
        </p>
      )}
    </>
  );
}

// The collection-wide closing visual: every product side by side. Each card
// links to its product page.
export function FinaleGallery({ items, cols, stagger = false }) {
  return (
    <ul
      className="grid gap-3 lg:gap-4 w-full"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map((p, i) => {
        const available = isAvailableProduct(p);
        return (
          <li key={p.id} style={{ marginTop: stagger && i % 2 === 1 ? '2.5rem' : 0 }}>
            <Link
              to={`/shop/${p.slug}`}
              className={`group block ${FOCUS_RING}`}
              aria-label={`${p.name}${available ? '' : ', coming soon'}`}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  aspectRatio: '3 / 4',
                  background: `linear-gradient(160deg, ${FOREST.moss} 0%, ${FOREST.deepest} 100%)`,
                  boxShadow: `inset 0 0 0 1px ${ABIX.ivory12}`,
                }}
              >
                <ProductImage product={p} />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `linear-gradient(0deg, ${FOREST.deepest}CC 0%, transparent 45%)` }}
                />
                {!available && <ConceptualTag className="absolute bottom-2 right-2 text-[9px]" />}
              </div>
              <p className="mt-3 font-display text-lg leading-tight" style={{ color: ABIX.ivory }}>{p.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
                {available ? 'Available now' : 'In development'}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}