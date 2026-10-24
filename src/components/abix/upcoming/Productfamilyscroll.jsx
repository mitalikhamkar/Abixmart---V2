// src/components/abix/upcoming/ProductFamilyScroll.jsx
//
// "What's growing next" product family. On large screens a pinned stage
// advances through the family as the visitor scrolls: Shilajit (available
// now) first, then each Coming Soon product. On small screens it becomes a
// stacked, reveal-on-scroll list.
//
// Data comes from the Firestore-backed catalog (useCatalog), the same source
// as the Shop and About marquee. Nothing is hard-coded or invented here.

import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useCatalog } from '@/lib/CatalogContext';
import { useUpcoming } from '@/lib/upcomingContext';
import { ABIX } from '@/components/abix/brandColors';

const EASE = [0.16, 1, 0.3, 1];
const pad = (n) => String(n).padStart(2, '0');
const isAvailableProduct = (p) => p.status === 'available';
const textOf = (p) => p.description || p.note || null;

function StatusPill({ available }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-luxe-sm"
      style={{ color: available ? ABIX.gold : ABIX.goldLight }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: available ? ABIX.gold : 'transparent', border: `1px solid ${ABIX.gold}` }}
      />
      {available ? 'Available now' : 'Coming Soon'}
    </span>
  );
}

function ItemActions({ item }) {
  const { openView, openPreOrder } = useUpcoming();

  if (isAvailableProduct(item)) {
    return (
      <div className="mt-8">
        <Link
          to={`/shop/${item.slug}`}
          className="inline-flex items-center justify-center h-12 px-8 text-[11px] font-semibold tracking-luxe-sm uppercase border transition-colors duration-300 hover:bg-white/10"
          style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
        >
          Explore product
          <span className="ml-3">→</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => openView(item)}
          className="inline-flex items-center justify-center h-12 px-7 text-[11px] font-semibold tracking-luxe-sm uppercase border transition-colors duration-300 hover:bg-white/10"
          style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
        >
          Discover
        </button>
        <button
          type="button"
          onClick={() => openPreOrder(item)}
          className="inline-flex items-center justify-center h-12 px-7 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
          style={{ background: ABIX.gold, color: ABIX.obsidian }}
          onMouseEnter={(e) => { e.currentTarget.style.background = ABIX.goldLight; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = ABIX.gold; }}
        >
          Pre-order
        </button>
      </div>
      <p className="mt-3 max-w-sm text-xs leading-relaxed" style={{ color: ABIX.ivory45 }}>
        Pre-order is an expression of interest only. It is not an order, a reservation or a payment.
      </p>
    </>
  );
}

function StageImage({ product, active, reduce }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial={false}
      animate={{
        opacity: active ? 1 : 0,
        clipPath: active ? 'inset(0% 0% 0% 0%)' : 'inset(5% 5% 5% 5%)',
      }}
      transition={{ duration: reduce ? 0.1 : 0.8, ease: EASE }}
      aria-hidden={!active}
    >
      {product.shopImage ? (
        <motion.img
          src={product.shopImage}
          alt={active ? product.name : ''}
          className="h-full w-full object-cover"
          initial={false}
          animate={{ scale: active || reduce ? 1 : 1.08 }}
          transition={{ duration: reduce ? 0 : 1.6, ease: EASE }}
        />
      ) : (
        <div
          className="h-full w-full flex items-center justify-center px-8 text-center"
          style={{ background: `linear-gradient(160deg, ${ABIX.espresso} 0%, ${ABIX.obsidian} 100%)` }}
        >
          <span className="font-display text-5xl" style={{ color: ABIX.ivory25 }}>{product.name}</span>
        </div>
      )}
    </motion.div>
  );
}

function MobileItem({ item, index, total }) {
  const available = isAvailableProduct(item);
  const text = textOf(item);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div
        className="relative aspect-[4/5] overflow-hidden"
        style={{ background: `linear-gradient(160deg, ${ABIX.espresso} 0%, ${ABIX.obsidian} 100%)` }}
      >
        {item.shopImage ? (
          <img src={item.shopImage} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center px-6 text-center">
            <span className="font-display text-4xl" style={{ color: ABIX.ivory25 }}>{item.name}</span>
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(0deg, ${ABIX.obsidian}CC 0%, transparent 50%)` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${ABIX.ivory12}` }} />
        {!available && (
          <span className="absolute bottom-4 right-4 text-[10px] tracking-wide" style={{ color: ABIX.ivory45 }}>
            Conceptual visual
          </span>
        )}
      </div>

      <div className="mt-6">
        <p className="font-grotesk text-xs tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
          {pad(index + 1)} / {pad(total)}
        </p>
        <div className="mt-3"><StatusPill available={available} /></div>
        <h3 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
          {item.name}
        </h3>
        {item.shortDesc && (
          <p className="mt-3 font-display text-xl italic" style={{ color: ABIX.goldLight }}>{item.shortDesc}</p>
        )}
        {text && (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>{text}</p>
        )}
        <ItemActions item={item} />
      </div>
    </motion.article>
  );
}

