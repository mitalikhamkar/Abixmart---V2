// src/components/abix/FeaturedShilajit.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Eyebrow from '@/components/abix/Eyebrow';
import { trustPillars } from '@/data/products';

export default function FeaturedShilajit({ product }) {
  if (!product) return null;

  return (
    <section className="bg-[#1E1C1F] py-16 lg:py-24 border-t border-[#F2ECE2]/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden bg-[#151417]/40 ring-1 ring-[#F2ECE2]/10"
          >
            {product.shopImage && (
              <img src={product.shopImage} alt={product.name} className="h-full w-full object-cover" />
            )}
          </motion.div>

          <div>
            <Eyebrow light>Signature Ritual</Eyebrow>
            <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl text-ivory leading-[1.02] tracking-tight">
              {product.name}
            </h2>
            <p className="mt-5 text-ivory/70 text-lg leading-relaxed max-w-md">{product.description}</p>

            <div className="mt-8 flex items-center gap-4">
              <span className="font-price text-3xl text-ivory">
                {product.currency}
                {product.price}
              </span>
              <span className="label-meta text-[#D3A467]">Available</span>
            </div>

            <Link
              to={`/shop/${product.slug}`}
              className="group mt-8 inline-flex items-center justify-center h-14 px-8 border border-[#F2ECE2]/60 text-ivory text-[12px] font-semibold tracking-luxe-sm uppercase hover:bg-[#BE8A4B] hover:text-[#151417] hover:border-[#BE8A4B] transition-colors duration-300"
            >
              Explore Product
              <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        {/* Compact editorial info — reuses existing trustPillars content */}
        <div className="mt-16 lg:mt-20 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 border-t border-[#F2ECE2]/10 pt-12">
          {trustPillars.map((t) => (
            <div key={t.key}>
              <span className="label-meta text-[#D3A467]">{t.label}</span>
              <h4 className="mt-2 font-display text-lg text-ivory leading-snug">{t.title}</h4>
              <p className="mt-2 text-sm text-[#A79C8D] leading-relaxed">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}