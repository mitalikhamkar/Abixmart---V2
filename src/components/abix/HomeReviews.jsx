// src/components/abix/HomeReviews.jsx
import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Quote } from 'lucide-react';
import Eyebrow from '@/components/abix/Eyebrow';
import ReviewCard from '@/components/abix/reviews/ReviewCard';
import { StarDisplay } from '@/components/abix/reviews/StarRating';
import { useCatalog } from '@/lib/CatalogContext';
import { useApprovedReviews } from '@/lib/useReviews';
import { computeReviewStats } from '@/lib/reviewUtils';
import { ABIX } from './brandColors';

const MAX_CARDS = 6;

// Homepage reviews: approved reviews from every product, read from the same
// Firestore data (and the same hook) as the product pages. A review is shown
// only when its product can be resolved in the catalog, so every card can
// name its product honestly.
export default function HomeReviews() {
  const reduce = useReducedMotion();
  const { reviews, loading, error } = useApprovedReviews(null);
  const { getProductById, loading: catalogLoading } = useCatalog();

  const resolved = useMemo(
    () =>
      reviews
        .map((review) => ({ review, product: getProductById(review.productId) }))
        .filter((x) => x.product),
    [reviews, getProductById]
  );

  const stats = useMemo(() => computeReviewStats(resolved.map((x) => x.review)), [resolved]);
  const visible = resolved.slice(0, MAX_CARDS);
  const busy = loading || catalogLoading;

  let body;
  if (busy) {
    body = (
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" aria-label="Loading reviews">
        {[0, 1, 2].map((i) => (
          <li key={i} className="list-none h-56 rounded-2xl animate-pulse" style={{ background: ABIX.darkMoss, border: `1px solid ${ABIX.border15}` }} />
        ))}
      </ul>
    );
  } else if (error) {
    body = (
      <p className="text-sm" role="alert" style={{ color: ABIX.ivory45 }}>
        Reviews are unavailable right now. Please check back soon.
      </p>
    );
  } else if (visible.length === 0) {
    body = (
      <div className="text-center py-14 px-6 rounded-2xl border border-dashed max-w-2xl mx-auto" style={{ borderColor: ABIX.border }}>
        <Quote size={30} className="mx-auto" style={{ color: ABIX.goldLight }} />
        <p className="mt-4 font-display text-2xl" style={{ color: ABIX.ivory }}>
          The first words are yet to be written.
        </p>
        <p className="mt-2 text-sm" style={{ color: ABIX.ivory45 }}>
          Customer reviews will appear here once they have been approved.
        </p>
      </div>
    );
  } else {
    body = (
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {visible.map(({ review, product }, i) => (
          <ReviewCard
            key={review.id}
            review={review}
            productName={product.name}
            productHref={`/shop/${product.slug}#reviews`}
            delayIndex={i % 3}
            clampLines
            className="lg:[&:nth-child(3n+2)]:mt-10"
          />
        ))}
      </ul>
    );
  }

  return (
    <section
      id="reviews"
      className="relative py-24 lg:py-32 overflow-hidden grain"
      style={{ background: ABIX.obsidian }}
    >
      {/* oversized decorative quotation mark */}
      <motion.div
        aria-hidden="true"
        className="absolute -top-6 left-4 lg:left-16 font-display select-none pointer-events-none leading-none"
        style={{ fontSize: 'clamp(12rem, 28vw, 26rem)', color: ABIX.gold15 }}
        initial={{ opacity: 0, y: reduce ? 0 : 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: reduce ? 0.2 : 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        “
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-12 lg:mb-16 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
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