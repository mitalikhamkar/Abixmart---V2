// src/components/abix/MountainToRitual.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap } from '@/lib/gsap';
import { trustPillars, storyStages, featuredProduct, HERO_PRODUCT_IMAGE } from '@/data/products';

import himalayaBG from '@/assets/shilajit-steps/himalayaBG.png';
import collectionImg from '@/assets/shilajit-steps/collection.png';
import purificationImg from '@/assets/shilajit-steps/purification.png';
import resinFormulationImg from '@/assets/shilajit-steps/resin_formulation.png';
import readyToReachImg from '@/assets/shilajit-steps/ReadyToReach.jpeg';

const originPillar = trustPillars.find((p) => p.key === 'origin');
const collectionStage = storyStages.find((s) => s.title === 'Collection');
const purificationStage = storyStages.find((s) => s.title === 'Purification');
const resinStage = storyStages.find((s) => s.title === 'Resin Formulation');

// The five material states of the journey, in strict forward order.
const STEPS = [
  { key: 'mountain', label: 'Mountain', title: 'High in the Himalayas', body: originPillar?.body, image: himalayaBG },
  { key: 'raw', label: 'Raw Material', title: 'Gathered by hand', body: collectionStage?.text, image: collectionImg },
  { key: 'purified', label: 'Purification', title: 'Purified with care', body: purificationStage?.text, image: purificationImg },
  { key: 'resin', label: 'Resin', title: 'Formed into resin', body: resinStage?.text, image: resinFormulationImg },
  { key: 'ritual', label: 'Daily Ritual', title: 'Part of your ritual', body: featuredProduct.howToUse[0], image: readyToReachImg, isFinal: true },
];
const N = STEPS.length;
const LAST = N - 1;
const AUTOPLAY_MS = 3000;
const FADE_DURATION = 1.1;

/**
 * "Mountain → Resin → Ritual" — the ABIXMART signature interaction.
 *
 * Single discrete `activeStep` index (0..4) drives both autoplay and the
 * manual arrows — there is exactly one source of truth for the active
 * slide, so they can never fight or diverge.
 *
 * Arrows call `setActiveStep` with a FUNCTIONAL update (`prev => ...`),
 * never reading `activeStep` from a closure, so clicks are never stale.
 * Arrow buttons also stop pointer/click propagation so the drag rig on
 * the frame (meant for scrubbing, not for arrow clicks) never intercepts
 * or races against a button press.
 *
 * Every step change kills any in-flight crossfade tweens before starting
 * new ones — only one crossfade can ever be animating at a time.
 *
 * The product/jar image lives inside the final step's own layer and is
 * driven to opacity 0 on every step except the last — it cannot appear
 * as an independent overlay during states 1–4.
 */
