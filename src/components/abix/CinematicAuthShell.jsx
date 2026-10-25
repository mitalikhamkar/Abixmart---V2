// src/components/abix/CinematicAuthShell.jsx
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Eyebrow from '@/components/abix/Eyebrow';
import LeafShadow from '@/components/abix/home/LeafShadow';
import { ABIX } from '@/components/abix/brandColors';

const EASE = [0.22, 1, 0.36, 1];

// Scoped motion + input focus styling. All animations switch off for reduced motion.
const SHELL_CSS = `
@keyframes abixAuthZoom { from { transform: scale(1.04); } to { transform: scale(1.14); } }
@keyframes abixAuthDrift {
  0% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(-3%, 2%, 0) scale(1.08); }
  100% { transform: translate3d(0, 0, 0) scale(1); }
}
@keyframes abixAuthSweep { 0% { transform: translateX(-120%); } 100% { transform: translateX(380%); } }
.abix-auth-bg { animation: abixAuthZoom 30s ease-in-out infinite alternate; }
.abix-auth-glow { animation: abixAuthDrift 14s ease-in-out infinite; }
.abix-auth-sweep { animation: abixAuthSweep 6s ease-in-out infinite; }
.abix-auth-card .express-input-inverse:focus {
  border-color: ${ABIX.goldLight};
  box-shadow: 0 1px 0 0 ${ABIX.goldLight};
  outline: none;
}
@media (prefers-reduced-motion: reduce) {
  .abix-auth-bg, .abix-auth-glow, .abix-auth-sweep { animation: none; }
}
`;

export default function CinematicAuthShell({ image, imageAlt = '', eyebrow, title, subtitle, footer, children }) {
  const reduce = useReducedMotion();

  const rise = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE, delay },
  });

  // The last word of the title is set in gold italic, like the other ABIXMART pages.
  const words = typeof title === 'string' ? title.split(' ') : null;

  return (
    // pt-28 / pt-32 keeps the card clear of the fixed site header.
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-charcoal flex items-center justify-center px-4 sm:px-6 pt-28 pb-12 sm:pt-32 sm:pb-16">
      <style>{SHELL_CSS}</style>

      <img
        src={image}
        alt={imageAlt}
        aria-hidden={imageAlt ? undefined : 'true'}
        className="abix-auth-bg absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/45 to-charcoal/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />

      {/* drifting amber light + leaf shadow, as on About and Support */}
      <div
        aria-hidden="true"
        className="abix-auth-glow absolute -left-[10%] top-[8%] h-[65%] w-[65%] pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${ABIX.gold25} 0%, transparent 70%)` }}
      />
      <LeafShadow side="right" opacity={0.07} />
      <div className="absolute inset-0 grain opacity-[0.06] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[460px]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          className="abix-auth-card relative rounded-2xl border border-ivory/15 bg-charcoal/40 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] px-5 py-8 sm:px-10 sm:py-11 overflow-hidden"
        >
          {/* gold hairline with a light that travels along it */}
          <span className="pointer-events-none absolute top-0 left-8 right-8 h-px overflow-hidden">
            <span className="block h-full w-full bg-gradient-to-r from-transparent via-gold-light/60 to-transparent" />
            <span
              className="abix-auth-sweep absolute inset-y-0 left-0 block w-1/4"
              style={{ background: `linear-gradient(90deg, transparent, ${ABIX.goldLight}, transparent)` }}
            />
          </span>

          {eyebrow && (
            <motion.div {...rise(0.25)}>
              <Eyebrow light>{eyebrow}</Eyebrow>
            </motion.div>
          )}

          {title && (
            <motion.h1
              {...rise(0.32)}
              className="mt-4 font-display text-3xl sm:text-[2.35rem] leading-[1.08] text-ivory tracking-tight"
            >
              {words
                ? words.map((w, i) => (
                    <React.Fragment key={`${w}-${i}`}>
                      {i > 0 ? ' ' : null}
                      {words.length > 1 && i === words.length - 1 ? (
                        <span className="italic" style={{ color: ABIX.goldLight }}>{w}</span>
                      ) : (
                        w
                      )}
                    </React.Fragment>
                  ))
                : title}
            </motion.h1>
          )}

          {subtitle && (
            <motion.p {...rise(0.4)} className="mt-3 text-ivory/60 text-sm sm:text-[15px] leading-relaxed">
              {subtitle}
            </motion.p>
          )}

          <motion.div {...rise(0.48)} className="mt-7">
            {children}
          </motion.div>

          {footer && (
            <motion.p
              {...rise(0.58)}
              className="mt-7 border-t border-ivory/10 pt-5 text-center text-sm text-ivory/55"
            >
              {footer}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}