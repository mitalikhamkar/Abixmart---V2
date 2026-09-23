// src/pages/ProductDetail.jsx — only the info column changed, rest identical to before
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, ArrowLeft, Heart, Send, Check, BookOpen } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import ShopCollectionCard from '@/components/abix/ShopCollectionCard';
import { getProductBySlug, products, openProductTabs, ritualBundles } from '@/data/products';
import { useShop } from '@/lib/ShopContext';

import collectionImg from '@/assets/shilajit-steps/collection.png';
import purificationImg from '@/assets/shilajit-steps/purification.png';
import testingImg from '@/assets/shilajit-steps/testing.png';
import readyImg from '@/assets/shilajit-steps/ReadyToReach.jpeg';

const INK = '#151417';
const GRAPHITE = '#1E1C1F';
const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';
const AMBER = '#D3A467';
const AMBER_FILL = '#BE8A4B';

const TAB_IMAGES = {
  source: collectionImg,
  process: purificationImg,
  quality: testingImg,
  use: readyImg,
};

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const product = getProductBySlug(slug);
  const { toggleWishlist, isInWishlist } = useShop();
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('source');

  if (!product || product.status === 'coming_soon') {
    return (
      <PageTransition>
        <section
          className="min-h-[70vh] flex items-center justify-center text-center px-6"
          style={{ background: INK }}
        >
          <div>
            <p className="font-display text-3xl" style={{ color: IVORY }}>
              This product isn't available yet.
            </p>
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
  const related = products.filter((p) => p.id !== product.id);

  const handleSendInquiry = () => {
    navigate(`/support?product=${product.slug}&quantity=${qty}#inquiry`);
  };

  return (
    <PageTransition>
      <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-24 overflow-hidden" style={{ background: INK }}>
        <div className="absolute inset-0 grain opacity-[0.04] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm transition-colors mb-8"
            style={{ color: MUTED }}
          >
            <ArrowLeft size={16} /> Back to shop
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div
                className="relative aspect-[4/5] overflow-hidden group"
                style={{ background: `linear-gradient(160deg, ${GRAPHITE} 0%, ${INK} 100%)` }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 50% 40%, ${AMBER}18, transparent 65%)` }}
                />
                {product.shopImage && (
                  <img
                    src={product.shopImage}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.035]"
                  />
                )}
                {['top-4 left-4 border-t border-l', 'top-4 right-4 border-t border-r', 'bottom-4 left-4 border-b border-l', 'bottom-4 right-4 border-b border-r'].map(
                  (pos) => (
                    <span
                      key={pos}
                      className={`absolute ${pos} w-5 h-5 pointer-events-none`}
                      style={{ borderColor: `${AMBER}50` }}
                    />
                  )
                )}
                <span
                  className="absolute top-4 left-1/2 -translate-x-1/2 label-meta px-2.5 py-1"
                  style={{ background: `${INK}B3`, color: AMBER }}
                >
                  Available
                </span>
              </div>
            </motion.div>

            <div>
              <Eyebrow light>Signature Ritual</Eyebrow>
              <h1
                className="mt-5 font-display text-4xl sm:text-5xl lg:text-[56px] leading-[1.02] tracking-tight"
                style={{ color: IVORY }}
              >
                {product.name}
              </h1>
              <p className="mt-2 font-display text-2xl lg:text-3xl italic" style={{ color: AMBER }}>
                {product.subtitle}
              </p>
              <p className="mt-7 text-lg leading-relaxed max-w-md" style={{ color: `${IVORY}B3` }}>
                {product.description}
              </p>

              <dl className="mt-9 grid grid-cols-2 gap-x-8 gap-y-5 max-w-md">
                {product.facts.map((f) => (
                  <div key={f.label} className="border-t pt-3" style={{ borderColor: `${IVORY}1A` }}>
                    <dt className="label-meta" style={{ color: MUTED }}>{f.label}</dt>
                    <dd className="mt-1 font-display text-lg" style={{ color: IVORY }}>{f.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-9">
                <span className="label-meta" style={{ color: MUTED }}>Quantity guide</span>
                <div className="mt-3 space-y-2">
                  {ritualBundles.map((b) => (
                    <button
                      key={b.name}
                      onClick={() => setQty(b.jars)}
                      className="w-full flex items-center justify-between p-4 border transition-colors"
                      style={{
                        borderColor: qty === b.jars ? AMBER : `${IVORY}1F`,
                        background: qty === b.jars ? `${AMBER}0F` : 'transparent',
                      }}
                    >
                      <span className="text-left">
                        <span className="font-display text-lg" style={{ color: IVORY }}>{b.name}</span>
                        <span className="block text-xs" style={{ color: MUTED }}>{b.note}</span>
                      </span>
                      <span className="font-price text-xl" style={{ color: IVORY }}>₹{b.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center gap-5">
                <div className="inline-flex items-center border h-14" style={{ borderColor: `${IVORY}30` }}>
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-full w-12 inline-flex items-center justify-center transition-colors"
                    style={{ color: IVORY }}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-price text-xl" style={{ color: IVORY }}>{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="h-full w-12 inline-flex items-center justify-center transition-colors"
                    style={{ color: IVORY }}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <span className="font-price text-3xl" style={{ color: IVORY }}>
                  {product.currency}{product.price * qty}
                </span>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="ml-auto h-14 w-14 inline-flex items-center justify-center border transition-colors"
                  style={{ borderColor: `${IVORY}20`, color: isInWishlist(product.id) ? AMBER : IVORY }}
                  aria-label="Wishlist"
                >
                  <Heart size={20} className={isInWishlist(product.id) ? 'fill-current' : ''} />
                </button>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleSendInquiry}
                  className="group inline-flex items-center justify-center gap-3 h-14 px-8 text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
                  style={{ background: AMBER_FILL, color: INK }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = AMBER; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = AMBER_FILL; }}
                >
                  <Send size={16} />
                  Send Product Inquiry
                </button>
                <p className="mt-2.5 text-xs" style={{ color: MUTED }}>
                  We'll follow up on availability and next steps directly.
                </p>
              </div>

              {/* NEW: real button (not a text link), sitting right next
                  to the inquiry CTA. Navigates with no ?age/?gender —
                  the dedicated page asks that itself. */}
              <div className="mt-4">
                <Link
                  to="/how-to-take-shilajit"
                  className="inline-flex items-center justify-center gap-2 h-14 px-8 text-[12px] font-semibold tracking-luxe-sm uppercase border transition-colors duration-300 w-full sm:w-auto"
                  style={{ borderColor: `${AMBER}60`, color: AMBER, background: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${AMBER}14`;
                    e.currentTarget.style.borderColor = AMBER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = `${AMBER}60`;
                  }}
                >
                  <BookOpen size={16} />
                  Let's See How To Take Shilajit
                </Link>
              </div>

              <ul className="mt-8 space-y-2.5">
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

      <section className="py-16 lg:py-24 border-t" style={{ background: GRAPHITE, borderColor: `${IVORY}0D` }}>
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl mb-10">
            <Eyebrow light>The Product Story</Eyebrow>
            <h2
              className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
              style={{ color: IVORY }}
            >
              Origin. Process. Quality. Use.
            </h2>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-stretch">
            <div className="lg:col-span-5 flex flex-col">
              {openProductTabs.map((t) => {
                const on = t.key === tab;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className="group text-left py-7 border-b transition-colors duration-300"
                    style={{ borderColor: `${IVORY}14`, color: on ? IVORY : MUTED }}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-3xl lg:text-4xl leading-tight">{t.label}</span>
                      <span
                        className="text-2xl transition-transform duration-300"
                        style={{
                          color: on ? AMBER : MUTED,
                          opacity: on ? 1 : 0,
                          transform: on ? 'translateX(4px)' : 'translateX(0)',
                        }}
                      >
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7">
              <div className="relative h-full min-h-[420px] overflow-hidden grain" style={{ background: INK }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={tab}
                    src={TAB_IMAGES[tab]}
                    alt={activeTab.label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.45 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </AnimatePresence>
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(0deg, ${INK} 10%, ${INK}B3 55%, ${INK}66 100%)` }}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-12"
                  >
                    <span className="label-meta" style={{ color: AMBER }}>{activeTab.label}</span>
                    <h3 className="mt-4 font-display text-3xl lg:text-4xl leading-tight" style={{ color: IVORY }}>
                      {activeTab.title}
                    </h3>
                    <p className="mt-4 text-lg leading-relaxed max-w-md" style={{ color: `${IVORY}CC` }}>
                      {activeTab.body}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-16 lg:py-24 border-t" style={{ background: '#1E1C1F', borderColor: `${IVORY}0D` }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="max-w-2xl mb-10 lg:mb-14">
              <Eyebrow light>More From The Collection</Eyebrow>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl leading-tight" style={{ color: IVORY }}>
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