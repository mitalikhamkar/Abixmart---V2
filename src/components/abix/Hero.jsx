// src/components/abix/Hero.jsx
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import Eyebrow from './Eyebrow';
import { HERO_BACKGROUND_IMAGE, HERO_PRODUCT_IMAGE } from '@/data/products';
import { useHeroIntro } from '@/hooks/useHeroIntro';

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
  });

  return (
    <section
      ref={containerRef}
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden bg-[#151417] grain flex flex-col"
    >
      {/* Environment — real Himalayan photo. Initial hidden state is set
          entirely by GSAP (gsap.set in useHeroIntro), never via a React
          `style` prop — a static inline style gets re-asserted by React on
          every re-render and silently undoes whatever GSAP animated. */}
      <div ref={backgroundRef} className="absolute inset-0">
        <img
          src={HERO_BACKGROUND_IMAGE}
          alt="Himalayan mountains and rock at golden hour"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-black/50 via-black/10 to-transparent" />
      </div>

      {/* PRODUCT ZONE — absolutely positioned on every breakpoint, same
          concept as desktop: bottom-right, resting on the rocky
          foreground in HERO_BACKGROUND_IMAGE. On mobile/tablet, raised
          to bottom-[20%] (rather than desktop's bottom-[10%]) so it sits
          clear above the fixed "Need Help?" button in the same corner
          (AbixmartAssist.jsx, bottom-5 right-5). The animation itself
          (useHeroIntro) needs no change — it moves the product via
          relative transform offsets computed from live viewport size,
          not from which side it's anchored on, so the "comes in from
          above, settles into place" motion works the same here.
          Desktop (lg:) values unchanged. */}
      <div
        className="absolute z-[6] pointer-events-none
                   bottom-[20%] right-[6%]
                   lg:bottom-[10%] lg:right-[6%]"
        aria-hidden="true"
      >
        <div className="relative">
          <div
            ref={productShadowRef}
            className="absolute left-1/2 -translate-x-1/2 bottom-[4%] w-[75%] h-[12%] rounded-full bg-black/45 blur-xl"
          />
          <div
            ref={productWrapRef}
            className="relative w-[26vw] max-w-[120px] sm:w-[24vw] sm:max-w-[150px] lg:w-[19vw] lg:max-w-[300px]"
          >
            <img
              ref={productImageRef}
              src={HERO_PRODUCT_IMAGE}
              alt=""
              draggable={false}
              className="w-full h-auto select-none"
              style={{ filter: 'drop-shadow(0 26px 34px rgba(0,0,0,0.4))' }}
            />
          </div>
        </div>
      </div>

      {/* CONTENT — unchanged from previous version. */}
      <div
        className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10 flex-1
                   flex flex-col justify-start pt-20 sm:pt-24 pb-20
                   lg:justify-end lg:pt-28 lg:pb-24"
      >
        <div className="lg:max-w-[600px] xl:max-w-[640px]">
          <div ref={eyebrowRef}>
            <Eyebrow light className="mb-4 lg:mb-7">Himalayan Modern Luxury</Eyebrow>
          </div>

          <h1 className="font-display text-ivory leading-[0.98] lg:leading-[0.95] tracking-tight text-balance">
            <span className="block overflow-hidden">
              <span
                ref={headlineLine1Ref}
                className="block text-[clamp(1.9rem,8.5vw,2.6rem)] lg:text-[6vw] xl:text-[68px]"
              >
                From the Himalayas.
              </span>
            </span>
            <span className="block overflow-hidden">
              <span
                ref={headlineLine2Ref}
                className="block text-[clamp(1.9rem,8.5vw,2.6rem)] lg:text-[6vw] xl:text-[68px] italic text-ivory/90"
              >
                To your daily ritual.
              </span>
            </span>
          </h1>

          <p
            ref={descriptionRef}
            className="mt-4 lg:mt-8 max-w-xl text-ivory/75 text-sm sm:text-base lg:text-lg leading-relaxed font-body"
          >
            Premium Himalayan Shilajit Pure Resin — sourced from the high mountains,
            purified by tradition, crafted for the modern ritual.
          </p>

          <div className="mt-6 lg:mt-10 flex flex-col sm:flex-row gap-3 lg:gap-4">
            <Link
              ref={primaryCtaRef}
              to="/shop"
              className="group inline-flex items-center justify-center h-12 lg:h-14 px-7 lg:px-9 bg-ivory text-[#151417] text-[11px] lg:text-[12px] font-semibold tracking-luxe-sm uppercase rounded-none hover:bg-[#D3A467] hover:text-[#151417] transition-colors duration-300"
            >
              Explore Products
              <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
            <Link
              ref={secondaryCtaRef}
              to="/create-account"
              className="inline-flex items-center justify-center h-12 lg:h-14 px-7 lg:px-9 border border-ivory/40 text-ivory text-[11px] lg:text-[12px] font-semibold tracking-luxe-sm uppercase rounded-none hover:bg-ivory/10 transition-colors duration-300"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator — desktop only, avoids crowding the mobile layout */}
      <div
        ref={scrollHintRef}
        className="hidden lg:flex absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-2 text-ivory/60"
      >
        <span className="text-[10px] uppercase tracking-luxe-sm">Scroll</span>
        <ArrowDown size={14} className="scroll-hint" />
      </div>
    </section>
  );
}