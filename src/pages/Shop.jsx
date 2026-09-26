// src/pages/Shop.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import CollectionHero from '@/components/abix/CollectionHero';
import ProductCard from '@/components/abix/ProductCard';
import ShopQuickView from '@/components/abix/ShopQuickView';
import ShopCollectionCard from '@/components/abix/ShopCollectionCard';
import BrandStrip from '@/components/abix/BrandStrip';
import { products, categories } from '@/data/products';
import { useAuth } from '@/lib/AuthContext';
import { checkNotifySubscribed, subscribeToNotify } from '@/lib/notifyUtils';
import { ABIX } from '@/components/abix/brandColors';
import { Check, X } from 'lucide-react';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

export default function Shop() {
  const { user } = useAuth();
  const [returnBanner, setReturnBanner] = useState(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  useEffect(() => {
    const pendingId = sessionStorage.getItem(PENDING_NOTIFY_KEY);
    if (!pendingId || !user) return;
    (async () => {
      const product = products.find((p) => p.id === pendingId);
      sessionStorage.removeItem(PENDING_NOTIFY_KEY);
      if (!product) return;
      try {
        const already = await checkNotifySubscribed(user.uid, product.id);
        if (!already) {
          await subscribeToNotify(user.uid, user.email, product.id, product.name);
        }
        setReturnBanner(product.name);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Pending notify resume failed:', err?.code, err?.message);
      }
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const haystack = [p.name, p.subtitle, p.category, p.shortDesc].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, activeCategory]);

  const availableFiltered = filtered.filter((p) => p.status === 'available');
  const comingSoonFiltered = filtered.filter((p) => p.status === 'coming_soon');
  const noResults = filtered.length === 0;

  return (
    <PageTransition>
      {returnBanner && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 border px-5 py-3.5 flex items-center gap-3 shadow-lg"
          style={{ backgroundColor: ABIX.obsidian, borderColor: ABIX.gold25, color: ABIX.ivory }}
        >
          <Check size={16} style={{ color: ABIX.gold }} className="shrink-0" />
          <span className="text-sm">
            You're on the list for <strong>{returnBanner}</strong>.
          </span>
          <button onClick={() => setReturnBanner(null)} className="ml-2 transition-colors" style={{ color: ABIX.ivory45 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* CHANGED: CollectionHero restored (recolored onto ABIX tokens) in
          place of the custom intro from last message — it already had
          the intro copy, hero image, and the clickable collection index
          that anchor-scrolls to each product card below. Reusing working
          code instead of duplicating it. */}
      <CollectionHero products={products} />

      {/* ============ SEARCH + CATEGORY CONTROLS ============ */}
      <section className="relative py-8 lg:py-10 overflow-hidden" style={{ backgroundColor: ABIX.deep }}>
        <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
          <div className="relative flex-1 sm:max-w-xs">
            <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ABIX.ivory45 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the collection"
              className="w-full bg-transparent border-b py-3 pl-6 text-sm focus:outline-none transition-colors"
              style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
            />
          </div>

          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar sm:justify-end">
            {categories.map((c) => {
              const active = activeCategory === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCategory(c.key)}
                  className="shrink-0 h-9 px-4 text-[11px] font-semibold tracking-luxe-sm uppercase border transition-colors duration-300"
                  style={{
                    borderColor: active ? ABIX.gold : ABIX.ivory25,
                    color: active ? ABIX.gold : ABIX.ivory70,
                    backgroundColor: active ? ABIX.gold15 : 'transparent',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ AVAILABLE PRODUCTS ============ */}
      <section className="relative py-16 lg:py-24 overflow-hidden" style={{ backgroundColor: ABIX.deep }}>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
          {availableFiltered.length > 0 && (
            <div
              className={`grid gap-8 lg:gap-10 ${
                availableFiltered.length === 1 ? 'max-w-xl mx-auto' : 'sm:grid-cols-2 lg:grid-cols-3'
              }`}
            >
              {availableFiltered.map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={() => setQuickViewProduct(p)} />
              ))}
            </div>
          )}

          {noResults && (
            <p className="text-center py-10" style={{ color: ABIX.ivory45 }}>
              Nothing matches "{query}" right now.
            </p>
          )}
        </div>
      </section>

      {comingSoonFiltered.length > 0 && (
        <section
          className="relative py-16 lg:py-24 overflow-hidden grain"
          style={{ background: `linear-gradient(180deg, ${ABIX.deep} 0%, ${ABIX.espresso} 35%, ${ABIX.espresso} 65%, ${ABIX.deep} 100%)` }}
        >
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="max-w-xl mb-10 lg:mb-14">
              <span className="text-[11px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>Coming Soon</span>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl leading-tight tracking-tight" style={{ color: ABIX.ivory }}>
                The collection is still growing.
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {comingSoonFiltered.map((p, i) => (
                <ShopCollectionCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <BrandStrip />

      {quickViewProduct && (
        <ShopQuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </PageTransition>
  );
}