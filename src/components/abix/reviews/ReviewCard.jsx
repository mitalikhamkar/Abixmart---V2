// src/components/abix/reviews/ReviewCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ABIX } from '@/components/abix/brandColors';
import { formatReviewDate } from '@/lib/reviewUtils';
import { StarDisplay } from './StarRating';
  
// One approved review. Reveals on scroll; `delayIndex` staggers neighbours so
// cards arrive one after another instead of all at once.
//
// productName / productHref are optional: the homepage passes them so every
// review names (and links to) its product; the product page does not.
export default function ReviewCard({ review, productName, productHref, delayIndex = 0, clampLines = false, className = '' }) {
  const reduce = useReducedMotion();

  const variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 30, scale: reduce ? 1 : 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: reduce ? 0.2 : 0.75,
        delay: reduce ? 0 : delayIndex * 0.1,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const date = formatReviewDate(review);

  return (
    <motion.li
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={`relative list-none p-6 rounded-2xl border ${className}`}
      style={{
        background: `linear-gradient(160deg, ${ABIX.elevated} 0%, ${ABIX.darkMoss} 100%)`,
        borderColor: ABIX.border25,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <StarDisplay value={review.rating} size={15} />
        {date && (
          <span className="label-meta" style={{ color: ABIX.ivory45 }}>
            {date}
          </span>
        )}
      </div>

      <p
        className="mt-4 text-[15px] leading-relaxed whitespace-pre-line"
        style={{
          color: ABIX.ivory70,
          ...(clampLines
            ? { display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
            : {}),
        }}
      >
        {review.text}
      </p>

      <div className="mt-5 pt-4 border-t flex flex-wrap items-center justify-between gap-x-4 gap-y-1" style={{ borderColor: ABIX.ivory12 }}>
        <span className="font-display text-base" style={{ color: ABIX.ivory }}>
          {review.displayName}
        </span>
        {productName && (
          productHref ? (
            <Link
              to={productHref}
              className="text-[11px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline"
              style={{ color: ABIX.goldLight }}
            >
              {productName}
            </Link>
          ) : (
            <span className="text-[11px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.goldLight }}>
              {productName}
            </span>
          )
        )}
      </div>
    </motion.li>
  );
}