// src/components/abix/RitualOffers.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ritualBundles } from '@/data/products';

// Warm mineral-stone surface — continues the charcoal/mineral/resin system.
// CTA now goes straight to the existing Support inquiry form — no modal,
// no separate name/phone screen.
export default function RitualOffers() {
  return (
    <section id="offers" className="bg-[#322E2C] py-24 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14 lg:mb-20">
          <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm text-gold-light">Start your ritual</span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl text-ivory leading-[1.02] tracking-tight">
            Choose your rhythm.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          {ritualBundles.map((b, i) => (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className={`relative flex flex-col p-8 lg:p-10 transition-colors duration-500 ${
                b.highlight ? 'bg-resin text-ivory' : 'bg-[#151417]/50 text-ivory'
              }`}
            >
              {b.highlight && (
                <span className="absolute top-6 right-6 font-grotesk text-[9px] uppercase tracking-luxe-sm text-ivory/80">
                  Most chosen
                </span>
              )}
              <span className={`font-grotesk text-6xl font-medium leading-none ${b.highlight ? 'text-ivory/25' : 'text-ivory/15'}`}>
                0{i + 1}
              </span>
              <h3 className="mt-6 font-display text-3xl">{b.name}</h3>
              <p className={`mt-2 text-sm ${b.highlight ? 'text-ivory/75' : 'text-ivory/55'}`}>{b.detail}</p>

              {/* Price block: struck-through original, prominent current
                  price, saving shown but secondary. */}
              <div className="mt-8">
                <span className={`block text-sm line-through ${b.highlight ? 'text-ivory/50' : 'text-ivory/40'}`}>
                  ₹{b.originalPrice.toLocaleString('en-IN')}
                </span>
                <div className="mt-1 flex items-baseline gap-3 flex-wrap">
                  <span className="font-price text-4xl">₹{b.price.toLocaleString('en-IN')}</span>
                  <span className={`text-xs font-medium ${b.highlight ? 'text-ivory/80' : 'text-gold-light'}`}>
                    Save ₹{b.saving.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <Link
                to={`/support?product=shilajit&quantity=${b.quantity}&ritual=${b.id}#inquiry`}
                className={`group mt-8 h-14 inline-flex items-center justify-center text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300 ${
                  b.highlight
                    ? 'bg-ivory text-[#151417] hover:bg-[#151417] hover:text-ivory'
                    : 'bg-ivory text-[#151417] hover:bg-resin hover:text-ivory'
                }`}
              >
                Start this ritual
                <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-ivory/50 max-w-lg mx-auto">
          Promotional pricing shown is representative. No fabricated urgency — choose what fits your practice.
        </p>
      </div>
    </section>
  );
}