// src/components/abix/AbixmartCircle.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import abixmartLogo from '@/assets/logo/Abixmart-full.png';
import { ABIX } from './brandColors';

const orbitWords = [
  { word: 'Rhythm', style: { top: '4%', left: '50%', transform: 'translateX(-50%)' } },
  { word: 'Discovery', style: { top: '50%', right: '2%', transform: 'translateY(-50%)' } },
  { word: 'Balance', style: { bottom: '4%', left: '50%', transform: 'translateX(-50%)' } },
  { word: 'Community', style: { top: '50%', left: '2%', transform: 'translateY(-50%)' } },
];

export default function AbixmartCircle() {
  const [done, setDone] = useState(false);

  return (
    <section className="relative py-24 lg:py-36 overflow-hidden" style={{ background: ABIX.deep }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 50% 50%, ${ABIX.gold15}, transparent 60%)` }}
      />

      <div className="relative mx-auto max-w-5xl px-6 lg:px-10 flex flex-col items-center text-center">
        <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
          The ABIXMART Circle
        </span>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight" style={{ color: ABIX.ivory }}>
          Join the <span className="italic" style={{ color: ABIX.gold }}>Circle.</span>
        </h2>

        <div className="relative mt-14 lg:mt-16 w-full max-w-[380px] aspect-square">
          <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${ABIX.gold25}` }} />
          <div className="absolute inset-[14%] rounded-full" style={{ border: `1px solid ${ABIX.ivory12}` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={abixmartLogo} alt="ABIXMART" className="w-[26%] h-auto opacity-90" />
          </div>
          {orbitWords.map(({ word, style }) => (
            <span
              key={word}
              className="absolute font-grotesk text-[10px] uppercase tracking-luxe-sm whitespace-nowrap"
              style={{ ...style, color: ABIX.ivory70 }}
            >
              {word}
            </span>
          ))}
        </div>

        <div className="mt-14 lg:mt-16 w-full max-w-md">
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ border: `1px solid ${ABIX.gold}` }}>
                <Check size={22} style={{ color: ABIX.gold }} />
              </div>
              <p className="text-sm" style={{ color: ABIX.ivory70 }}>
                You're in. We'll be in touch when there's something worth sharing.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              onSubmit={(e) => { e.preventDefault(); setDone(true); }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                required
                placeholder="Email address"
                className="flex-1 bg-transparent border-b py-3 text-sm focus:outline-none transition-colors"
                style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
              />
              <button
                type="submit"
                className="group inline-flex items-center justify-center gap-3 h-12 px-7 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
                style={{ backgroundColor: ABIX.ivory, color: ABIX.deep }}
              >
                Join
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
}