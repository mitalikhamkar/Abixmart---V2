// src/components/abix/DiscoverAbixmart.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { featuredProduct, PRODUCT_HERO_IMAGE } from '@/data/products';
import { ABIX } from './brandColors';

// "Featured / Discover ABIXMART" — replaces the old FeaturedProduct.jsx
// on Home. Deliberately restrained: no ring, no glow, no marks, no big
// "Explore Product" CTA button — just the real Shilajit photo at modest
// size beside a short brand-forward line, with a plain text link. The
// goal is "one beautiful visual element inside the ABIXMART world," not
// a Shilajit advertisement.
export default function DiscoverAbixmart() {
  return (
    <section className="relative py-24 lg:py-36 overflow-hidden" style={{ background: ABIX.deep }}>
      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative w-[52%] sm:w-[40%] lg:w-full max-w-[220px]">
              <div
                className="absolute inset-0 -z-10"
                style={{ background: `radial-gradient(closest-side, ${ABIX.gold15}, transparent 72%)` }}
              />
              <img
                src={PRODUCT_HERO_IMAGE}
                alt={featuredProduct.name}
                className="w-full h-auto select-none"
                style={{ filter: 'drop-shadow(0 20px 28px rgba(0,0,0,0.35))' }}
                draggable={false}
              />
            </div>
          </motion.div>

          <div className="lg:col-span-7">
            <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
              Discover ABIXMART
            </span>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
              The first chapter: Himalayan Shilajit.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
              {featuredProduct.tagline} — the same care and discipline that will
              carry every product ABIXMART makes next.
            </p>
            <Link
              to="/shop/shilajit"
              className="group mt-7 inline-flex items-center gap-3 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
              style={{ color: ABIX.ivory }}
            >
              View Shilajit
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}