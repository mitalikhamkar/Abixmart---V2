// src/components/abix/upcoming/UpcomingProductContent.jsx

// The product-information view for an upcoming product. Used inside the
// dialog (UpcomingProductView) and on the full product page
// (UpcomingProductPage), so both always show the same thing.
//
// Only data that exists on the product is shown: name, short description,
// description / note, facts and images. No ingredients, benefits, prices or
// launch dates are invented here.

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import Eyebrow from '@/components/abix/Eyebrow';
import { ABIX } from '@/components/abix/brandColors';
import { useProductNotify } from '@/hooks/useProductNotify';
import { useUpcoming } from '@/lib/Upcomingcontext';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

export default function UpcomingProductContent({ product, headingId, variant = 'modal' }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const { openPreOrder } = useUpcoming();
  const { status, error, subscribe, isLoggedIn } = useProductNotify(product.id, product.name);
  const [activeIndex, setActiveIndex] = useState(0);

  const images = useMemo(() => {
    const extra = Array.isArray(product.images?.gallery) ? product.images.gallery : [];
    return [product.shopImage, ...extra].filter(
      (src, i, all) => typeof src === 'string' && src.length > 0 && all.indexOf(src) === i
    );
  }, [product]);

  const heroSrc = images.length > 0 ? images[Math.min(activeIndex, images.length - 1)] : null;
  const Heading = variant === 'page' ? 'h1' : 'h2';
  const body = product.description || product.note || null;
  const extraNote = product.description && product.note && product.note !== product.description ? product.note : null;
  const facts = Array.isArray(product.facts) ? product.facts.filter((f) => f && f.label && f.value) : [];
  const subscribed = status === 'subscribed' || status === 'already-subscribed';

  // Same behaviour as the Coming Soon cards: signed-out visitors are sent to
  // log in and the Notify Me request is resumed afterwards.
  const handleNotify = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem(PENDING_NOTIFY_KEY, product.id);
      navigate('/login');
      return;
    }
    subscribe();
  };

  return (
    <div className={variant === 'modal' ? 'p-6 sm:p-8 lg:p-10' : ''}>
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Imagery */}
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="relative aspect-[4/5] overflow-hidden"
            style={{ background: `linear-gradient(160deg, ${ABIX.espresso} 0%, ${ABIX.obsidian} 100%)` }}
          >
            {heroSrc ? (
              <img src={heroSrc} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center px-6 text-center">
                <span className="font-display text-4xl" style={{ color: ABIX.ivory25 }}>{product.name}</span>
              </div>
            )}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(0deg, ${ABIX.obsidian}CC 0%, transparent 45%)` }}
            />
            {['top-4 left-4 border-t border-l', 'top-4 right-4 border-t border-r', 'bottom-4 left-4 border-b border-l', 'bottom-4 right-4 border-b border-r'].map((pos) => (
              <span key={pos} className={`absolute ${pos} w-5 h-5 pointer-events-none`} style={{ borderColor: ABIX.gold25 }} />
            ))}
            <span
              className="absolute bottom-5 left-5 label-meta px-2.5 py-1"
              style={{ background: `${ABIX.obsidian}CC`, color: ABIX.goldLight, border: `1px solid ${ABIX.gold25}` }}
            >
              Coming Soon
            </span>
            <span className="absolute bottom-5 right-5 text-[10px] tracking-wide" style={{ color: ABIX.ivory45 }}>
              Conceptual visual
            </span>
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Show image ${i + 1} of ${images.length}`}
                  aria-current={i === activeIndex ? 'true' : undefined}
                  className="h-16 w-16 overflow-hidden border transition-opacity"
                  style={{ borderColor: i === activeIndex ? ABIX.gold : ABIX.ivory12, opacity: i === activeIndex ? 1 : 0.6 }}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Information */}
        <motion.div
          className="lg:col-span-6"
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Eyebrow light>What's growing next</Eyebrow>

          <Heading
            id={headingId}
            className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight"
            style={{ color: ABIX.ivory }}
          >
            {product.name}
          </Heading>

          <p className="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.goldLight }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ABIX.gold }} />
            Coming Soon
            <span style={{ color: ABIX.ivory45 }}>· Not available to buy yet</span>
          </p>

          {product.shortDesc && (
            <p className="mt-6 font-display text-xl sm:text-2xl italic leading-snug" style={{ color: ABIX.goldLight }}>
              {product.shortDesc}
            </p>
          )}

          {body && (
            <p className="mt-4 max-w-lg text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
              {body}
            </p>
          )}
          {extraNote && (
            <p className="mt-3 max-w-lg text-sm leading-relaxed" style={{ color: ABIX.ivory45 }}>
              {extraNote}
            </p>
          )}

          {facts.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 max-w-md">
              {facts.map((f) => (
                <div key={f.label} className="border-t pt-2.5" style={{ borderColor: ABIX.ivory12 }}>
                  <dt className="label-meta" style={{ color: ABIX.ivory45 }}>{f.label}</dt>
                  <dd className="mt-0.5 font-display text-base" style={{ color: ABIX.ivory }}>{f.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => openPreOrder(product)}
              className="inline-flex items-center justify-center h-12 px-8 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
              style={{ background: ABIX.gold, color: ABIX.obsidian }}
              onMouseEnter={(e) => { e.currentTarget.style.background = ABIX.goldLight; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ABIX.gold; }}
            >
              Pre-order
            </button>

            <button
              type="button"
              onClick={handleNotify}
              disabled={status === 'submitting' || status === 'checking'}
              className="inline-flex items-center justify-center gap-2 h-12 px-6 border text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300 disabled:opacity-50"
              style={{ borderColor: subscribed ? ABIX.gold25 : ABIX.ivory25, color: subscribed ? ABIX.goldLight : ABIX.ivory }}
            >
              {subscribed ? <Check size={14} /> : <Bell size={14} />}
              {status === 'submitting' ? 'Saving…' : subscribed ? 'On the notify list' : 'Notify me'}
            </button>
          </div>

          {status === 'error' && error && (
            <p className="mt-3 text-sm" role="alert" style={{ color: ABIX.ivory70 }}>{error}</p>
          )}

          <p className="mt-4 max-w-md text-xs leading-relaxed" style={{ color: ABIX.ivory45 }}>
            Pre-order here is an expression of interest only. It is not an order, a reservation or a payment.
          </p>
        </motion.div>
      </div>
    </div>
  );
}