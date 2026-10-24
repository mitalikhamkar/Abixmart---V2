// src/components/abix/AbixmartCircle.jsx
//
// The ABIXMART Circle, in the same visual language as the rest of the
// homepage: forest-green chapter background, drifting leaf light and the arch
// window (mirrored here, on the right, against the showcase's arch on the left).
// Form behaviour is unchanged.
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import circleImg from '@/assets/home/AbixmartCircle.png';
import LeafShadow from '@/components/abix/home/LeafShadow';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from './brandColors';

const ARCH = '50% 50% 0 0 / 34% 34% 0 0';

export default function AbixmartCircle() {
  const [done, setDone] = useState(false);
  const rootRef = useRef(null);
  const archRef = useRef(null);
  const imgRef = useRef(null);

  useScrollReveal(rootRef);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (!archRef.current) return;
      const trigger = { trigger: archRef.current, start: 'top 82%', once: true };
      gsap.fromTo(
        archRef.current,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power3.inOut', scrollTrigger: trigger }
      );
      gsap.fromTo(
        imgRef.current,
        { scale: 1.15 },
        { scale: 1, duration: 1.8, ease: 'power2.out', scrollTrigger: trigger }
      );
    },
    { scope: rootRef }
  );

  return (
    <section
      ref={rootRef}
      aria-labelledby="circle-title"
      className="relative overflow-hidden grain"
      style={{
        background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deep} 14%, ${FOREST.mid} 52%, ${FOREST.deep} 86%, ${ABIX.obsidian} 100%)`,
      }}
    >
      <LeafShadow side="left" opacity={0.05} className="inset-x-0 top-0 h-[70%]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-24 lg:py-36 grid lg:grid-cols-12 gap-16 lg:gap-12 items-center">
        {/* Content */}
        <div className="lg:col-span-6">
          <div data-reveal>
            <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
              The ABIXMART Circle
            </span>
          </div>

          <h2
            id="circle-title"
            data-reveal
            data-reveal-delay="0.1"
            className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.04] tracking-tight"
            style={{ color: ABIX.ivory }}
          >
            Stay close to what's{' '}
            <span className="italic" style={{ color: ABIX.gold }}>next.</span>
          </h2>

          <p
            data-reveal
            data-reveal-delay="0.2"
            className="mt-5 max-w-md text-sm sm:text-base leading-relaxed"
            style={{ color: ABIX.ivory70 }}
          >
            Discover new launches, thoughtful wellness essentials, and the ideas shaping the ABIXMART world.
          </p>

          <div data-reveal data-reveal-delay="0.3" className="mt-10 max-w-sm">
            {done ? (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ border: `1px solid ${ABIX.gold}` }}
                >
                  <Check size={15} style={{ color: ABIX.gold }} />
                </div>
                <p className="text-sm" style={{ color: ABIX.ivory70 }}>
                  You're in. We'll be in touch when there's something worth sharing.
                </p>
              </motion.div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDone(true);
                }}
                className="flex flex-col gap-5"
              >
                <label htmlFor="circle-email" className="sr-only">Email address</label>
                <input
                  id="circle-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email address"
                  className="w-full bg-transparent border-b py-3 text-sm focus:outline-none focus:border-[#B49A62] transition-colors placeholder:text-[rgba(230,225,213,0.4)]"
                  style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
                />
                <button
                  type="submit"
                  className={`group self-start inline-flex items-center gap-3 min-h-[48px] text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300 ${FOCUS_RING}`}
                  style={{ color: ABIX.ivory }}
                >
                  Join the Circle
                  <span
                    className="inline-block h-px w-6 transition-all duration-300 group-hover:w-10"
                    style={{ backgroundColor: ABIX.gold }}
                  />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Arch window, the mirror of the Shilajit showcase */}
        <div className="lg:col-span-5 lg:col-start-8 flex justify-center lg:justify-end order-first lg:order-last">
          <div className="relative w-full max-w-[22rem] lg:max-w-[26rem] aspect-[3/4]">
            <div
              aria-hidden="true"
              className="absolute -inset-3 pointer-events-none"
              style={{ border: `1px solid ${ABIX.gold25}`, borderRadius: ARCH }}
            />
            <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: ARCH }}>
              <div ref={archRef} className="absolute inset-0" style={{ background: FOREST.deepest }}>
                <img
                  ref={imgRef}
                  src={circleImg}
                  alt="The ABIXMART Circle"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(0deg, ${FOREST.deepest}99 0%, transparent 45%)` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}