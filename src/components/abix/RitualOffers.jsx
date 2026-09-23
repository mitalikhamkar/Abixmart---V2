// src/components/abix/RitualOffers.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ABIX } from './brandColors';

// Editorial interactive list — NOT a 4-card grid. Full-width stacked
// rows, large type, hover reveals a one-line description. This is the
// "typography, spacing, subtle movement" version the brief asked for.
const moments = [
  { key: 'focus', title: 'Focus', line: 'For the hours that need clarity.' },
  { key: 'move', title: 'Move', line: 'For strength, stamina, and motion.' },
  { key: 'rest', title: 'Rest', line: 'For slowing down, deliberately.' },
  { key: 'reset', title: 'Reset', line: 'For beginning again, gently.' },
];

export default function RitualOffers() {
  const [hovered, setHovered] = useState(null);

  return (
    <section id="offers" className="relative py-24 lg:py-36" style={{ background: ABIX.deep }}>
      <div className="relative mx-auto max-w-5xl px-6 lg:px-10">
        <div className="mb-12 lg:mb-16">
          <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
            Choose Your Rhythm
          </span>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
            ABIXMART fits the moment.
          </h2>
        </div>

        <div style={{ borderTop: `1px solid ${ABIX.ivory12}` }}>
          {moments.map((m, i) => {
            const isHovered = hovered === m.key;
            return (
              <motion.div
                key={m.key}
                onMouseEnter={() => setHovered(m.key)}
                onMouseLeave={() => setHovered(null)}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="group flex items-baseline justify-between py-7 lg:py-9 cursor-default transition-colors duration-500"
                style={{ borderBottom: `1px solid ${ABIX.ivory12}` }}
              >
                <div className="flex items-baseline gap-6 lg:gap-10">
                  <span className="font-grotesk text-[11px] tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
                    0{i + 1}
                  </span>
                  <h3
                    className="font-display text-3xl sm:text-4xl lg:text-5xl transition-all duration-500"
                    style={{ color: isHovered ? ABIX.gold : ABIX.ivory }}
                  >
                    {m.title}
                  </h3>
                </div>
                <motion.p
                  animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : 12 }}
                  transition={{ duration: 0.35 }}
                  className="hidden sm:block text-sm max-w-[240px] text-right"
                  style={{ color: ABIX.ivory70 }}
                >
                  {m.line}
                </motion.p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/shop"
            className="group inline-flex items-center gap-3 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
            style={{ color: ABIX.ivory }}
          >
            Find your rhythm in the shop
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}