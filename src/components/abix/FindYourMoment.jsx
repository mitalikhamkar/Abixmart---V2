// src/components/abix/FindYourMoment.jsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { ABIX } from './brandColors';

// ABIXMART homepage — Section 02: "Find what fits your day."
// START / FOCUS / MOVE / RESET as accessible text tabs. The section's
// main visual is a dedicated "living environment" panel: two soft
// glows + ~16 light motes whose drift direction/speed/opacity change
// per state, plus a flowing blurred stroke shown only for MOVE.
// Hover (desktop) previews the environment; click/tap commits it.
// No CTA — this section is the interaction, not another Shop link.

const MOMENTS = [
  { id: 'start', label: 'Start', copy: 'Begin with intention.' },
  { id: 'focus', label: 'Focus', copy: 'Make space for what matters.' },
  { id: 'move', label: 'Move', copy: 'Let the day carry you forward.' },
  { id: 'reset', label: 'Reset', copy: 'Slow the pace, and let go.' },
];

// One environment config per state — every value here is a variation
// on the same system (glow position/size/blur/tone, particle drift
// vector/speed/opacity), never a different visual language.
const ENV = [
  {
    // START — warm light expanding outward, slow and breathable
    primary: { x: '30%', y: '55%', size: 480, blur: 80, tone: 'rgba(176,141,87,0.22)' },
    secondary: { x: '62%', y: '35%', size: 360, blur: 100, tone: 'rgba(203,168,118,0.1)' },
    particle: { mode: 'outward', speed: 7.5, drift: 46, opacity: 0.55 },
    showFlow: false,
  },
  {
    // FOCUS — calmer, deepens, particles drawn toward one region
    primary: { x: '50%', y: '45%', size: 340, blur: 55, tone: 'rgba(176,141,87,0.3)' },
    secondary: { x: '50%', y: '45%', size: 640, blur: 130, tone: 'rgba(15,32,24,0.55)' },
    particle: { mode: 'inward', speed: 9.5, drift: 30, opacity: 0.4 },
    showFlow: false,
  },
  {
    // MOVE — directional flow, slightly more motion
    primary: { x: '70%', y: '60%', size: 460, blur: 90, tone: 'rgba(176,141,87,0.2)' },
    secondary: { x: '20%', y: '40%', size: 420, blur: 100, tone: 'rgba(203,168,118,0.1)' },
    particle: { mode: 'flow', speed: 5.5, drift: 60, opacity: 0.5 },
    showFlow: true,
  },
  {
    // RESET — quiet, deeper green, slow gentle fade/float
    primary: { x: '40%', y: '70%', size: 520, blur: 120, tone: 'rgba(15,32,24,0.6)' },
    secondary: { x: '55%', y: '35%', size: 320, blur: 90, tone: 'rgba(176,141,87,0.1)' },
    particle: { mode: 'settle', speed: 11, drift: 22, opacity: 0.32 },
    showFlow: false,
  },
];

// Fixed-position particle seeds — randomized once, never re-rolled, so
// only their motion (not their existence) changes with state.
function useParticleSeeds(count) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: 8 + Math.random() * 84, // %
        y: 10 + Math.random() * 80, // %
        size: 2 + Math.random() * 3, // px
        delay: -(Math.random() * 10), // negative delay desyncs loops
      })),
    [count]
  );
}

function moteVector(particle, mode, drift) {
  switch (mode) {
    case 'inward': {
      const dx = (50 - particle.x) / 100;
      const dy = (50 - particle.y) / 100;
      return { dx: dx * drift, dy: dy * drift };
    }
    case 'flow':
      return { dx: drift, dy: drift * 0.12 };
    case 'settle':
      return { dx: drift * 0.15, dy: drift };
    case 'outward':
    default: {
      const dx = (particle.x - 50) / 100;
      const dy = (particle.y - 50) / 100;
      return { dx: dx * drift, dy: dy * drift };
    }
  }
}