export default function ProductFamilyScroll() {
  const { availableProducts, comingSoonProducts } = useCatalog();
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const [active, setActive] = useState(0);

  const items = useMemo(
    () => [...availableProducts, ...comingSoonProducts],
    [availableProducts, comingSoonProducts]
  );

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const stageY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['3%', '-3%']);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (items.length === 0) return;
    const index = Math.min(items.length - 1, Math.max(0, Math.floor(v * items.length)));
    setActive((previous) => (previous === index ? previous : index));
  });

  if (items.length === 0) return null;

  const current = Math.min(active, items.length - 1);
  const item = items[current];
  const available = isAvailableProduct(item);
  const text = textOf(item);

  const scrollToItem = (i) => {
    const el = trackRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: top + ((i + 0.5) / items.length) * travel,
      behavior: reduce ? 'auto' : 'smooth',
    });
  };

  return (
    <>
      {/* Large screens: pinned stage that advances with scroll. */}
      <div
        ref={trackRef}
        className="relative hidden lg:block"
        style={{ height: `calc(${items.length} * 80vh + 20vh)` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div
            aria-hidden="true"
            className="absolute left-0 top-0 h-px w-full origin-left"
            style={{ scaleX: scrollYProgress, background: ABIX.gold }}
          />

          <div className="relative mx-auto h-full max-w-7xl px-10 grid grid-cols-12 gap-12 items-center">
            <div className="col-span-5">
              <p className="font-grotesk text-xs tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
                {pad(current + 1)} / {pad(items.length)}
              </p>

              <div className="mt-6 min-h-[24rem]" aria-live="polite">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduce ? 0 : -16 }}
                    transition={{ duration: reduce ? 0.1 : 0.5, ease: EASE }}
                  >
                    <StatusPill available={available} />
                    <h3
                      className="mt-5 font-display text-5xl xl:text-6xl leading-[1.02] tracking-tight"
                      style={{ color: ABIX.ivory }}
                    >
                      {item.name}
                    </h3>
                    {item.shortDesc && (
                      <p className="mt-4 font-display text-xl xl:text-2xl italic" style={{ color: ABIX.goldLight }}>
                        {item.shortDesc}
                      </p>
                    )}
                    {text && (
                      <p
                        className="mt-4 max-w-md text-base leading-relaxed"
                        style={{
                          color: ABIX.ivory70,
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {text}
                      </p>
                    )}
                    <ItemActions item={item} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="col-span-7">
              <motion.div style={{ y: stageY }} className="relative h-[64vh] w-full overflow-hidden">
                {items.map((p, i) => (
                  <StageImage key={p.id} product={p} active={i === current} reduce={reduce} />
                ))}
                <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(0deg, ${ABIX.obsidian}B3 0%, transparent 40%)` }} />
                <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 0 1px ${ABIX.ivory12}` }} />
                {['top-4 left-4 border-t border-l', 'top-4 right-4 border-t border-r', 'bottom-4 left-4 border-b border-l', 'bottom-4 right-4 border-b border-r'].map((pos) => (
                  <span key={pos} className={`absolute ${pos} w-5 h-5 pointer-events-none`} style={{ borderColor: ABIX.gold25 }} />
                ))}
                {!available && (
                  <span className="absolute bottom-6 right-7 text-[10px] tracking-wide" style={{ color: ABIX.ivory45 }}>
                    Conceptual visual
                  </span>
                )}
              </motion.div>

              <nav aria-label="Product family" className="mt-5 flex flex-wrap gap-x-7 gap-y-2">
                {items.map((p, i) => {
                  const on = i === current;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => scrollToItem(i)}
                      aria-current={on ? 'true' : undefined}
                      className="pb-1 text-sm transition-colors duration-300 border-b"
                      style={{
                        color: on ? ABIX.ivory : ABIX.ivory45,
                        borderColor: on ? ABIX.gold : 'transparent',
                      }}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Small screens: stacked, reveal on scroll. */}
      <div className="lg:hidden mx-auto max-w-7xl px-6 space-y-16">
        {items.map((p, i) => (
          <MobileItem key={p.id} item={p} index={i} total={items.length} />
        ))}
      </div>
    </>
  );
}