// src/components/abix/ProductQuickView.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Zap, Dumbbell, Brain, ShieldCheck, Mountain, Leaf, Send } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { HERO_PRODUCT_IMAGE, featuredProduct, productBenefits } from '@/data/products';

const BENEFIT_ICONS = {
  energy: Zap,
  strength: Dumbbell,
  focus: Brain,
  immunity: ShieldCheck,
  origin: Mountain,
  wellness: Leaf,
};

const BENEFIT_STEP_SECONDS = 3.2; // ~0.6s transition + ~2.6s reading hold

/**
 * Product Quick View — a single autonomous GSAP sequence:
 *
 *   scan (compact frame only) -> benefit 01..06 -> purchase info
 *
 * (See full architecture notes preserved from the original file — only
 * the final CTA changed, from addToCart to the temporary inquiry-only
 * flow. No animation logic below this comment block was touched.)
 */
export default function ProductQuickView({ open, onClose }) {
  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [phase, setPhase] = useState('scan'); // 'scan' | 'benefits' | 'info'
  const [activeBenefit, setActiveBenefit] = useState(0);

  const panelRootRef = useRef(null);
  const frameBoxRef = useRef(null);
  const bgOverlayRef = useRef(null);
  const glowRef = useRef(null);
  const sweepRef = useRef(null);
  const tickTopRef = useRef(null);
  const tickSideRef = useRef(null);
  const imageRef = useRef(null);
  const contentColRef = useRef(null);
  const accentLineRef = useRef(null);
  const badgeRef = useRef(null);
  const numberRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const progressRef = useRef(null);
  const infoRef = useRef(null);

  const showContent = phase !== 'scan';
  const isCompact = phase === 'scan';

  useEffect(() => {
    if (open) {
      setQty(1);
      setPhase('scan');
      setActiveBenefit(0);
    }
  }, [open]);

  useGSAP(
    () => {
      if (!open || phase !== 'scan') return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) {
        gsap.set([imageRef.current, bgOverlayRef.current, glowRef.current, tickTopRef.current, tickSideRef.current], {
          opacity: 1,
          scale: 1,
          rotation: 0,
        });
        setPhase('info');
        return;
      }

      gsap.set(imageRef.current, { opacity: 0, scale: 0.82, rotation: -6, y: 20 });
      gsap.set(bgOverlayRef.current, { opacity: 0 });
      gsap.set([glowRef.current, tickTopRef.current, tickSideRef.current], { opacity: 0 });
      gsap.set(sweepRef.current, { opacity: 0, xPercent: -140 });

      gsap
        .timeline({ onComplete: () => setPhase('benefits') })
        .to(bgOverlayRef.current, { opacity: 0.45, duration: 0.6, ease: 'power2.out' }, 0)
        .to(imageRef.current, { opacity: 1, scale: 1.06, rotation: 0, y: 0, duration: 0.9, ease: 'power3.out' }, 0.15)
        .to(imageRef.current, { scale: 1, duration: 0.45, ease: 'power2.inOut' }, 1.05)
        .to([glowRef.current, tickTopRef.current, tickSideRef.current], { opacity: 1, duration: 0.45, stagger: 0.1 }, 0.85)
        .to(sweepRef.current, { opacity: 0.6, xPercent: 240, duration: 1.0, ease: 'sine.inOut' }, 0.75)
        .to(sweepRef.current, { xPercent: -140, duration: 1.0, ease: 'sine.inOut' }, 1.85)
        .to(sweepRef.current, { xPercent: 240, duration: 1.0, ease: 'sine.inOut' }, 2.95)
        .to(sweepRef.current, { opacity: 0, duration: 0.3 }, 3.95)
        .to({}, { duration: 0.6 });
    },
    { scope: panelRootRef, dependencies: [open, phase] }
  );

  useGSAP(
    () => {
      if (!open || phase === 'scan') return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || phase !== 'benefits') return;

      gsap.fromTo(
        contentColRef.current,
        { opacity: 0, x: 16 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power2.out' }
      );
    },
    { scope: panelRootRef, dependencies: [open, phase] }
  );

  useGSAP(
    () => {
      if (!open || phase !== 'benefits') return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) {
        gsap.set([accentLineRef.current, badgeRef.current, numberRef.current, titleRef.current, descRef.current], {
          opacity: 1,
          scale: 1,
          y: 0,
          clipPath: 'inset(0 0 0 0)',
        });
        setPhase('info');
        return;
      }

      gsap.set(accentLineRef.current, { scaleX: 0, opacity: 0 });
      gsap.set(badgeRef.current, { opacity: 0, scale: 0.5 });
      gsap.set(numberRef.current, { opacity: 0, x: -10 });
      gsap.set(titleRef.current, { opacity: 0, y: 18, clipPath: 'inset(0 100% 0 0)' });
      gsap.set(descRef.current, { opacity: 0, y: 10, filter: 'blur(4px)' });
      gsap.set(progressRef.current, { scaleX: 0 });

      const stepDur = BENEFIT_STEP_SECONDS;
      const tl = gsap.timeline({ onComplete: () => setPhase('info') });

      productBenefits.forEach((_, i) => {
        const t = i * stepDur;
        if (i > 0) {
          tl.to(badgeRef.current, { opacity: 0, scale: 0.6, duration: 0.25 }, t - 0.3);
          tl.to([numberRef.current, titleRef.current, descRef.current], { opacity: 0, y: -8, duration: 0.25 }, t - 0.3);
        }
        tl.call(() => setActiveBenefit(i), null, t);
        tl.fromTo(accentLineRef.current, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 0.7, duration: 0.35, ease: 'power2.out' }, t);
        tl.fromTo(badgeRef.current, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, t + 0.1);
        tl.fromTo(numberRef.current, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.3 }, t + 0.15);
        tl.fromTo(
          titleRef.current,
          { opacity: 0, y: 18, clipPath: 'inset(0 100% 0 0)' },
          { opacity: 1, y: 0, clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'power3.out' },
          t + 0.2
        );
        tl.fromTo(
          descRef.current,
          { opacity: 0, y: 10, filter: 'blur(4px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' },
          t + 0.35
        );
        tl.to(progressRef.current, { scaleX: (i + 1) / productBenefits.length, duration: stepDur * 0.92, ease: 'none' }, t);
      });

      tl.to([accentLineRef.current, badgeRef.current, numberRef.current, titleRef.current, descRef.current], {
        opacity: 0,
        duration: 0.3,
      });
    },
    { scope: panelRootRef, dependencies: [open, phase] }
  );

  useGSAP(
    () => {
      if (!open || phase !== 'info') return;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) {
        gsap.set(infoRef.current, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(infoRef.current, { opacity: 0, y: 16 });
      gsap.to(infoRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 });
    },
    { scope: panelRootRef, dependencies: [open, phase] }
  );

  if (!open) return null;

  const unit = featuredProduct.price;
  const total = unit * qty;
  const benefit = productBenefits[activeBenefit];
  const BenefitIcon = BENEFIT_ICONS[benefit.key];

  // CHANGED — temporary inquiry-only flow: no cart write, navigates to
  // the existing Support-page inquiry form with product + quantity
  // pre-filled via URL query params.
  const handleSendInquiry = () => {
    navigate(`/support?product=shilajit&quantity=${qty}#inquiry`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={panelRootRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-charcoal text-ivory w-full overflow-y-auto max-h-[92vh] transition-[max-width] duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ maxWidth: isCompact ? 440 : 1040 }}
      >
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-20 p-2 text-ivory/60 hover:text-ivory transition-colors"
        >
          <X size={18} />
        </button>

        <div
          className={`flex flex-col ${
            showContent ? 'lg:flex-row lg:items-center lg:justify-start' : 'items-center justify-center'
          } gap-10 lg:gap-12 px-6 sm:px-10 py-14`}
        >
          <div
            className={`relative shrink-0 transition-[width] duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              showContent ? 'lg:w-[300px]' : 'w-full max-w-[300px]'
            }`}
          >
            <div
              ref={frameBoxRef}
              className="relative w-full aspect-[4/5] overflow-hidden transition-transform duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                background: 'linear-gradient(160deg, #241b14 0%, #1a130d 60%, #150f0a 100%)',
                transform: showContent ? 'scale(0.96)' : 'scale(1)',
              }}
            >
              <div ref={bgOverlayRef} className="absolute inset-0 bg-black pointer-events-none" style={{ opacity: 0 }} />
              <div
                ref={glowRef}
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(214,158,89,0.20), transparent 68%)' }}
              />
              <div
                ref={sweepRef}
                className="absolute inset-y-0 left-0 w-1/3 pointer-events-none mix-blend-screen"
                style={{ background: 'linear-gradient(100deg, transparent, rgba(214,158,89,0.9), transparent)' }}
              />
              <div ref={tickTopRef} className="absolute top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none">
                <span className="h-3 w-px bg-gold-light/40" />
                <span className="font-grotesk text-[9px] uppercase tracking-luxe-sm text-ivory/40">
                  {featuredProduct.size}
                </span>
              </div>
              <div ref={tickSideRef} className="absolute left-5 bottom-5 flex items-center gap-2 pointer-events-none">
                <span className="w-3 h-px bg-gold-light/40" />
                <span className="font-grotesk text-[9px] uppercase tracking-luxe-sm text-ivory/40">Pure Resin</span>
              </div>
              {['top-3 left-3 border-t border-l', 'top-3 right-3 border-t border-r', 'bottom-3 left-3 border-b border-l', 'bottom-3 right-3 border-b border-r'].map(
                (pos) => (
                  <span key={pos} className={`absolute ${pos} w-4 h-4 border-gold-light/30 pointer-events-none`} />
                )
              )}
              <div className="absolute inset-0 flex items-center justify-center p-6">
                <div ref={imageRef} className="relative w-[78%]">
                  <img
                    src={HERO_PRODUCT_IMAGE}
                    alt="ABIXMART Himalayan Shilajit"
                    draggable={false}
                    className="w-full h-auto select-none block"
                    style={{ filter: 'drop-shadow(0 22px 26px rgba(0,0,0,0.55))' }}
                  />
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-[55%] h-4 rounded-full bg-black/50 blur-md"
                    style={{ opacity: 0.5 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {showContent && (
            <div ref={contentColRef} className="w-full lg:flex-1 lg:max-w-sm">
              {phase === 'benefits' && (
                <div>
                  <div className="flex items-center gap-4 mb-5">
                    <div
                      ref={badgeRef}
                      className="h-14 w-14 rounded-full bg-charcoal border border-gold-light/60 flex items-center justify-center text-gold-light shrink-0"
                    >
                      {BenefitIcon && <BenefitIcon size={24} />}
                    </div>
                    <span className="flex items-center gap-2">
                      <span ref={accentLineRef} className="h-px w-6 bg-gold-light/60 origin-left" />
                      <span ref={numberRef} className="font-grotesk text-xs uppercase tracking-luxe-sm text-gold-light">
                        0{activeBenefit + 1} / 0{productBenefits.length}
                      </span>
                    </span>
                  </div>
                  <h3 ref={titleRef} className="font-display text-3xl lg:text-4xl text-ivory leading-tight uppercase">
                    {benefit.title}
                  </h3>
                  <p ref={descRef} className="mt-4 text-ivory/60 text-base lg:text-lg leading-relaxed">
                    {benefit.body}
                  </p>
                  <div className="mt-8 w-full max-w-xs h-px bg-ivory/15">
                    <div ref={progressRef} className="h-full bg-gold-light origin-left" style={{ transform: 'scaleX(0)' }} />
                  </div>
                </div>
              )}

              {phase === 'info' && (
                <div ref={infoRef}>
                  <span className="text-[11px] uppercase tracking-luxe-sm text-gold-light">Product Profile</span>
                  <h3 className="mt-3 font-display text-3xl lg:text-4xl text-ivory leading-tight">
                    {featuredProduct.name}
                  </h3>
                  <p className="mt-1 font-display text-xl italic text-gold-light">
                    {featuredProduct.subtitle} · {featuredProduct.size}
                  </p>

                  <div className="mt-8 flex items-center gap-5">
                    <div className="inline-flex items-center border border-ivory/25 h-12">
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="h-full w-10 inline-flex items-center justify-center text-ivory hover:bg-ivory/10 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-9 text-center font-price text-lg text-ivory">{qty}</span>
                      <button
                        onClick={() => setQty((q) => q + 1)}
                        className="h-full w-10 inline-flex items-center justify-center text-ivory hover:bg-ivory/10 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-price text-xl text-ivory">
                      {featuredProduct.currency}
                      {total}
                    </span>
                  </div>

                  <button
                    onClick={handleSendInquiry}
                    className="mt-6 inline-flex items-center justify-center gap-2.5 h-[52px] px-8 bg-gold-light text-charcoal text-[12px] font-semibold tracking-luxe-sm uppercase hover:bg-ivory transition-colors duration-300"
                  >
                    <Send size={15} />
                    Send Inquiry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}