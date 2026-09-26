// src/components/abix/ShopQuickView.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, ShoppingBag, BookOpen } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { useShop } from '@/lib/ShopContext';
import { ABIX } from './brandColors';

const HOW_TO_TAKE_ROUTES = {
  shilajit: '/how-to-take-shilajit',
};

export default function ShopQuickView({ product, onClose }) {
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [phase, setPhase] = useState('scan'); // 'scan' | 'clearing' | 'info'

  const rootRef = useRef(null);
  const imageRef = useRef(null);
  const scanOverlayRef = useRef(null); // NEW — wraps every scan-only element
  const sweepRef = useRef(null);
  const infoRef = useRef(null);

  useEffect(() => {
    setPhase('scan');
  }, [product]);

  // Phase 1: scan plays over the product
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
      gsap.set(sweepRef.current, { opacity: 0, yPercent: -120 });

      gsap
        .timeline({ onComplete: () => setPhase('clearing') })
        .to(imageRef.current, { opacity: 1, scale: 1, rotation: 0, y: 0, duration: 0.8, ease: 'power3.out' }, 0)
        .to(scanOverlayRef.current, { opacity: 1, duration: 0.4 }, 0.5)
        .to(sweepRef.current, { opacity: 0.7, yPercent: 220, duration: 1.0, ease: 'sine.inOut' }, 0.8)
        .to(sweepRef.current, { yPercent: -120, duration: 0.9, ease: 'sine.inOut' }, 1.8)
        .to(sweepRef.current, { opacity: 0.7, yPercent: 220, duration: 1.0, ease: 'sine.inOut' }, 2.7);
    },
    { scope: rootRef, dependencies: [phase, product] }
  );

  // Phase 2: EVERY scan element — grid, glow, tick marks, corner
  // brackets, the sweep beam — fades out together as one group, and
  // only once that fade fully finishes does the component move to
  // 'info' (which stops rendering the scan overlay entirely). This is
  // the fix: previously only the sweep beam faded, so the grid/glow/
  // corner marks were left permanently visible on the product.
  useGSAP(
    () => {
      if (phase !== 'clearing') return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        setPhase('info');
        return;
      }
      gsap.to([scanOverlayRef.current, sweepRef.current], {
        opacity: 0,
        duration: 0.45,
        ease: 'power2.in',
        onComplete: () => setPhase('info'),
      });
    },
    { scope: rootRef, dependencies: [phase] }
  );

  // Phase 3: info reveals only after the scan overlay is fully gone
  useGSAP(
    () => {
      if (phase !== 'info') return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) {
        gsap.set(infoRef.current, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(infoRef.current, { opacity: 0, y: 16 });
      gsap.to(infoRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 });
    },
    { scope: rootRef, dependencies: [phase] }
  );

  const showInfo = phase === 'info';
  const showScanOverlay = phase !== 'info'; // unmounted once info shows — belt-and-suspenders with the opacity fade
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
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: `${ABIX.obsidian}CC` }} onClick={onClose} />

      <div
        ref={rootRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl overflow-y-auto max-h-[92vh] flex flex-col lg:flex-row"
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

        <div className="relative lg:w-1/2 shrink-0 p-6 sm:p-10 flex items-center justify-center">
          <div
            className="relative w-full max-w-[340px] aspect-[4/5] overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${ABIX.espresso} 0%, ${ABIX.obsidian} 100%)` }}
          >
            {/* Product image — the ONLY thing left once phase is 'info' */}
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

            {/* Everything below is scan-only and fully unmounts once
                showScanOverlay is false — nothing gold can persist. */}
            {showScanOverlay && (
              <div ref={scanOverlayRef} className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `linear-gradient(${ABIX.ivory12} 1px, transparent 1px), linear-gradient(90deg, ${ABIX.ivory12} 1px, transparent 1px)`,
                    backgroundSize: '28px 28px',
                    opacity: 0.35,
                  }}
                />
                <div
                  className="absolute inset-0 z-0"
                  style={{ background: `radial-gradient(ellipse at 50% 55%, ${ABIX.gold25}, transparent 68%)` }}
                />

                <div
                  ref={sweepRef}
                  className="absolute inset-x-0 top-0 h-1/4 mix-blend-screen z-20"
                  style={{ background: `linear-gradient(180deg, transparent, ${ABIX.gold}E6, transparent)` }}
                />

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
        </div>

        <div className="lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center min-h-[200px]">
          {showInfo && (
            <div ref={infoRef}>
              <span className="text-[11px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
                {product.subtitle}
              </span>
              <h3 className="mt-3 font-display text-3xl leading-tight" style={{ color: ABIX.ivory }}>
                {product.name}
              </h3>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
                {product.description || product.shortDesc}
              </p>

              <div className="mt-7 flex items-center gap-4">
                <span className="font-price text-2xl" style={{ color: ABIX.ivory }}>
                  {product.currency}{product.price}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
                  Available
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}