export default function FindYourMoment() {
  const sectionRef = useRef(null);
  const introRef = useRef(null);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(null);

  const particles = useParticleSeeds(16);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handleChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Entrance only — heading + controls + environment panel settle
  // once when scrolled into view. No pin, no scrub.
  useGSAP(
    () => {
      const items = introRef.current?.querySelectorAll('[data-entrance]');
      if (reduceMotion) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(items, { opacity: 0, y: 20 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: sectionRef, dependencies: [reduceMotion] }
  );

  // Hover previews the environment on desktop; committed state (used
  // for text content) only changes on click/tap.
  const previewIndex = hoverIndex ?? activeIndex;
  const env = ENV[previewIndex];
  const active = MOMENTS[activeIndex];

  const glowTransition = reduceMotion
    ? 'none'
    : 'left 0.7s cubic-bezier(0.22,1,0.36,1), top 0.7s cubic-bezier(0.22,1,0.36,1), width 0.7s ease, height 0.7s ease, background 0.7s ease';

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-24 lg:py-32 grain"
      style={{ backgroundColor: ABIX.deep }}
    >
      {/* Hero → section tonal continuation, no hard seam */}
      <div
        className="absolute inset-x-0 top-0 h-56 lg:h-72 z-0 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${ABIX.deeper} 0%, transparent 100%)`,
          opacity: 0.5,
        }}
        aria-hidden="true"
      />

      <div ref={introRef} className="relative z-10 mx-auto max-w-5xl w-full px-6 lg:px-10">
        <span
          data-entrance
          className="block text-[12px] font-bold tracking-luxe-sm uppercase mb-4"
          style={{ color: ABIX.gold }}
        >
          Your Day, Your Rhythm
        </span>

        <h2
          data-entrance
          className="font-display leading-[1.05] tracking-tight text-[clamp(1.9rem,4.6vw,2.9rem)] mb-4 max-w-xl"
          style={{ color: ABIX.ivory }}
        >
          Find what fits your day.
        </h2>

        <p
          data-entrance
          className="text-sm sm:text-base leading-relaxed font-body mb-10 lg:mb-14 max-w-md"
          style={{ color: ABIX.ivory70 }}
        >
          Move through the moments of your day, and watch the ABIXMART world respond.
        </p>

        {/* CONTROLS */}
        <div
          data-entrance
          role="tablist"
          aria-label="Moments of your day"
          className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:gap-x-10 mb-8 lg:mb-10 pb-1 border-b"
          style={{ borderColor: ABIX.ivory12 }}
        >
          {MOMENTS.map((moment, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={moment.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(i)}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(i)}
                onBlur={() => setHoverIndex(null)}
                className="relative py-2 min-h-[44px] font-display uppercase tracking-luxe-sm transition-colors duration-300 focus:outline-none"
                style={{
                  fontSize: 'clamp(1.05rem,2vw,1.35rem)',
                  color: isActive ? ABIX.ivory : ABIX.ivory45,
                }}
              >
                {moment.label}
                {isActive && (
                  <motion.span
                    layoutId="moment-indicator"
                    className="absolute left-0 right-0 -bottom-[5px] h-[2px] rounded-full"
                    style={{ backgroundColor: ABIX.gold }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 38 }
                    }
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* LIVING ENVIRONMENT — the section's main visual. Remove all
            text and this panel still visibly changes per state. */}
        <div
          data-entrance
          className="relative w-full min-h-[300px] sm:min-h-[360px] lg:min-h-[440px] rounded-sm overflow-hidden"
          style={{ backgroundColor: ABIX.deeper }}
        >
          {/* glows */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: env.primary.x,
              top: env.primary.y,
              width: env.primary.size,
              height: env.primary.size,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${env.primary.tone} 0%, transparent 70%)`,
              filter: `blur(${env.primary.blur}px)`,
              transition: glowTransition,
            }}
            aria-hidden="true"
          />
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              left: env.secondary.x,
              top: env.secondary.y,
              width: env.secondary.size,
              height: env.secondary.size,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${env.secondary.tone} 0%, transparent 75%)`,
              filter: `blur(${env.secondary.blur}px)`,
              transition: glowTransition,
            }}
            aria-hidden="true"
          />

          {/* light motes — direction/speed/opacity respond to state */}
          {particles.map((p) => {
            const { dx, dy } = moteVector(p, env.particle.mode, env.particle.drift);
            return (
              <span
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: ABIX.goldLight,
                  opacity: reduceMotion ? env.particle.opacity * 0.6 : 0,
                  animation: reduceMotion
                    ? 'none'
                    : `abixMote ${env.particle.speed}s ease-in-out ${p.delay}s infinite`,
                  '--mote-dx': `${dx}px`,
                  '--mote-dy': `${dy}px`,
                  '--mote-opacity': env.particle.opacity,
                }}
                aria-hidden="true"
              />
            );
          })}

          {/* flowing stroke — MOVE only */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-700"
            style={{ opacity: env.showFlow ? 1 : 0 }}
            viewBox="0 0 800 400"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M-50,220 C120,160 220,280 400,210 C580,140 680,260 850,190"
              fill="none"
              stroke={ABIX.gold}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.35"
              filter="blur(1.5px)"
              style={{
                strokeDasharray: '18 22',
                animation:
                  env.showFlow && !reduceMotion ? 'abixFlow 4.5s linear infinite' : 'none',
              }}
            />
          </svg>

          {/* committed content — changes on click/tap only */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center h-full min-h-[300px] sm:min-h-[360px] lg:min-h-[440px] px-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -14 }}
                transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <span
                  className="block text-[11px] font-semibold tracking-luxe-sm uppercase mb-3"
                  style={{ color: ABIX.gold }}
                >
                  {active.label}
                </span>
                <p
                  className="font-display text-[clamp(1.4rem,3vw,2rem)]"
                  style={{ color: ABIX.ivory }}
                >
                  {active.copy}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes abixMote {
          0% { transform: translate(0, 0); opacity: 0; }
          15% { opacity: var(--mote-opacity); }
          50% { transform: translate(var(--mote-dx), var(--mote-dy)); }
          85% { opacity: var(--mote-opacity); }
          100% { transform: translate(calc(var(--mote-dx) * -1), calc(var(--mote-dy) * -1)); opacity: 0; }
        }
        @keyframes abixFlow {
          to { stroke-dashoffset: -80; }
        }
      `}</style>
    </section>
  );
}