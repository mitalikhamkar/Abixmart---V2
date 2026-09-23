// src/components/abix/FeaturedProduct.jsx
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { ScanEye } from 'lucide-react';
import ProductQuickView from './ProductQuickView';
import { featuredProduct, PRODUCT_HERO_IMAGE } from '@/data/products';

/**
 * Featured Product — a product SPECIMEN, not a conventional ecommerce
 * block. No price/qty/cart here; that only appears after exploring the
 * product in ProductQuickView.
 *
 * No stroked ring around the product anymore — a stroked circle never
 * quite matched the product's own shape/position and kept reading as
 * "off". Replaced with a soft radial glow behind it and a soft grounding
 * shadow beneath it — a natural spotlight rather than a geometric outline.
 */
export default function FeaturedProduct() {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const p = featuredProduct;

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const imageRef = useRef(null);
  const ctaRef = useRef(null);
  const markRefs = useRef([0, 1].map(() => React.createRef()));

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const marks = markRefs.current.map((r) => r.current).filter(Boolean);

      if (reduceMotion) {
        gsap.set([headingRef.current, imageRef.current, ctaRef.current, ...marks], { opacity: 1, scale: 1, y: 0 });
        return;
      }

      gsap.set(headingRef.current, { opacity: 0, y: 20 });
      gsap.set(imageRef.current, { opacity: 0, scale: 0.88, y: 26 });
      gsap.set(marks, { opacity: 0 });
      gsap.set(ctaRef.current, { opacity: 0, y: 14 });

      gsap
        .timeline({
          scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', once: true },
          defaults: { ease: 'power3.out' },
        })
        .to(headingRef.current, { opacity: 1, y: 0, duration: 0.7 }, 0)
        .to(imageRef.current, { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'power2.out' }, 0.15)
        .to(marks, { opacity: 1, duration: 0.5, stagger: 0.15 }, 0.95)
        .to(ctaRef.current, { opacity: 1, y: 0, duration: 0.5 }, 1.15);
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} id="featured" className="relative bg-[#1E1C1F] py-24 lg:py-32 overflow-hidden">
      {/* restrained material glow — amber/resin, not brown */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(190,138,75,0.14),transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10 text-center">
        <span className="block font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm text-gold-light">
          Featured
        </span>
        <h2
          ref={headingRef}
          className="mt-5 font-display text-4xl sm:text-5xl lg:text-7xl text-ivory leading-[1.02] tracking-tight"
        >
          ABIXMART
          <br className="hidden sm:block" /> Himalayan Shilajit
        </h2>
        <p className="mt-5 text-ivory/55 max-w-md mx-auto text-base lg:text-lg">{p.tagline}</p>
      </div>

      {/* Product specimen — soft spotlight, no geometric ring */}
      <div className="relative mt-10 lg:mt-14 mx-auto max-w-md sm:max-w-lg lg:max-w-xl px-6">
        <div ref={markRefs.current[0]} className="flex flex-col items-center gap-1.5 mb-3">
          <span className="h-3 w-px bg-gold-light/40" />
          <span className="font-grotesk text-[9px] uppercase tracking-luxe-sm text-ivory/40">{p.size}</span>
        </div>

        <div className="relative flex items-center justify-center py-6">
          {/* soft radial glow, hugging the product rather than an outline around it */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(closest-side, rgba(211,164,103,0.16), transparent 72%)' }}
          />

          <div ref={imageRef} className="relative w-[64%] sm:w-[58%]">
            <img
              src={PRODUCT_HERO_IMAGE}
              alt={`${p.name} — ${p.subtitle}`}
              className="w-full h-auto select-none"
              style={{ filter: 'drop-shadow(0 26px 34px rgba(0,0,0,0.5))' }}
              draggable={false}
            />
            {/* grounding shadow — anchors the product instead of a ring */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-[70%] h-4 rounded-full bg-black/50 blur-md"
              style={{ opacity: 0.5 }}
            />
          </div>
        </div>

        <div ref={markRefs.current[1]} className="flex items-center justify-center gap-2 mt-2">
          <span className="w-3 h-px bg-gold-light/40" />
          <span className="font-grotesk text-[9px] uppercase tracking-luxe-sm text-ivory/40">High Himalayas</span>
          <span className="w-3 h-px bg-gold-light/40" />
        </div>

        <div ref={ctaRef} className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => setQuickViewOpen(true)}
            aria-label="Quick view — explore product"
            className="group inline-flex items-center gap-3 h-14 px-8 border border-gold-light/50 text-ivory text-[12px] font-semibold tracking-luxe-sm uppercase hover:bg-gold-light hover:text-[#151417] transition-colors duration-300"
          >
            <ScanEye size={16} />
            Explore Product
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
          <Link
            to="/shop/shilajit"
            className="text-[11px] uppercase tracking-luxe-sm text-ivory/40 hover:text-ivory/70 transition-colors"
          >
            View full details
          </Link>
        </div>
      </div>

      <ProductQuickView open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </section>
  );
}