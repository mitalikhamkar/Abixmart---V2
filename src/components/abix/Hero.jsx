// src/components/abix/Hero.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import Eyebrow from './Eyebrow';
import abixmartMark from '@/assets/logo/Abixmart-header.png';
import { HERO_BACKGROUND_IMAGE, heroProducts } from '@/data/products';
import { useHeroIntro } from '@/hooks/useHeroIntro';
import { gsap } from '@/lib/gsap';
import { ABIX } from './brandColors';

// ABIXMART-first hero. Background stays visibly the real photo — light
// green tint via overlay only, no near-black crush. Copy is brand-first;
// Shilajit is not named here at all (it appears later, in
// DiscoverAbixmart). Logo mark integrated as a small brand moment next
// to the eyebrow, with a soft gold glow behind it.
export default function Hero() {
  const containerRef = useRef(null);
  const backgroundRef = useRef(null);
  const productWrapRef = useRef(null);
  const productImageRef = useRef(null);
  const productShadowRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headlineLine1Ref = useRef(null);
  const headlineLine2Ref = useRef(null);
  const descriptionRef = useRef(null);
  const primaryCtaRef = useRef(null);
  const secondaryCtaRef = useRef(null);
  const scrollHintRef = useRef(null);
  const idleFloatRef = useRef(null);
  const isAnimatingRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(0);
  const active = heroProducts[activeIndex];

  useHeroIntro({
    container: containerRef,
    background: backgroundRef,
    productWrap: productWrapRef,
    productImage: productImageRef,
    productShadow: productShadowRef,
    eyebrow: eyebrowRef,
    headlineLine1: headlineLine1Ref,
    headlineLine2: headlineLine2Ref,
    description: descriptionRef,
    primaryCta: primaryCtaRef,
    secondaryCta: secondaryCtaRef,
    scrollHint: scrollHintRef,
    idleFloat: idleFloatRef,
  });

  const goToProduct = (nextIndex) => {
    if (nextIndex === activeIndex || isAnimatingRef.current) return;
    const img = productImageRef.current;
    const wrap = productWrapRef.current;
    const shadow = productShadowRef.current;
    if (!img || !wrap) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setActiveIndex(nextIndex);
      return;
    }

    isAnimatingRef.current = true;
    if (idleFloatRef.current) {
      idleFloatRef.current.kill();
      idleFloatRef.current = null;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false;
        idleFloatRef.current = gsap.to(img, {
          y: -5,
          duration: 3.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        });
      },
    });

    tl.to(img, { opacity: 0, scale: 0.9, y: -14, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in' }, 0)
      .to(shadow, { opacity: 0, scaleX: 0.55, duration: 0.4 }, 0)
      .call(() => setActiveIndex(nextIndex))
      .set(img, { scale: 0.94, y: 12, filter: 'blur(6px)' })
      .to(img, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out' })
      .to(shadow, { opacity: 1, scaleX: 1, duration: 0.6, ease: 'power2.out' }, '<');
  };

  useEffect(() => {
    const id = setInterval(() => {
      goToProduct((activeIndex + 1) % heroProducts.length);
    }, 7000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  return (
    <section
      ref={containerRef}
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden grain flex flex-col"
      style={{ background: ABIX.deep }}
    >
      {/* Environment — background stays clearly visible. Light green
          tint via mix-blend-mode, gentle gradient only where the text
          block sits, NOT across the whole frame. */}
      <div ref={backgroundRef} className="absolute inset-0">
        <img
          src={HERO_BACKGROUND_IMAGE}
          alt="Natural mountain environment"
          className="h-full w-full object-cover"
          style={{ filter: 'saturate(0.85) brightness(0.88) contrast(1.03)' }}
        />
        {/* green tint — color blend, not a dark crush */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: ABIX.deep, opacity: 0.32, mixBlendMode: 'color' }}
        />
        {/* readability gradient — only bottom-left where copy sits, image stays visible elsewhere */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, rgba(15,32,24,0.62) 0%, rgba(15,32,24,0.28) 32%, transparent 55%), linear-gradient(0deg, rgba(15,32,24,0.55) 0%, transparent 38%)',
          }}
        />
      </div>

      {/* PRODUCT ZONE */}
      <div
        className="absolute z-[6] pointer-events-none
                   bottom-[26%] right-[6%]
                   lg:bottom-[13%] lg:right-[7%]"
        aria-hidden="true"
      >
        <div className="relative">
          <div
            ref={productShadowRef}
            className="absolute left-1/2 -translate-x-1/2 bottom-[4%] w-[75%] h-[12%] rounded-full bg-black/40 blur-xl"
          />
          <div
            ref={productWrapRef}
            className="relative w-[24vw] max-w-[110px] sm:w-[22vw] sm:max-w-[140px] lg:w-[17vw] lg:max-w-[260px]"
          >
            <img
              ref={productImageRef}
              src={active.image}
              alt=""
              draggable={false}
              className="w-full h-auto select-none"
              style={{ filter: 'drop-shadow(0 22px 30px rgba(0,0,0,0.4))' }}
            />
          </div>
        </div>
      </div>

      {/* Minimal product indicator — dots only, no arrows, no card */}
      <div className="absolute z-[7] bottom-[19%] right-[7%] lg:bottom-[7%] lg:right-[9%] flex gap-2 pointer-events-auto">
        {heroProducts.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`Show ${p.name}`}
            onClick={() => goToProduct(i)}
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: i === activeIndex ? '18px' : '6px',
              backgroundColor: i === activeIndex ? ABIX.gold : ABIX.ivory25,
            }}
          />
        ))}
      </div>

      {/* CONTENT */}
      <div
        className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10 flex-1
                   flex flex-col justify-start pt-20 sm:pt-24 pb-20
                   lg:justify-end lg:pt-28 lg:pb-24"
      >
        <div className="lg:max-w-[560px]">
          {/* Brand moment — small logo mark + gold glow, sits above the eyebrow */}
          <div className="relative mb-5 lg:mb-6 inline-flex items-center">
            <span
              className="absolute -inset-4 rounded-full"
              style={{ background: `radial-gradient(circle, ${ABIX.gold15}, transparent 70%)` }}
              aria-hidden="true"
            />
            <img src={abixmartMark} alt="ABIXMART" className="relative h-6 lg:h-7 w-auto opacity-95" />
          </div>

          <div ref={eyebrowRef}>
            <Eyebrow light className="mb-4 lg:mb-6">A Wellness World</Eyebrow>
          </div>

          <h1 className="font-display leading-[0.98] tracking-tight text-balance" style={{ color: ABIX.ivory }}>
            <span className="block overflow-hidden">
              <span
                ref={headlineLine1Ref}
                className="block text-[clamp(2rem,8.5vw,2.9rem)] lg:text-[5.5vw] xl:text-[62px]"
              >
                Thoughtful wellness.
              </span>
            </span>
            <span className="block overflow-hidden">
              <span
                ref={headlineLine2Ref}
                className="block text-[clamp(2rem,8.5vw,2.9rem)] lg:text-[5.5vw] xl:text-[62px] italic"
                style={{ color: ABIX.ivory70 }}
              >
                Made for modern living.
              </span>
            </span>
          </h1>

          <p
            ref={descriptionRef}
            className="mt-4 lg:mt-7 max-w-md text-sm sm:text-base lg:text-lg leading-relaxed font-body"
            style={{ color: ABIX.ivory70 }}
          >
            A considered collection of wellness essentials, created to become
            part of your everyday rhythm.
          </p>

          <div className="mt-6 lg:mt-9 flex flex-col sm:flex-row gap-3 lg:gap-4">
                        <Link
              ref={primaryCtaRef}
              to="/shop"
              className="group inline-flex items-center justify-center h-12 lg:h-13 px-7 lg:px-8 text-[11px] font-semibold tracking-luxe-sm uppercase rounded-none transition-colors duration-300"
              style={{ backgroundColor: ABIX.ivory, color: ABIX.deep }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ABIX.gold)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ABIX.ivory)}
            >
              Explore Collection
              <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <a
              ref={secondaryCtaRef}
              href="#philosophy"
              className="inline-flex items-center justify-center h-12 lg:h-13 px-7 lg:px-8 border text-[11px] font-semibold tracking-luxe-sm uppercase rounded-none transition-colors duration-300 hover:bg-white/10"
              style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
            >
              Discover the Brand
            </a>
          </div>
        </div>
      </div>

      <div
        ref={scrollHintRef}
        className="hidden lg:flex absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2"
        style={{ color: ABIX.ivory70 }}
      >
        <span className="text-[10px] uppercase tracking-luxe-sm">Scroll</span>
        <ArrowDown size={14} className="scroll-hint" />
      </div>
    </section>
  );
}