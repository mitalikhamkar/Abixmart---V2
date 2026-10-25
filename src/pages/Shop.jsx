// src/pages/Shop.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Eye, Heart, Search, X } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import PageTransition from '@/components/abix/PageTransition';
import ProductCard from '@/components/abix/ProductCard';
import ShopQuickView from '@/components/abix/ShopQuickView';
import BrandStrip from '@/components/abix/BrandStrip';
import WhatsGrowingNext from '@/components/abix/WhatsGrowingNext';
import LeafShadow from '@/components/abix/home/LeafShadow';
import ProductGallery from '@/components/abix/shop/ProductGallery';
import { getProductGallery } from '@/lib/productGallery';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCatalog } from '@/lib/CatalogContext';
import { useAuth } from '@/lib/AuthContext';
import { useShop } from '@/lib/ShopContext';
import { checkNotifySubscribed, subscribeToNotify } from '@/lib/notifyUtils';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

// Lowest current price across the product and its variants (real data only).
function startingFrom(product) {
  const options = [];
  if (Number.isFinite(product.price)) options.push({ price: product.price, mrp: product.mrp });
  (product.variants || []).forEach((v) => {
    if (Number.isFinite(v.price)) options.push({ price: v.price, mrp: v.originalPrice });
  });
  if (!options.length) return null;
  return options.reduce((a, b) => (b.price < a.price ? b : a));
}

