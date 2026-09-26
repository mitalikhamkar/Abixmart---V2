// src/pages/Shop.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import ProductCard from '@/components/abix/ProductCard';
import ShopQuickView from '@/components/abix/ShopQuickView';
import ComingSoonMiniCard from '@/components/abix/ComingSoonMiniCard';
import BrandStrip from '@/components/abix/BrandStrip';
import { products } from '@/data/products';
import { useAuth } from '@/lib/AuthContext';
import { checkNotifySubscribed, subscribeToNotify } from '@/lib/notifyUtils';
import { ABIX } from '@/components/abix/brandColors';
import { Check, X } from 'lucide-react';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

export default function Shop() {
  const { user } = useAuth();
  const [returnBanner, setReturnBanner] = useState(null);
  const [query, setQuery] = useState('');
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
    if (!q) return products;
    return products.filter((p) => {
      const haystack = [p.name, p.subtitle, p.category, p.shortDesc].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

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

      <section className="relative pt-24 lg:pt-28 pb-16 lg:pb-24 overflow-hidden" style={{ backgroundColor: ABIX.obsidian }}>
        {/* CHANGED: intro simplified to one short line instead of an
            eyebrow + heading + paragraph block — this is just the shop's
            label, not a landing section. */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10 text-center sm:text-left">
          <h1 className="font-display text-xl sm:text-2xl tracking-tight" style={{ color: ABIX.ivory }}>
            Shop ABIXMART
          </h1>
        </div>

        {/* Search — unchanged, left exactly as it was */}
        <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10 mt-6 flex justify-center sm:justify-start">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ABIX.ivory45 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the collection"
              className="w-full bg-transparent border-b py-3 pl-6 text-sm text-center sm:text-left focus:outline-none transition-colors"
              style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
            />
          </div>
        </div>

        {/* CHANGED: grid no longer special-cases a single product with
            max-w + mx-auto centering — that's what was placing Shilajit
            in the middle of the page. It's now a plain left-to-right,
            row-based grid at every count: 1 product sits at the start
            of row 1; a 2nd product will sit beside it in the same row;
            a 4th will start row 2 at the left, and so on automatically. */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 mt-12 lg:mt-16">
          {availableFiltered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
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
          className="relative py-14 lg:py-20 overflow-hidden grain"
          style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${ABIX.espresso} 100%)` }}
        >
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-8 lg:mb-10">
              <span className="text-[11px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>Coming Soon</span>
              <h2 className="mt-2 font-display text-2xl sm:text-3xl leading-tight tracking-tight" style={{ color: ABIX.ivory }}>
                What's next.
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {comingSoonFiltered.map((p) => (
                <ComingSoonMiniCard key={p.id} product={p} />
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