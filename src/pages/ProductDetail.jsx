import React, { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Minus, Plus, ArrowLeft, Heart, ShoppingBag, Check, BookOpen } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import ProductReviews from '@/components/abix/reviews/ProductReviews';
import ProductGallery from '@/components/abix/shop/ProductGallery';
import GrowingBridge from '@/components/abix/shop/GrowingBridge';
import WhatsGrowingNext from '@/components/abix/WhatsGrowingNext';
import { getProductGallery } from '@/lib/productGallery';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { openProductTabs } from '@/data/products';
import { useCatalog } from '@/lib/CatalogContext';
import { useShop } from '@/lib/ShopContext';
import { ABIX } from '@/components/abix/brandColors';

import collectionImg from '@/assets/shilajit-steps/collection.png';
import purificationImg from '@/assets/shilajit-steps/purification.png';
import testingImg from '@/assets/shilajit-steps/testing.png';
import readyImg from '@/assets/shilajit-steps/ReadyToReach.jpeg';

const INK = ABIX.obsidian;
const GRAPHITE = ABIX.espresso;
const IVORY = ABIX.ivory;
const MUTED = ABIX.ivory45;
const AMBER = ABIX.goldLight;
const AMBER_FILL = ABIX.gold;

const TAB_IMAGES = {
  source: collectionImg,
  process: purificationImg,
  quality: testingImg,
  use: readyImg,
};

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { loading, getProductBySlug } = useCatalog();
  const product = getProductBySlug(slug);
  const { addToCart, toggleWishlist, isInWishlist } = useShop();

  // G3: variants come from the Firestore product document. The default
  // option is the variant that matches the product's base price, else the
  // first one. A product with no variants is bought at its base price.
  const variants = product?.variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const selectedVariant =
    variants.find((v) => v.id === selectedVariantId) ||
    variants.find((v) => v.price === product?.price) ||
    variants[0] ||
    null;
  const [packQty, setPackQty] = useState(1);
  const [tab, setTab] = useState('source');

  const rootRef = useRef(null);
  const gallery = useMemo(() => getProductGallery(product), [product]);
  useScrollReveal(rootRef, { ready: !loading && Boolean(product) });

  if (loading) {
    return (
      <PageTransition>
        <section className="min-h-[70vh] flex items-center justify-center text-center px-6" style={{ background: INK }}>
          <p className="text-sm uppercase tracking-luxe-sm" style={{ color: MUTED }}>Loading…</p>
        </section>
      </PageTransition>
    );
  }

  if (!product || product.status === 'coming_soon') {
    return (
      <PageTransition>
        <section className="min-h-[70vh] flex items-center justify-center text-center px-6" style={{ background: INK }}>
          <div>
            <p className="font-display text-3xl" style={{ color: IVORY }}>This product isn't available yet.</p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center justify-center h-12 px-7 text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
              style={{ background: AMBER_FILL, color: INK }}
            >
              Back to shop
            </Link>
          </div>
        </section>
      </PageTransition>
    );
  }

  const activeTab = openProductTabs.find((t) => t.key === tab);

  const unitPrice = selectedVariant ? selectedVariant.price : product.price;
  const unitOriginal = selectedVariant ? selectedVariant.originalPrice : product.mrp;
  const unitNote = selectedVariant ? selectedVariant.note : '';
  const canBuy = unitPrice !== null && unitPrice !== undefined;
  // The Origin / Process / Quality / Use story is Shilajit-specific editorial
  // content (openProductTabs), so other products do not show it.
  const hasProductStory = product.slug === 'shilajit';
  const wishlisted = isInWishlist(product.id);

  // CHANGED: navigates to /cart after adding, instead of relying on
  // ShopContext to open CartDrawer (which no longer happens — see
  // ShopContext.jsx's addToCart).
  const handleAddToCart = () => {
    addToCart(
      product.id,
      packQty,
      selectedVariant
        ? { id: selectedVariant.id, label: selectedVariant.name, price: selectedVariant.price }
        : null
    );
    navigate('/cart');
  };

  const handleSendInquiry = () => {
    navigate(`/support?product=${product.slug}&quantity=${selectedVariant ? selectedVariant.jars : 1}#inquiry`);
  };

  return (
    <PageTransition>
      <div ref={rootRef}>
        <section className="relative pt-20 lg:pt-24 pb-16 lg:pb-24 overflow-x-clip" style={{ background: INK }}>
          <div className="absolute inset-0 grain opacity-[0.04] pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <Link
              to="/shop"
              className={`inline-flex items-center gap-2 min-h-[44px] text-sm transition-colors mb-4 ${FOCUS_RING}`}
              style={{ color: MUTED }}
            >
              <ArrowLeft size={16} /> Back to shop
            </Link>

            <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-2 gap-10 lg:gap-20 items-start">
              <div className="w-full max-w-md mx-auto lg:mx-0 lg:sticky lg:top-24">
                <ProductGallery
                  images={gallery}
                  arch
                  reveal
                  aspect="4 / 5"
                  label={`${product.name} images`}
                  toolbar={
                    <button
                      type="button"
                      onClick={() => toggleWishlist(product.id)}
                      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                      aria-pressed={wishlisted}
                      className={`h-11 w-11 inline-flex items-center justify-center rounded-full border transition-colors ${FOCUS_RING}`}
                      style={{ borderColor: ABIX.ivory25, color: wishlisted ? AMBER : IVORY }}
                    >
                      <Heart size={16} className={wishlisted ? 'fill-current' : ''} />
                    </button>
                  }
                />
              </div>

              <div>
                <div data-reveal className="flex items-center gap-4">
                  <span data-line className="block h-px w-14" style={{ backgroundColor: AMBER_FILL }} />
                  <Eyebrow light>Signature Ritual</Eyebrow>
                </div>
                <h1
                  data-reveal
                  data-reveal-delay="0.08"
                  className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight"
                  style={{ color: IVORY }}
                >
                  {product.name}
                </h1>
                <p data-reveal data-reveal-delay="0.14" className="mt-2 font-display text-xl lg:text-2xl italic" style={{ color: AMBER }}>
                  {product.subtitle}
                </p>
                <p data-reveal data-reveal-delay="0.2" className="mt-5 text-base leading-relaxed max-w-md" style={{ color: `${IVORY}B3` }}>
                  {product.description}
                </p>

                <dl data-reveal data-reveal-delay="0.26" className="mt-7 grid grid-cols-2 gap-x-8 gap-y-4 max-w-md">
                  {product.facts.map((f) => (
                    <div key={f.label} className="border-t pt-3" style={{ borderColor: `${IVORY}1A` }}>
                      <dt className="label-meta" style={{ color: MUTED }}>{f.label}</dt>
                      <dd className="mt-0.5 font-display text-base" style={{ color: IVORY }}>{f.value}</dd>
                    </div>
                  ))}
                </dl>

                {variants.length > 0 && (
                  <div data-reveal className="mt-9">
                    <span className="label-meta" style={{ color: MUTED }}>Choose your ritual</span>
                    <div role="radiogroup" aria-label="Choose your ritual" className="mt-3 space-y-2.5">
                      {variants.map((b) => {
                        const active = selectedVariant?.id === b.id;
                        const sub = [b.detail, b.note].filter(Boolean).join(' · ');
                        return (
                          <button
                            key={b.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setSelectedVariantId(b.id)}
                            className={`w-full flex items-center justify-between gap-4 p-4 border transition-colors duration-300 rounded-lg ${FOCUS_RING}`}
                            style={{
                              borderColor: active ? AMBER : `${IVORY}1F`,
                              background: active ? `${AMBER}0F` : 'transparent',
                            }}
                          >
                            <span className="text-left">
                              <span className="font-display text-lg" style={{ color: IVORY }}>{b.name}</span>
                              {sub && <span className="block text-xs mt-0.5" style={{ color: MUTED }}>{sub}</span>}
                            </span>
                            <span className="text-right shrink-0">
                              <span className="font-price text-xl" style={{ color: IVORY }}>₹{b.price}</span>
                              {b.originalPrice ? (
                                <span className="block text-xs line-through" style={{ color: MUTED }}>₹{b.originalPrice}</span>
                              ) : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {canBuy && (
                  <>
                    <div data-reveal className="mt-7 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-price text-3xl" style={{ color: IVORY }}>₹{unitPrice}</span>
                      {unitOriginal ? (
                        <span className="text-lg line-through" style={{ color: MUTED }}>₹{unitOriginal}</span>
                      ) : null}
                      {unitNote ? (
                        <span className="text-sm font-semibold" style={{ color: AMBER }}>{unitNote}</span>
                      ) : null}
                    </div>

                    <div data-reveal className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
                      <div className="inline-flex items-center border h-14 rounded-lg" style={{ borderColor: `${IVORY}30` }}>
                        <button
                          type="button"
                          onClick={() => setPackQty((q) => Math.max(1, q - 1))}
                          className={`h-full w-12 inline-flex items-center justify-center transition-colors ${FOCUS_RING}`}
                          style={{ color: IVORY }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-10 text-center font-price text-xl" style={{ color: IVORY }} aria-live="polite">{packQty}</span>
                        <button
                          type="button"
                          onClick={() => setPackQty((q) => q + 1)}
                          className={`h-full w-12 inline-flex items-center justify-center transition-colors ${FOCUS_RING}`}
                          style={{ color: IVORY }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <span className="font-price text-2xl" style={{ color: IVORY }}>
                        Subtotal: ₹{unitPrice * packQty}
                      </span>
                    </div>

                    <div data-reveal className="mt-7">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className={`group w-full sm:w-auto inline-flex items-center justify-center gap-3 h-14 px-9 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full transition-colors duration-300 hover:brightness-110 ${FOCUS_RING}`}
                        style={{ background: AMBER_FILL, color: INK }}
                      >
                        <ShoppingBag size={16} />
                        Add to Cart
                      </button>
                    </div>
                  </>
                )}

                <div data-reveal className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  {product.howToTakeRoute && (
                    <Link
                      to={product.howToTakeRoute}
                      className={`inline-flex items-center justify-center gap-2 h-12 px-6 text-[11px] font-semibold tracking-luxe-sm uppercase border rounded-full transition-colors duration-300 hover:bg-[rgba(199,174,125,0.08)] ${FOCUS_RING}`}
                      style={{ borderColor: `${AMBER}60`, color: AMBER, background: 'transparent' }}
                    >
                      <BookOpen size={15} />
                      How To Take Shilajit
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={handleSendInquiry}
                    className={`min-h-[44px] text-sm underline underline-offset-4 transition-colors ${FOCUS_RING}`}
                    style={{ color: MUTED }}
                  >
                    Or send a product inquiry
                  </button>
                </div>

                <ul data-reveal className="mt-8 space-y-3">
                  {product.howToUse.map((h) => (
                    <li key={h} className="flex gap-3 text-sm leading-relaxed" style={{ color: `${IVORY}CC` }}>
                      <Check size={15} className="mt-0.5 shrink-0" style={{ color: AMBER }} />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {hasProductStory && (
          <section className="py-16 lg:py-24 border-t" style={{ background: GRAPHITE, borderColor: `${IVORY}0D` }}>
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <div className="max-w-2xl mb-10 lg:mb-14">
                <div data-reveal className="flex items-center gap-4">
                  <span data-line className="block h-px w-14" style={{ backgroundColor: AMBER_FILL }} />
                  <Eyebrow light>The Product Story</Eyebrow>
                </div>
                <h2
                  data-reveal
                  data-reveal-delay="0.08"
                  className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
                  style={{ color: IVORY }}
                >
                  Origin. Process. Quality. Use.
                </h2>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-8 lg:gap-16 items-stretch">
                <div
                  role="tablist"
                  aria-label="Product story"
                  className="lg:col-span-5 flex lg:flex-col gap-2 lg:gap-0 overflow-x-auto no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0"
                >
                  {openProductTabs.map((t, i) => {
                    const on = t.key === tab;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        role="tab"
                        id={`story-tab-${t.key}`}
                        aria-selected={on}
                        aria-controls="story-panel"
                        onClick={() => setTab(t.key)}
                        className={`group shrink-0 text-left py-3 lg:py-6 px-3 lg:px-0 lg:border-b transition-colors duration-300 ${FOCUS_RING}`}
                        style={{ borderColor: `${IVORY}14`, color: on ? IVORY : MUTED }}
                      >
                        <div className="flex items-baseline gap-4 lg:justify-between">
                          <span className="flex items-baseline gap-3">
                            <span className="font-grotesk text-[10px] tracking-luxe-sm" style={{ color: AMBER_FILL }}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="font-display text-2xl lg:text-4xl leading-tight whitespace-nowrap">{t.label}</span>
                          </span>
                          <span
                            aria-hidden="true"
                            className="hidden lg:block text-2xl transition-transform duration-300"
                            style={{ color: on ? AMBER : MUTED, opacity: on ? 1 : 0, transform: on ? 'translateX(4px)' : 'translateX(0)' }}
                          >
                            →
                          </span>
                        </div>
                        <span
                          aria-hidden="true"
                          className="block h-px mt-3 transition-[width] duration-700 ease-out"
                          style={{ width: on ? '100%' : '0%', background: AMBER_FILL }}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="lg:col-span-7">
                  <div
                    id="story-panel"
                    role="tabpanel"
                    aria-labelledby={`story-tab-${tab}`}
                    className="relative h-full min-h-[380px] lg:min-h-[440px] overflow-hidden grain"
                    style={{ background: INK }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={tab}
                        src={TAB_IMAGES[tab]}
                        alt={activeTab.label}
                        initial={{ opacity: 0, scale: reduce ? 1 : 1.08 }}
                        animate={{ opacity: 0.45, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: reduce ? 0.2 : 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${INK} 10%, ${INK}B3 55%, ${INK}66 100%)` }} />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: reduce ? 0 : 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -16 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 h-full min-h-[380px] lg:min-h-[440px] flex flex-col justify-end p-7 lg:p-12"
                      >
                        <span className="label-meta" style={{ color: AMBER }}>{activeTab.label}</span>
                        <h3 className="mt-4 font-display text-3xl lg:text-4xl leading-tight" style={{ color: IVORY }}>{activeTab.title}</h3>
                        <p className="mt-4 text-base lg:text-lg leading-relaxed max-w-md" style={{ color: `${IVORY}CC` }}>{activeTab.body}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* H1.1: customer reviews for this product (approved reviews only). */}
        <ProductReviews product={product} />

        {/* Replaces the old related-products grid: a short bridge, then the
            existing upcoming-products experience (pre-order actions included). */}
        <GrowingBridge />
        <WhatsGrowingNext />
      </div>
    </PageTransition>
  );
}