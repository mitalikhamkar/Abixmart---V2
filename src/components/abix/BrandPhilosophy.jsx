// src/components/abix/BrandPhilosophy.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ABIX } from './brandColors';

export default function BrandPhilosophy() {
  return (
    <section id="philosophy" className="relative py-24 lg:py-36 overflow-hidden" style={{ background: ABIX.deep }}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at 80% 15%, ${ABIX.gold15}, transparent 55%)` }}
      />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="lg:col-span-4">
            <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
              The Brand
            </span>
          </div>

          <div className="lg:col-span-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display leading-[1.05] tracking-tight text-[clamp(1.7rem,4.2vw,2.8rem)]"
              style={{ color: ABIX.ivory }}
            >
              ABIXMART is a wellness brand, not a single product.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-xl text-base lg:text-lg leading-relaxed"
              style={{ color: ABIX.ivory70 }}
            >
              Every product carries the same discipline — sourced with intention,
              made for a daily ritual rather than a passing trend.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 lg:mt-14 flex flex-wrap gap-x-9 gap-y-3"
            >
              {['Origin', 'Discipline', 'Ritual', 'Growth'].map((word) => (
                <span key={word} className="font-grotesk text-[10px] uppercase tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
                  {word}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}