function FeaturedProduct({ product, onQuickView }) {
  const { toggleWishlist, isInWishlist } = useShop();
  const wishlisted = isInWishlist(product.id);
  const gallery = useMemo(() => getProductGallery(product), [product]);
  const from = startingFrom(product);
  const facts = (product.facts || []).slice(0, 3);
  const lead = product.shortDesc || product.description;

  return (
    <div
      id={`product-${product.slug}`}
      // minmax(0, 1fr): on phones the single column can never grow wider than the screen
      className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-10 lg:gap-16 items-center scroll-mt-28"
    >
      <div className="lg:col-span-6 min-w-0">
        <div className="mx-auto w-full max-w-md lg:max-w-none lg:mx-0 lg:pr-6">
          <ProductGallery
            images={gallery}
            autoRotate
            reveal
            arch
            aspect="4 / 5"
            label={`${product.name} images`}
            toolbar={
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={wishlisted}
                className={`h-11 w-11 inline-flex items-center justify-center rounded-full border transition-colors ${FOCUS_RING}`}
                style={{ borderColor: ABIX.ivory25, color: wishlisted ? ABIX.gold : ABIX.ivory }}
              >
                <Heart size={16} className={wishlisted ? 'fill-current' : ''} />
              </button>
            }
          />
        </div>
      </div>

      <div className="lg:col-span-6 min-w-0">
        <div data-reveal className="flex items-center gap-4">
          <span data-line className="block h-px w-14" style={{ backgroundColor: ABIX.gold }} />
          <span className="inline-flex items-center gap-2 font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ABIX.gold }} />
            Available now
          </span>
        </div>

        <h2
          data-reveal
          data-reveal-delay="0.08"
          className="mt-5 font-display text-4xl sm:text-5xl xl:text-6xl leading-[1.02] tracking-tight"
          style={{ color: ABIX.ivory }}
        >
          {product.name}
        </h2>
        {product.subtitle && (
          <p data-reveal data-reveal-delay="0.14" className="mt-2 font-display text-xl lg:text-2xl italic" style={{ color: ABIX.goldLight }}>
            {product.subtitle}
          </p>
        )}
        {lead && (
          <p data-reveal data-reveal-delay="0.2" className="mt-5 max-w-md text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
            {lead}
          </p>
        )}

        {facts.length > 0 && (
          <dl data-reveal data-reveal-delay="0.26" className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-md">
            {facts.map((f) => (
              <div key={f.label} className="border-t pt-3 min-w-0" style={{ borderColor: ABIX.ivory12 }}>
                <dt className="label-meta" style={{ color: ABIX.ivory45 }}>{f.label}</dt>
                <dd className="mt-1 font-display text-base leading-snug" style={{ color: ABIX.ivory }}>{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {from && (
          <div data-reveal data-reveal-delay="0.32" className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="label-meta" style={{ color: ABIX.ivory45 }}>From</span>
            <span className="font-price text-4xl" style={{ color: ABIX.ivory }}>
              {product.currency}{from.price}
            </span>
            {from.mrp > from.price && (
              <span className="text-base line-through" style={{ color: ABIX.ivory45 }}>
                {product.currency}{from.mrp}
              </span>
            )}
          </div>
        )}

        {/* mobile: two full-width buttons, stacked. desktop: side by side */}
        <div data-reveal data-reveal-delay="0.38" className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link
            to={`/shop/${product.slug}`}
            className={`group inline-flex w-full sm:w-auto items-center justify-center h-14 px-8 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full transition-colors duration-300 hover:brightness-110 ${FOCUS_RING}`}
            style={{ background: ABIX.gold, color: FOREST.deepest }}
          >
            Discover the ritual
            <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            onClick={onQuickView}
            className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 h-14 px-8 text-[12px] font-semibold uppercase tracking-luxe-sm border rounded-full transition-colors duration-300 hover:bg-[rgba(199,174,125,0.08)] ${FOCUS_RING}`}
            style={{ color: ABIX.goldLight, borderColor: `${ABIX.goldLight}66` }}
          >
            <Eye size={15} /> Quick look
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  const { user } = useAuth();
  const { products, loading } = useCatalog();
  const [returnBanner, setReturnBanner] = useState(null);
  const [query, setQuery] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const rootRef = useRef(null);
  const leafRef = useRef(null);
  useScrollReveal(rootRef, { ready: !loading });

  // Restrained parallax: the drifting leaf light moves a little slower than the page.
  // Large screens only, so phones stay light.
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !leafRef.current) return;
      if (!window.matchMedia('(min-width: 1024px)').matches) return;
      gsap.to(leafRef.current, {
        yPercent: -14,
        ease: 'none',
        scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    },
    { scope: rootRef }
  );

  useEffect(() => {
    if (loading) return;
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
  }, [user, loading, products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const haystack = [p.name, p.subtitle, p.category, p.shortDesc].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, products]);

  const availableFiltered = filtered.filter((p) => p.status === 'available');
  const featured = availableFiltered[0] || null;
  const others = availableFiltered.slice(1);
  const searching = query.trim() !== '';
  const noResults = !loading && searching && availableFiltered.length === 0;
  const nothingAvailable = !loading && !searching && availableFiltered.length === 0;

  return (
    <PageTransition>
      {returnBanner && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] border px-5 py-3.5 flex items-center gap-3 shadow-lg"
          style={{ backgroundColor: ABIX.obsidian, borderColor: ABIX.gold25, color: ABIX.ivory }}
        >
          <Check size={16} style={{ color: ABIX.gold }} className="shrink-0" />
          <span className="text-sm">
            You're on the list for <strong>{returnBanner}</strong>.
          </span>
          <button onClick={() => setReturnBanner(null)} aria-label="Dismiss" className="ml-2 transition-colors" style={{ color: ABIX.ivory45 }}>
            <X size={14} />
          </button>
        </div>
      )}

      <div ref={rootRef}>
        <section
          className="relative pt-24 lg:pt-36 pb-16 lg:pb-28 overflow-x-clip grain"
          style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deep} 55%, ${FOREST.deepest} 100%)` }}
        >
          <div ref={leafRef} className="absolute inset-0 pointer-events-none">
            <LeafShadow side="right" opacity={0.06} className="inset-x-0 top-0 h-[75%]" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            {/* introduction + secondary search */}
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 lg:gap-12">
              <div className="max-w-2xl min-w-0">
                <div data-reveal className="flex items-center gap-4">
                  <span data-line className="block h-px w-14" style={{ backgroundColor: ABIX.gold }} />
                  <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
                    The Collection
                  </span>
                </div>
                <h1
                  data-reveal
                  data-reveal-delay="0.08"
                  className="mt-5 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.0] tracking-tight"
                  style={{ color: ABIX.ivory }}
                >
                  Begin with <span className="italic" style={{ color: ABIX.gold }}>one.</span>
                </h1>
                <p data-reveal data-reveal-delay="0.16" className="mt-5 max-w-md text-base lg:text-lg leading-relaxed" style={{ color: ABIX.ivory70 }}>
                  Our collection starts with a single, considered ritual. More are growing in the same tradition.
                </p>
              </div>

              <div data-reveal data-reveal-delay="0.2" className="relative w-full sm:max-w-[16rem]">
                <label htmlFor="shop-search" className="sr-only">Search the collection</label>
                <Search size={15} className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ABIX.ivory45 }} />
                <input
                  id="shop-search"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the collection"
                  className="w-full bg-transparent border-b py-2.5 pl-6 text-sm focus:outline-none focus:border-[#B49A62] transition-colors placeholder:text-[rgba(230,225,213,0.4)]"
                  style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
                />
              </div>
            </div>

            {/* featured experience */}
            <div className="mt-12 lg:mt-20">
              {loading && (
                <p className="text-center py-16" style={{ color: ABIX.ivory45 }}>Loading the collection…</p>
              )}

              {featured && <FeaturedProduct product={featured} onQuickView={() => setQuickViewProduct(featured)} />}

              {others.length > 0 && (
                <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                  {others.map((p) => (
                    <ProductCard key={p.id} product={p} onQuickView={() => setQuickViewProduct(p)} />
                  ))}
                </div>
              )}

              {noResults && (
                <div className="text-center py-12">
                  <p style={{ color: ABIX.ivory45 }}>Nothing matches "{query}" right now.</p>
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className={`mt-3 min-h-[44px] text-sm underline underline-offset-4 ${FOCUS_RING}`}
                    style={{ color: ABIX.goldLight }}
                  >
                    Clear search
                  </button>
                </div>
              )}

              {nothingAvailable && (
                <p className="text-center py-12" style={{ color: ABIX.ivory45 }}>
                  Nothing is available to order right now. See what's growing next below.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* "What's Growing Next": the existing pre-order experience, unchanged */}
        <WhatsGrowingNext />

        <BrandStrip />
      </div>

      {quickViewProduct && (
        <ShopQuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </PageTransition>
  );
}