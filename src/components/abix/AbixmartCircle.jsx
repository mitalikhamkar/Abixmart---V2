// src/components/abix/AbixmartCircle.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import circleImg from '@/assets/home/AbixmartCircle.png';
import { ABIX } from './brandColors';

export default function AbixmartCircle() {
  const [done, setDone] = useState(false);

  return (
    // CHANGED: base is now ABIX.blackOlive (was ABIX.deep) — the
    // "surrounding background" this image-led section needs, per the
    // brief's Join the Circle direction.
    <section className="relative overflow-hidden" style={{ backgroundColor: ABIX.blackOlive }}>
      <div className="grid lg:grid-cols-5 min-h-[560px] lg:min-h-[680px]">
        <div className="relative lg:col-span-3 order-1 aspect-[4/5] sm:aspect-[16/10] lg:aspect-auto lg:min-h-[680px] overflow-hidden">
          <motion.img
            src={circleImg}
            alt="The ABIXMART Circle"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
            initial={{ opacity: 0, scale: 1.05 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
          {/* CHANGED: gradient now uses ABIX.obsidian's rgb values
              instead of a hardcoded rgba(15,20,17,...) that wasn't
              tied to any token. */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(0deg, rgba(16,24,20,0.35) 0%, transparent 35%)' }}
            aria-hidden="true"
          />
        </div>

        <div className="relative lg:col-span-2 order-2 flex items-center px-6 py-16 sm:px-10 lg:px-14 lg:py-0">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
              The ABIXMART Circle
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
              Stay close to what's <span className="italic" style={{ color: ABIX.gold }}>next.</span>
            </h2>
            <p className="mt-5 text-sm sm:text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
              Discover new launches, thoughtful wellness essentials, and the ideas shaping the ABIXMART world.
            </p>

            <div className="mt-9">
              {done ? (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ border: `1px solid ${ABIX.gold}` }}>
                    <Check size={15} style={{ color: ABIX.gold }} />
                  </div>
                  <p className="text-sm" style={{ color: ABIX.ivory70 }}>
                    You're in. We'll be in touch when there's something worth sharing.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="flex flex-col gap-4">
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    className="w-full bg-transparent border-b py-3 text-sm focus:outline-none transition-colors"
                    style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
                  />
                  <button
                    type="submit"
                    className="group self-start inline-flex items-center gap-3 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
                    style={{ color: ABIX.ivory }}
                  >
                    Join the Circle
                    <span className="inline-block h-px w-6 transition-all duration-300 group-hover:w-9" style={{ backgroundColor: ABIX.gold }} />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}