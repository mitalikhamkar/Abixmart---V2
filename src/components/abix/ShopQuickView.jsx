// src/components/abix/ShopQuickView.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, BookOpen } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { useShop } from '@/lib/ShopContext';
import { ABIX } from './brandColors';

const HOW_TO_TAKE_ROUTES = {
  shilajit: '/how-to-take-shilajit',
};

// Info panel children reveal one-by-one (staggered), not all at once.
const infoContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const infoItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

// CHANGED: the center -> left layout move is handled entirely by
// Framer Motion's `layout` prop (FLIP-based, smoothly interpolates real
// layout every frame). The info content fades in AFTER the layout
// motion has settled, and each element (label, title, description,
// price, buttons) reveals in its own staggered step instead of
// popping in together.
//
// Scan effect: a thin gold line sweeps down the product 4 times while
// an ambient glow breathes behind it, then both fade out before the
// layout shifts left and the info panel reveals.
export default function ShopQuickView({ product, onClose }) {
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [phase, setPhase] = useState('scan'); // 'scan' | 'clearing' | 'info'

  const frameScopeRef = useRef(null);
  const imageRef = useRef(null);
  const scanOverlayRef = useRef(null);
  const pulseRef = useRef(null);
  const sweepRef = useRef(null);

  useEffect(() => {
    setPhase('scan');
  }, [product]);

  // Lock page scroll while the modal is open — the width-changing
  // layout animation on the image/info columns can overshoot by a
  // sub-pixel during the transition, which was showing up as a stray
  // horizontal scrollbar on the page behind the modal.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // Phase 1: product frame appears, a thin gold line sweeps down the
  // product 4 times while the ambient glow breathes behind it, then
  // everything fades out into the info reveal.
  useGSAP(
    () => {
      if (phase !== 'scan') return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) {
        setPhase('info');
        return;
      }

      gsap.set(imageRef.current, { opacity: 0, scale: 0.85, rotation: -5, y: 16 });
      gsap.set(scanOverlayRef.current, { opacity: 0 });
      gsap.set(pulseRef.current, { opacity: 0, scale: 0.92 });
      gsap.set(sweepRef.current, { top: '86%', opacity: 0 });

      gsap
        .timeline({ onComplete: () => setPhase('clearing') })
        .to(imageRef.current, { opacity: 1, scale: 1, rotation: 0, y: 0, duration: 0.8, ease: 'power3.out' }, 0)
        .to(scanOverlayRef.current, { opacity: 1, duration: 0.4 }, 0.3)
        .to(pulseRef.current, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.5)
        .to(sweepRef.current, { opacity: 1, duration: 0.25 }, 0.5)
        // Up, down, up, down — a plain yoyo tween: it travels to the top,
        // reverses back to the bottom (yoyo), then repeats that same
        // up/down cycle once more (repeat: 3 = 4 passes total). Moderate
        // 0.9s per pass so it reads as a deliberate scan, not a flicker.
        .to(sweepRef.current, { top: '14%', duration: 0.9, ease: 'sine.inOut', repeat: 3, yoyo: true }, 0.6)
        .to([sweepRef.current, pulseRef.current], { opacity: 0, duration: 0.35 }, 4.1);
    },
    { scope: frameScopeRef, dependencies: [phase, product] }
  );

  // Phase 2: scan overlay group fades out fully, THEN unmounts —
  // guarantees nothing gold is ever left on the product.
  useGSAP(
    () => {
      if (phase !== 'clearing') return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        setPhase('info');
        return;
      }
      gsap.to(scanOverlayRef.current, {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => setPhase('info'),
      });
    },
    { scope: frameScopeRef, dependencies: [phase] }
  );

  const showInfo = phase === 'info';
  const showScanOverlay = phase !== 'info';
  const howToTakeRoute = product.howToTakeRoute || HOW_TO_TAKE_ROUTES[product.slug];

  const handleAddToCart = () => {
    addToCart(product.id, 1);
    onClose();
  };

  const handleHowToTake = () => {
    if (!howToTakeRoute) return;
    navigate(howToTakeRoute);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: `${ABIX.obsidian}CC` }} onClick={onClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl overflow-y-auto overflow-x-hidden max-h-[92vh]"
        style={{ backgroundColor: ABIX.obsidian }}
      >
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-30 p-2 transition-colors"
          style={{ color: ABIX.ivory45 }}
        >
          <X size={18} />
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Image column */}
          <motion.div
            layout
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-10 flex items-center justify-center"
            style={{ width: '100%', flex: showInfo ? '0 0 50%' : '0 0 100%' }}
          >
            <div
              ref={frameScopeRef}
              className="relative w-full max-w-[340px] aspect-[4/5] overflow-hidden"
              style={{ background: `linear-gradient(160deg, ${ABIX.espresso} 0%, ${ABIX.obsidian} 100%)` }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-8 z-10">
                <img
                  ref={imageRef}
                  src={product.shopImage}
                  alt={product.name}
                  draggable={false}
                  className="w-[80%] h-auto select-none block"
                  style={{ filter: 'drop-shadow(0 22px 26px rgba(0,0,0,0.55))' }}
                />
              </div>

              {showScanOverlay && (
                <div ref={scanOverlayRef} className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div
                    className="absolute inset-0 z-0"
                    style={{
                      backgroundImage: `linear-gradient(${ABIX.border15} 1px, transparent 1px), linear-gradient(90deg, ${ABIX.border15} 1px, transparent 1px)`,
                      backgroundSize: '28px 28px',
                      opacity: 0.25,
                    }}
                  />
                  {/* Ambient breathing glow behind the product. */}
                  <div
                    ref={pulseRef}
                    className="absolute inset-0 z-0"
                    style={{
                      background: `radial-gradient(ellipse at 50% 50%, ${ABIX.gold25} 0%, ${ABIX.gold15} 45%, transparent 72%)`,
                    }}
                  />

                  {/* Thin gold line bouncing up/down across the product,
                      4 passes total, before fading out into the info
                      reveal. Travel range kept inside 14%–86% (not
                      edge-to-edge) so the blurred glow around the line
                      never bleeds past the frame border. */}
                  <div ref={sweepRef} className="absolute inset-x-4 z-20" style={{ height: '16px', marginTop: '-8px' }}>
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(180deg, transparent 0%, ${ABIX.gold15} 45%, ${ABIX.gold15} 55%, transparent 100%)`,
                        filter: 'blur(3px)',
                      }}
                    />
                    <div
                      className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1.5px]"
                      style={{ backgroundColor: ABIX.gold, boxShadow: `0 0 4px ${ABIX.gold}` }}
                    />
                  </div>

                  <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-30">
                    <span className="h-3 w-px" style={{ backgroundColor: ABIX.gold15 }} />
                    <span className="font-grotesk text-[9px] uppercase tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
                      {product.subtitle}
                    </span>
                  </div>
                  <div className="absolute left-4 bottom-4 flex items-center gap-2 z-30">
                    <span className="w-3 h-px" style={{ backgroundColor: ABIX.gold15 }} />
                    <span className="font-grotesk text-[9px] uppercase tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
                      {product.category}
                    </span>
                  </div>

                  {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map(
                    (pos) => (
                      <span key={pos} className={`absolute ${pos} w-4 h-4 z-30`} style={{ borderColor: ABIX.gold15 }} />
                    )
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Info column — content reveals one item at a time via
              staggerChildren, instead of popping in as a single block. */}
          <motion.div
            layout
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden p-6 sm:p-10 flex flex-col justify-center min-h-[200px]"
            style={{ flex: showInfo ? '0 0 50%' : '0 0 0%' }}
          >
            <AnimatePresence>
              {showInfo && (
                <motion.div key="info" variants={infoContainerVariants} initial="hidden" animate="show" exit={{ opacity: 0 }}>
                  <motion.span
                    variants={infoItemVariants}
                    className="block text-[11px] font-semibold uppercase tracking-luxe-sm"
                    style={{ color: ABIX.gold }}
                  >
                    {product.subtitle}
                  </motion.span>
                  <motion.h3 variants={infoItemVariants} className="mt-3 font-display text-3xl leading-tight" style={{ color: ABIX.ivory }}>
                    {product.name}
                  </motion.h3>
                  <motion.p variants={infoItemVariants} className="mt-4 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
                    {product.description || product.shortDesc}
                  </motion.p>

                  <motion.div variants={infoItemVariants} className="mt-7 flex items-center gap-4">
                    <span className="font-price text-2xl" style={{ color: ABIX.ivory }}>
                      {product.currency}{product.price}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
                      Available
                    </span>
                  </motion.div>

                  <motion.div variants={infoItemVariants} className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="inline-flex items-center justify-center gap-2 rounded-full text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
                      style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian, height: 52 }}
                    >
                      <ShoppingBag size={15} /> Add to Cart
                    </button>

                    {howToTakeRoute && (
                      <button
                        onClick={handleHowToTake}
                        className="inline-flex items-center justify-center gap-2 rounded-full text-[12px] font-semibold tracking-luxe-sm uppercase border transition-colors duration-300"
                        style={{ borderColor: ABIX.ivory25, color: ABIX.ivory, height: 52 }}
                      >
                        <BookOpen size={15} /> How to Take
                      </button>
                    )}

                    <Link
                      to={`/shop/${product.slug}`}
                      onClick={onClose}
                      className="text-center text-[11px] uppercase tracking-luxe-sm mt-1 transition-colors"
                      style={{ color: ABIX.ivory45 }}
                    >
                      View Full Product →
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}