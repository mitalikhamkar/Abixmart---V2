// src/pages/About.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import PageTransition, { whenPageReady } from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import ComingSoonMarquee from '@/components/abix/ComingSoonMarquee';
import MountainToRitual from '@/components/abix/MountainToRitual';
import LeafShadow from '@/components/abix/home/LeafShadow';
import AboutRail from '@/components/abix/about/AboutRail';
import Principles from '@/components/abix/about/Principles';
import Transparency from '@/components/abix/about/Transparency';
import EverydayRitual from '@/components/abix/about/EverydayRitual';
import { ABOUT_CSS } from '@/components/abix/about/aboutMotion';
import { useInViewReveal } from '@/hooks/useInViewReveal';
import { useCatalog } from '@/lib/CatalogContext';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

import aboutHero from '@/assets/about/about-hero.png';
import aboutJourney from '@/assets/about/about-journey.png';

// Headline, split so each word can rise out of its own mask.
const HEADLINE = [['Built', 'slowly.'], ['Shown', 'honestly.']];

// A gold stem that grows when the closing section comes into view. Uses an
// IntersectionObserver (not stored scroll positions), so it is reliable on phones.
function GrowingStem() {
  const ref = useRef(null);
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setGrown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGrown(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <svg ref={ref} aria-hidden="true" viewBox="0 0 40 120" className="mx-auto h-24 w-auto" fill="none">
      <path
        pathLength="1"
        d="M20 120 C 20 90, 14 70, 20 44 S 26 14, 20 0"
        stroke={ABIX.gold}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="1"
        className="transition-[stroke-dashoffset] duration-[1800ms] ease-out motion-reduce:transition-none"
        style={{ strokeDashoffset: grown ? 0 : 1 }}
      />
    </svg>
  );
}

