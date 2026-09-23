// src/components/abix/CollectionHero.jsx
import React from 'react';
import { motion } from 'framer-motion';
import Eyebrow from '@/components/abix/Eyebrow';
import shilajitHero from '@/assets/products/Shilajit-hero.png';

export default function CollectionHero({ products }) {
  return (
    <section className="relative bg-[#151417]">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 pt-28 lg:pt-32 pb-12 lg:pb-16">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Text area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 relative z-10"
          >
            <Eyebrow light>The ABIXMART Collection</Eyebrow>

            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-[3.4rem] text-ivory leading-[1.05] tracking-tight">
              Rooted in origin.
              <br />
              Designed for ritual.
            </h1>

            <p className="mt-6 max-w-md text-ivory/65 text-base lg:text-lg leading-relaxed">
              A growing collection of Ayurvedic wellness essentials, built one
              considered product at a time. Shilajit leads the way — more are
              on the horizon.
            </p>
          </motion.div>

          {/* Image area */}
          <motion.div
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 relative order-first lg:order-last"
          >
            <div className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/11] overflow-hidden">
              <img
                src={shilajitHero}
                alt="ABIXMART Himalayan Shilajit"
                className="h-full w-full object-cover object-center"
              />

              {/* Localized gradient for edge blending only — image stays visible */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#151417]/35 via-transparent to-transparent lg:from-[#151417]/25" />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#151417]/40 to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Collection index — clickable, scrolls to the matching card below */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="mt-12 lg:mt-14 border-t border-[#F2ECE2]/10"
        >
          {products.map((p, i) => {
            const available = p.status === 'available';

            return (
              <a
                key={p.id}
                href={`#product-${p.slug}`}
                className="group flex items-center justify-between py-4 sm:py-5 border-b border-[#F2ECE2]/10 transition-colors hover:bg-[#F2ECE2]/[0.03]"
              >
                <span className="flex items-center gap-4 sm:gap-6">
                  <span className="font-grotesk text-xs text-[#A79C8D]">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span
                    className={`font-display text-xl sm:text-2xl transition-colors ${
                      available
                        ? 'text-ivory'
                        : 'text-[#A79C8D] group-hover:text-ivory/80'
                    }`}
                  >
                    {p.name}
                  </span>
                </span>

                <span className="flex items-center gap-2 shrink-0">
                  {available && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D3A467]" />
                  )}

                  <span
                    className={`label-meta ${
                      available ? 'text-[#D3A467]' : 'text-[#8F8579]'
                    }`}
                  >
                    {available ? 'Available' : 'Coming Soon'}
                  </span>
                </span>
              </a>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}