export default function MountainToRitual() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [dragging, setDragging] = useState(false);

  const frameRef = useRef(null);
  const imageRefs = useRef(STEPS.map(() => React.createRef()));
  const productRef = useRef(null);
  const productShadowRef = useRef(null);
  const prevStepRef = useRef(0);
  const dragStartRef = useRef({ pos: 0, step: 0 });
  const autoplayTimerRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // --- Crossfade: runs whenever activeStep changes. ---
  useEffect(() => {
    if (reduceMotion) return;
    const prev = prevStepRef.current;
    prevStepRef.current = activeStep;

    STEPS.forEach((_, i) => {
      const el = imageRefs.current[i].current;
      if (!el) return;
      gsap.killTweensOf(el);
      if (i === activeStep) {
        gsap.to(el, { opacity: 1, duration: FADE_DURATION, ease: 'power2.inOut' });
      } else if (i === prev) {
        gsap.to(el, { opacity: 0, duration: FADE_DURATION, ease: 'power2.inOut' });
      } else {
        gsap.set(el, { opacity: 0 });
      }
    });

    if (productRef.current) {
      gsap.killTweensOf(productRef.current);
      if (activeStep === LAST) {
        gsap.to(productRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: FADE_DURATION,
          delay: 0.35,
          ease: 'power2.out',
        });
        if (productShadowRef.current) {
          gsap.killTweensOf(productShadowRef.current);
          gsap.to(productShadowRef.current, { opacity: 0.5, duration: FADE_DURATION, delay: 0.35 });
        }
      } else {
        gsap.to(productRef.current, { opacity: 0, y: 24, scale: 0.94, duration: 0.5, ease: 'power2.in' });
        if (productShadowRef.current) {
          gsap.killTweensOf(productShadowRef.current);
          gsap.to(productShadowRef.current, { opacity: 0, duration: 0.5 });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, reduceMotion]);

  // --- Autoplay: forward-only index increment, hard wrap at the end. ---
  const clearAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearTimeout(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const scheduleAutoplay = useCallback(() => {
    if (reduceMotion) return;
    clearAutoplay();
    autoplayTimerRef.current = setTimeout(() => {
      setActiveStep((prev) => (prev >= LAST ? 0 : prev + 1));
      scheduleAutoplay();
    }, AUTOPLAY_MS);
  }, [reduceMotion, clearAutoplay]);

  useEffect(() => {
    if (reduceMotion) return;
    scheduleAutoplay();
    return () => clearAutoplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  // Manual navigation — always a FUNCTIONAL update, never a stale read of
  // `activeStep`. Resets the autoplay clock (single timer, cleared first)
  // instead of fighting it, so autoplay continues from the new slide.
  const goToStep = (i) => {
    setActiveStep(() => Math.max(0, Math.min(LAST, i)));
    scheduleAutoplay();
  };

  const goNext = () => {
    setActiveStep((prev) => (prev >= LAST ? 0 : prev + 1));
    scheduleAutoplay();
  };

  const goPrev = () => {
    setActiveStep((prev) => (prev <= 0 ? LAST : prev - 1));
    scheduleAutoplay();
  };

  // --- Drag / scrub on the frame itself (not the arrow buttons). ---
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

  const handlePointerDown = (e) => {
    if (reduceMotion) return;
    clearAutoplay();
    setDragging(true);
    const pos = isDesktop() ? e.clientX : e.clientY;
    dragStartRef.current = { pos, step: activeStep };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    const rect = frameRef.current.getBoundingClientRect();
    const span = (isDesktop() ? rect.width : rect.height) / N;
    const pos = isDesktop() ? e.clientX : e.clientY;
    const deltaSteps = Math.round((pos - dragStartRef.current.pos) / span);
    const target = Math.max(0, Math.min(LAST, dragStartRef.current.step + deltaSteps));
    setActiveStep((prev) => (prev !== target ? target : prev));
  };

  const endDrag = () => {
    if (!dragging) return;
    setDragging(false);
    scheduleAutoplay();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goPrev();
    }
  };

  const step = STEPS[activeStep];

  // -------------------------------------------------------------
  // Reduced motion: five plain stacked steps, normal document flow.
  // -------------------------------------------------------------
  if (reduceMotion) {
    return (
      <section className="bg-ivory py-24 lg:py-32">
        <div className="mx-auto max-w-6xl px-6 lg:px-10 mb-12">
          <span className="block font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm text-resin">
            The Signature Journey
          </span>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl text-greendark leading-[1.02] tracking-tight">
            Mountain to ritual.
          </h2>
        </div>
        <div className="mx-auto max-w-6xl px-6 lg:px-10 space-y-4">
          {STEPS.map((s, i) => (
            <div key={s.key} className="relative aspect-[16/10] overflow-hidden bg-charcoal">
              <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              {s.isFinal && (
                <div className="absolute inset-0 flex items-end justify-end p-6 lg:p-10">
                  <img src={HERO_PRODUCT_IMAGE} alt="ABIXMART Himalayan Shilajit" className="w-[26%] max-w-[140px] h-auto" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 p-6 lg:p-10">
                <span className="font-grotesk text-xs text-gold-light">0{i + 1} — {s.label}</span>
                <h3 className="mt-2 font-display text-2xl lg:text-3xl text-ivory">{s.title}</h3>
                <p className="mt-2 max-w-md text-ivory/75 text-sm lg:text-base leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // Full interaction.
  // -------------------------------------------------------------
  return (
    <section className="bg-charcoal py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-10 mb-8 lg:mb-10">
        <span className="block font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm text-gold-light">
          The Signature Journey
        </span>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl text-ivory leading-[1.02] tracking-tight">
          Mountain to ritual.
        </h2>
        <p className="mt-4 text-ivory/55 max-w-md font-body">
          Watch it unfold, drag, or use the arrows — feel the resin's journey from stone to ritual.
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div
          ref={frameRef}
          role="slider"
          tabIndex={0}
          aria-label="Mountain to ritual journey"
          aria-valuemin={0}
          aria-valuemax={LAST}
          aria-valuenow={activeStep}
          aria-valuetext={STEPS[activeStep].label}
          onKeyDown={handleKeyDown}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={endDrag}
          className={`relative w-full aspect-[4/5] sm:aspect-video lg:aspect-[21/9] overflow-hidden select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            dragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              ref={imageRefs.current[i]}
              className="absolute inset-0 pointer-events-none"
              style={{ opacity: i === 0 ? 1 : 0 }}
            >
              <img src={s.image} alt="" className="h-full w-full object-cover" draggable={false} />
              {s.isFinal && (
                <div className="absolute inset-x-0 bottom-0 flex justify-end pr-6 lg:pr-14 pb-24 sm:pb-28 lg:pb-16">
                  <div className="relative">
                    <div
                      ref={productShadowRef}
                      className="absolute left-1/2 -translate-x-1/2 bottom-[6%] w-[70%] h-[12%] rounded-full bg-black/50 blur-xl opacity-0"
                    />
                    <div
                      ref={productRef}
                      className="relative w-[28vw] max-w-[120px] sm:max-w-[150px] lg:w-[9vw] lg:max-w-[150px] opacity-0"
                      style={{ transform: 'translateY(24px) scale(0.94)' }}
                    >
                      <img
                        src={HERO_PRODUCT_IMAGE}
                        alt="ABIXMART Himalayan Shilajit"
                        draggable={false}
                        className="w-full h-auto select-none"
                        style={{ filter: 'drop-shadow(0 18px 22px rgba(0,0,0,0.45))' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20 pointer-events-none" />

          {/* Active step text */}
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 lg:p-14 pointer-events-none">
            <div className="max-w-md">
              <span className="font-grotesk text-xs text-gold-light">0{activeStep + 1} / 0{N}</span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl text-ivory leading-tight">{step.title}</h3>
              <p className="mt-2 text-ivory/75 text-sm lg:text-base leading-relaxed max-w-sm">{step.body}</p>
            </div>
          </div>

          {/* Prev / Next arrows — isolated from the drag rig via stopPropagation */}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous step"
            className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-10 h-9 w-9 lg:h-10 lg:w-10 inline-flex items-center justify-center rounded-full bg-black/35 text-ivory/80 hover:bg-black/55 hover:text-ivory transition-colors duration-200"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next step"
            className="absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-10 h-9 w-9 lg:h-10 lg:w-10 inline-flex items-center justify-center rounded-full bg-black/35 text-ivory/80 hover:bg-black/55 hover:text-ivory transition-colors duration-200"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}