// src/components/abix/HomeReviews.jsx
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Quote } from 'lucide-react';
import Eyebrow from '@/components/abix/Eyebrow';
import { StarDisplay } from '@/components/abix/reviews/StarRating';
import { useCatalog } from '@/lib/CatalogContext';
import { useApprovedReviews } from '@/lib/useReviews';
import { useFeaturedReviews } from '@/lib/useFeaturedReviews';
import { computeReviewStats, formatReviewDate } from '@/lib/reviewUtils';
import { ABIX } from './brandColors';

// One spotlight plus up to four more in the rail.
const SELECTION_SIZE = 5;
const EASE = [0.16, 1, 0.3, 1];

const clamp = (lines) => ({
  display: '-webkit-box',
  WebkitLineClamp: lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
});

// Homepage reviews: approved reviews from every product, from the same
// Firestore source and hook as the product pages. A review is shown only
// when its product resolves in the catalog, so each one can name and link
// its product honestly. Featured reviews are preferred, and the selection
// rotates once every 24 hours (see featuredReviews.js).
export default function HomeReviews() {
  const reduce = useReducedMotion();
  const { reviews, loading, error } = useApprovedReviews(null);
  const { getProductById, loading: catalogLoading } = useCatalog();
  const [activeId, setActiveId] = useState(null);

  const resolved = useMemo(
    () =>
      reviews
        .map((review) => ({ review, product: getProductById(review.productId) }))
        .filter((x) => x.product),
    [reviews, getProductById]
  );
  const resolvedReviews = useMemo(() => resolved.map((x) => x.review), [resolved]);
  const productByReview = useMemo(
    () => new Map(resolved.map((x) => [x.review.id, x.product])),
    [resolved]
  );
  const stats = useMemo(() => computeReviewStats(resolvedReviews), [resolvedReviews]);
  const selection = useFeaturedReviews(resolvedReviews, { limit: SELECTION_SIZE, scope: 'home' });

  const busy = loading || catalogLoading;
  const active = selection.find((r) => r.id === activeId) || selection[0] || null;
  const activeProduct = active ? productByReview.get(active.id) : null;
  const isEmpty = !busy && !error && selection.length === 0;

  let body;
  if (busy) {
    body = (
      <div className="grid lg:grid-cols-12 gap-10" aria-label="Loading reviews">
        <div className="lg:col-span-7 h-64 rounded-2xl animate-pulse" style={{ background: ABIX.darkMoss, border: `1px solid ${ABIX.border15}` }} />
        <div className="lg:col-span-5 h-64 rounded-2xl animate-pulse" style={{ background: ABIX.darkMoss, border: `1px solid ${ABIX.border15}` }} />
      </div>
    );
  } else if (error) {
    body = (
      <p className="text-sm" role="alert" style={{ color: ABIX.ivory45 }}>
        Reviews are unavailable right now. Please check back soon.
      </p>
    );
  } else if (isEmpty) {
    body = (
      <div className="border-y py-10 text-center" style={{ borderColor: ABIX.border25 }}>
        <Quote size={24} className="mx-auto" style={{ color: ABIX.goldLight }} />
        <p className="mt-3 font-display text-2xl" style={{ color: ABIX.ivory }}>
          The first words are yet to be written.
        </p>
        <p className="mt-2 text-sm" style={{ color: ABIX.ivory45 }}>
          Customer reviews will appear here once they have been approved.
        </p>
        <Link
          to="/shop"
          className="mt-4 inline-block text-sm underline underline-offset-4"
          style={{ color: ABIX.goldLight }}
        >
          Explore the collection
        </Link>
      </div>
    );
  } else {
    body = (
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        {/* spotlight */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            <motion.figure
              key={active.id}
              initial={{ opacity: 0, y: reduce ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -12 }}
              transition={{ duration: reduce ? 0.15 : 0.5, ease: EASE }}
            >
              <StarDisplay value={active.rating} size={18} />
              <blockquote
                className="mt-6 font-display text-2xl sm:text-3xl lg:text-[2.1rem] leading-snug whitespace-pre-line"
                style={{ color: ABIX.ivory, ...clamp(8) }}
              >
                {active.text}
              </blockquote>
              <figcaption className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-5" style={{ borderColor: ABIX.ivory12 }}>
                <span className="font-display text-lg" style={{ color: ABIX.ivory }}>{active.displayName}</span>
                {formatReviewDate(active) && (
                  <span className="label-meta" style={{ color: ABIX.ivory45 }}>{formatReviewDate(active)}</span>
                )}
                {activeProduct && (
                  <Link
                    to={`/shop/${activeProduct.slug}#reviews`}
                    className="text-[11px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline"
                    style={{ color: ABIX.goldLight }}
                  >
                    {activeProduct.name} →
                  </Link>
                )}
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </div>

        {/* selection rail */}
        {selection.length > 1 && (
          <ul className="lg:col-span-5 space-y-3">
            {selection.map((r) => {
              const product = productByReview.get(r.id);
              const on = r.id === active.id;
              return (
                <li key={r.id} className="list-none">
                  <button
                    type="button"
                    onClick={() => setActiveId(r.id)}
                    aria-current={on ? 'true' : undefined}
                    className="w-full text-left rounded-xl border p-4 transition-colors duration-300"
                    style={{
                      borderColor: on ? ABIX.gold : ABIX.border25,
                      background: on ? ABIX.gold15 : 'transparent',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <StarDisplay value={r.rating} size={12} />
                      {product && (
                        <span className="text-[10px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.goldLight }}>
                          {product.name}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: ABIX.ivory70, ...clamp(2) }}>
                      {r.text}
                    </p>
                    <p className="mt-2 text-xs" style={{ color: ABIX.ivory45 }}>{r.displayName}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <section
      id="reviews"
      className={`relative overflow-hidden grain ${isEmpty ? 'py-14 lg:py-20' : 'py-20 lg:py-28'}`}
      style={{ background: ABIX.obsidian }}
    >
      {/* oversized decorative quotation mark */}
      <motion.div
        aria-hidden="true"
        className="absolute -top-4 left-4 lg:left-16 font-display select-none pointer-events-none leading-none"
        style={{ fontSize: 'clamp(9rem, 20vw, 18rem)', color: ABIX.gold15 }}
        initial={{ opacity: 0, y: reduce ? 0 : 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.2 : 1.2, ease: EASE }}
      >
        “
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="max-w-xl">
            <Eyebrow light>Reviews</Eyebrow>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
              Voices from the ritual.
            </h2>
            <p className="mt-5 text-sm sm:text-base max-w-md" style={{ color: ABIX.ivory70 }}>
              Honest words from people who bring ABIXMART into their day.
            </p>
          </div>

          {!busy && !error && stats.count > 0 && (
            <div className="flex items-center gap-4">
              <span className="font-display text-5xl leading-none" style={{ color: ABIX.ivory }}>
                {stats.average.toFixed(1)}
              </span>
              <div>
                <StarDisplay value={stats.average} size={17} />
                <p className="mt-1 text-xs" style={{ color: ABIX.ivory45 }}>
                  from {stats.count} approved {stats.count === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>
          )}
        </div>

        {body}
      </div>
    </section>
  );
}