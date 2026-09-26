// src/components/abix/Hero.jsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown } from 'lucide-react';
import heroBgImg from '@/assets/hero/abixmart-hero-bg.png';
import leftBranchImg from '@/assets/hero/left-branch.png';
import rightBranchImg from '@/assets/hero/right-branch.png';
import leafImg from '@/assets/hero/leaf.png';
import { useHeroIntro } from '@/hooks/useHeroIntro';
import { ABIX } from './brandColors';

export default function Hero() {
  const containerRef = useRef(null);
  const leftBranchRef = useRef(null);
  const rightBranchRef = useRef(null);
  const headlineLine1Ref = useRef(null);
  const headlineLine2Ref = useRef(null);
  const descriptionRef = useRef(null);
  const primaryCtaRef = useRef(null);
  const secondaryCtaRef = useRef(null);
  const scrollHintRef = useRef(null);

  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handleChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useHeroIntro({
    container: containerRef,
    leftBranch: leftBranchRef,
    rightBranch: rightBranchRef,
    description: descriptionRef,
    headlineLine1: headlineLine1Ref,
    headlineLine2: headlineLine2Ref,
    primaryCta: primaryCtaRef,
    secondaryCta: secondaryCtaRef,
    scrollHint: scrollHintRef,
  });

  const LEFT_ANCHORS = [
    { x: 6, y: 4 },
    { x: 13, y: 9 },
    { x: 20, y: 6 },
    { x: 26, y: 13 },
    { x: 16, y: 17 },
    { x: 31, y: 10 },
    { x: 10, y: 15 },
    { x: 34, y: 16 },
    { x: 22, y: 20 },
  ];

  const RIGHT_ANCHORS = LEFT_ANCHORS.map((a) => ({
    x: 100 - a.x,
    y: a.y,
  }));

  const leaves = useMemo(() => {
    if (typeof window === 'undefined') return [];

    const vw = window.innerWidth;
    const count = vw < 640 ? 5 : vw < 1024 ? 7 : 9;

    return Array.from({ length: count }, (_, i) => {
      const fromLeft = i % 2 === 0;
      const anchors = fromLeft ? LEFT_ANCHORS : RIGHT_ANCHORS;
      const anchor = anchors[i % anchors.length];
      const short = Math.random() < 0.35;
      const isLarger = Math.random() < 0.2;

      return {
        id: i,
        left: anchor.x,
        top: anchor.y,
        size: isLarger ? 95 + Math.random() * 25 : 65 + Math.random() * 25,
        duration: 8 + Math.random() * 5,
        delay: Math.random() * 3,
        drift: (fromLeft ? 1 : -1) * (24 + Math.random() * 30),
        rotStart: Math.random() * 30 - 15,
        rotEnd: Math.random() * 160 + 60,
        opacity: 0.7 + Math.random() * 0.25,
        short,
      };
    });
  }, []);

  return (
            <section
      ref={containerRef}
      id="top"
      className="relative min-h-[100svh] w-full overflow-hidden flex flex-col grain"
      style={{ background: `linear-gradient(180deg, ${ABIX.deep} 0%, ${ABIX.deep} 68%, ${ABIX.obsidian} 100%)` }}
    >
      {/* CHANGED: background image now lives in its own layer with a
          bottom mask, instead of directly on the section. This lets it
          feather into transparency over its final ~22% of height,
          revealing the shared atmosphere gradient (Home.jsx) behind it
          — so Hero -> Video has no hard horizontal boundary. */}
      <div
        className="absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${heroBgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          maskImage: 'linear-gradient(to bottom, black 0%, black 78%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 78%, transparent 100%)',
        }}
      />

      {/* CHANGED: scrim rebuilt from the real palette (deep botanical
          -> obsidian) instead of an unrelated green rgba. */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(29,43,28,0.12) 0%, rgba(29,43,28,0.32) 45%, rgba(9,17,11,0.58) 100%)',
        }}
      />

      <style>{`
        @keyframes abixLeafFall {
          0% { transform: translate3d(0, 0, 0) rotate(var(--rot-start)); opacity: 0; }
          10% { opacity: var(--leaf-opacity); }
          92% { opacity: var(--leaf-opacity); }
          100% { transform: translate3d(calc(var(--drift) * -1), 100vh, 0) rotate(var(--rot-end)); opacity: 0; }
        }

        @keyframes abixLeafFallShort {
          0% { transform: translate3d(0, 0, 0) rotate(var(--rot-start)); opacity: 0; }
          12% { opacity: var(--leaf-opacity); }
          70% { opacity: var(--leaf-opacity); }
          100% { transform: translate3d(var(--drift), 48vh, 0) rotate(var(--rot-end)); opacity: 0; }
        }

        .abix-leaf {
          position: absolute;
          will-change: transform, opacity;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          filter: brightness(1.35) contrast(1.15) saturate(1.1) drop-shadow(0 4px 10px rgba(0,0,0,0.5));
        }

        .abix-leaf-long { animation-name: abixLeafFall; }
        .abix-leaf-short { animation-name: abixLeafFallShort; }
      `}</style>

      {!reduceMotion && (
        <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden" aria-hidden="true">
          {leaves.map((leaf) => (
            <img
              key={leaf.id}
              src={leafImg}
              alt=""
              className={`abix-leaf ${leaf.short ? 'abix-leaf-short' : 'abix-leaf-long'}`}
              style={{
                left: `${leaf.left}%`,
                top: `${leaf.top}%`,
                width: `${leaf.size}px`,
                height: 'auto',
                animationDuration: `${leaf.duration}s`,
                animationDelay: `${leaf.delay}s`,
                '--drift': `${leaf.drift}px`,
                '--rot-start': `${leaf.rotStart}deg`,
                '--rot-end': `${leaf.rotEnd}deg`,
                '--leaf-opacity': leaf.opacity,
              }}
            />
          ))}
        </div>
      )}

      <img
        ref={leftBranchRef}
        src={leftBranchImg}
        alt=""
        aria-hidden="true"
        className="
          absolute z-[3] pointer-events-none select-none
          -top-2 -left-2 w-[58vw] max-w-[240px]
          sm:-top-3 sm:left-[-4vw] sm:w-[54vw] sm:max-w-[400px]
          lg:-top-4 lg:left-[-2vw] lg:w-[46vw] lg:max-w-[720px]
        "
        style={{
          maskImage: 'linear-gradient(120deg, black 50%, transparent 88%)',
          WebkitMaskImage: 'linear-gradient(120deg, black 50%, transparent 88%)',
        }}
      />

      <img
        ref={rightBranchRef}
        src={rightBranchImg}
        alt=""
        aria-hidden="true"
        className="
          absolute z-[3] pointer-events-none select-none
          -top-2 -right-2 w-[58vw] max-w-[240px]
          sm:-top-3 sm:right-[-4vw] sm:w-[54vw] sm:max-w-[400px]
          lg:-top-4 lg:right-[-2vw] lg:w-[46vw] lg:max-w-[720px]
        "
        style={{
          maskImage: 'linear-gradient(240deg, black 50%, transparent 88%)',
          WebkitMaskImage: 'linear-gradient(240deg, black 50%, transparent 88%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-6 flex-1 flex flex-col items-center justify-center text-center pt-16 pb-20 lg:pt-20 lg:pb-24">
        <h1 className="font-display leading-[0.98] tracking-tight" style={{ color: ABIX.ivory }}>
          <span className="block overflow-hidden">
            <span ref={headlineLine1Ref} className="block text-[clamp(2rem,8.5vw,2.9rem)] lg:text-[5vw] xl:text-[56px]">
              Rooted in nature.
            </span>
          </span>
          <span className="block overflow-hidden">
            <span
              ref={headlineLine2Ref}
              className="block text-[clamp(2rem,8.5vw,2.9rem)] lg:text-[5vw] xl:text-[56px] italic"
              style={{ color: ABIX.ivory70 }}
            >
              Designed for modern life.
            </span>
          </span>
        </h1>

        <p
          ref={descriptionRef}
          className="mt-4 lg:mt-6 max-w-md mx-auto text-sm sm:text-base lg:text-lg leading-relaxed font-body"
          style={{ color: ABIX.ivory70 }}
        >
          A considered collection of wellness essentials, created to become part of your everyday rhythm.
        </p>

        <div className="mt-7 lg:mt-9 flex flex-col sm:flex-row gap-3 lg:gap-4">
          <Link
            ref={primaryCtaRef}
            to="/shop"
            className="group inline-flex items-center justify-center h-12 lg:h-13 px-7 lg:px-8 text-[11px] font-semibold tracking-luxe-sm uppercase rounded-none transition-colors duration-300"
            style={{ backgroundColor: ABIX.ivory, color: ABIX.deep }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = ABIX.gold; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ABIX.ivory; }}
          >
            Explore Collection
            <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
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