// Story order:
//   hero → principles → journey → transparency → everyday ritual → closing
// Section backgrounds hand over to each other (obsidian → forest → obsidian),
// so there is no hard seam between chapters.
export default function About() {
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const heroImgRef = useRef(null);
  const { comingSoonProducts, loading } = useCatalog();
  const showGrowing = !loading && comingSoonProducts.length > 0;

  // Scroll reveals (also for the child sections, which share this root).
  useInViewReveal(rootRef, [showGrowing]);

  // Hero intro: starts once the page transition has lifted, so it is actually seen.
  useGSAP(
    (context, contextSafe) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
      const words = context.selector('[data-word]');
      const fades = context.selector('[data-hero-fade]');
      gsap.set(words, { yPercent: 115 });
      gsap.set(fades, { autoAlpha: 0, y: 18 });
      gsap.set(heroImgRef.current, { scale: 1.12 });

      // slow parallax on large screens (the hero starts at the top, so its position is stable)
      if (window.matchMedia('(min-width: 1024px)').matches) {
        gsap.to(heroImgRef.current, {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: { trigger: heroRef.current, start: 'top top', end: 'bottom top', scrub: true },
        });
      }

      return whenPageReady(
        contextSafe(() => {
          gsap
            .timeline({ defaults: { ease: 'power3.out' } })
            .to(heroImgRef.current, { scale: 1, duration: 2.2, ease: 'power2.out' }, 0)
            .to(words, { yPercent: 0, duration: 1, stagger: 0.12 }, 0.2)
            .to(fades, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.85);
        })
      );
    },
    { scope: rootRef }
  );

  const toApproach = (e) => {
    const el = document.getElementById('principles');
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageTransition>
      <div ref={rootRef}>
        <style>{ABOUT_CSS}</style>
        <AboutRail />

        {/* ============ HERO ============ */}
        <section
          id="about-hero"
          ref={heroRef}
          aria-labelledby="about-title"
          className="relative min-h-[88svh] flex items-end overflow-hidden grain"
          style={{ backgroundColor: ABIX.obsidian }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <img
              ref={heroImgRef}
              src={aboutHero}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ opacity: 0.6 }}
            />
          </div>
          {/* drifting amber light and leaf shadow */}
          <div
            aria-hidden="true"
            className="abix-amber absolute -right-[10%] top-[8%] h-[70%] w-[70%] pointer-events-none"
            style={{ background: `radial-gradient(closest-side, ${ABIX.gold25} 0%, transparent 70%)` }}
          />
          <LeafShadow side="right" opacity={0.08} />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(0deg, ${ABIX.obsidian} 0%, ${ABIX.obsidian}99 40%, ${ABIX.obsidian}26 100%)` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(90deg, ${ABIX.obsidian}CC 0%, ${ABIX.obsidian}33 55%, transparent 100%)` }}
          />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 pt-36 pb-16 lg:pb-24 w-full">
            <div className="max-w-2xl">
              <div data-hero-fade><Eyebrow light>About ABIXMART</Eyebrow></div>
              <h1
                id="about-title"
                className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.98] tracking-tight"
                style={{ color: ABIX.ivory }}
              >
                {HEADLINE.map((line, li) => (
                  <span key={li} className="block">
                    {line.map((w, wi) => (
                      <span key={w} className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em]">
                        <span
                          data-word
                          className={`inline-block ${li === 1 ? 'italic' : ''}`}
                          style={li === 1 ? { color: ABIX.goldLight } : undefined}
                        >
                          {w}
                          {wi < line.length - 1 ? '\u00A0' : ''}
                        </span>
                      </span>
                    ))}
                  </span>
                ))}
              </h1>
              <p data-hero-fade className="mt-7 max-w-md text-lg leading-relaxed" style={{ color: ABIX.ivory70 }}>
                If something belongs in your daily ritual, you should be able to see where it came from and how it was made.
              </p>
              <div data-hero-fade className="mt-9">
                <a
                  href="#principles"
                  onClick={toApproach}
                  className={`group inline-flex w-full sm:w-auto items-center justify-center h-14 px-9 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full transition-colors duration-300 hover:brightness-110 ${FOCUS_RING}`}
                  style={{ backgroundColor: ABIX.gold, color: FOREST.deepest }}
                >
                  Discover our approach
                  <span className="ml-3 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true">↓</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <Principles />
        <MountainToRitual />
        <Transparency />
        <EverydayRitual />

        {/* ============ CLOSING ============ */}
        <section
          id="closing"
          aria-labelledby="closing-title"
          className="relative overflow-hidden grain"
          style={{ background: `linear-gradient(180deg, ${FOREST.deep} 0%, ${FOREST.deepest} 55%, ${ABIX.obsidian} 100%)` }}
        >
          <img
            src={aboutJourney}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            style={{
              opacity: 0.14,
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, transparent 100%)',
            }}
          />
          <LeafShadow side="left" opacity={0.06} className="inset-x-0 top-0 h-[70%]" />

          <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-10 pt-24 lg:pt-36 text-center">
            <GrowingStem />
            <div data-reveal className="mt-6 flex justify-center"><Eyebrow light>What comes next</Eyebrow></div>
            <h2
              id="closing-title"
              data-reveal
              data-reveal-delay="0.08"
              className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight"
              style={{ color: ABIX.ivory }}
            >
              The collection is{' '}
              <span className="italic" style={{ color: ABIX.gold }}>only beginning.</span>
            </h2>
            <p data-reveal data-reveal-delay="0.16" className="mt-6 text-lg leading-relaxed max-w-xl mx-auto" style={{ color: ABIX.ivory70 }}>
              Shilajit is where ABIXMART begins. More will follow, carefully and transparently, with the same
              respect for origin and process.
            </p>
            <div data-reveal data-reveal-delay="0.24" className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <Link
                to="/shop/shilajit"
                className={`group inline-flex items-center justify-center h-14 px-9 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full transition-colors duration-300 hover:brightness-110 ${FOCUS_RING}`}
                style={{ backgroundColor: ABIX.gold, color: FOREST.deepest }}
              >
                Explore Shilajit
                <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true">→</span>
              </Link>
              <Link
                to="/support#contact"
                className={`inline-flex items-center justify-center h-14 px-9 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full border transition-colors duration-300 hover:bg-[rgba(199,174,125,0.08)] ${FOCUS_RING}`}
                style={{ color: ABIX.goldLight, borderColor: `${ABIX.goldLight}66` }}
              >
                Contact us
              </Link>
            </div>
          </div>

          {/* existing pre-order strip, kept as a quiet part of the ending */}
          {showGrowing ? (
            <div className="relative z-10 mt-20 lg:mt-28 pb-20 lg:pb-28">
              <div className="mx-auto max-w-7xl px-6 lg:px-10 mb-8">
                <div data-reveal className="flex items-center gap-4">
                  <span data-line className="block h-px w-14" style={{ backgroundColor: ABIX.gold }} />
                  <span className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
                    Growing next
                  </span>
                </div>
              </div>
              <ComingSoonMarquee />
            </div>
          ) : (
            <div className="pb-20 lg:pb-28" />
          )}
        </section>
      </div>
    </PageTransition>
  );
}