// src/components/abix/reviews/ProductReviews.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageSquareText, PenLine } from 'lucide-react';
import Eyebrow from '@/components/abix/Eyebrow';
import { ABIX } from '@/components/abix/brandColors';
import { useAuth } from '@/lib/AuthContext';
import { useApprovedReviews, useMyReview } from '@/lib/useReviews';
import { describeReviewError, submitReview } from '@/lib/reviewService';
import { REVIEW_STATUS, REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from '@/lib/reviewUtils';
import { StarDisplay, StarInput } from './StarRating';
import ReviewCard from './ReviewCard';
import FloatingJar from './FloatingJar';
import { REVIEW_JAR_IMAGES } from './reviewAssets';

const INK = ABIX.obsidian;
const IVORY = ABIX.ivory;
const MUTED = ABIX.ivory45;
const AMBER = ABIX.goldLight;
const AMBER_FILL = ABIX.gold;

const STATUS_COPY = {
  [REVIEW_STATUS.PENDING]: { label: 'Awaiting approval', note: 'Only you can see this until it has been approved.', color: AMBER },
  [REVIEW_STATUS.APPROVED]: { label: 'Published', note: 'Your review is live on this page.', color: '#8FB28A' },
  [REVIEW_STATUS.REJECTED]: { label: 'Not published', note: 'This review did not meet our review guidelines.', color: '#C98473' },
  [REVIEW_STATUS.HIDDEN]: { label: 'Hidden', note: 'This review has been hidden by ABIXMART.', color: MUTED },
};

const primaryButton = 'inline-flex items-center justify-center gap-2 h-12 px-7 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full transition-opacity duration-300 disabled:opacity-60';

function Panel({ children }) {
  return (
    <div className="p-6 rounded-2xl border" style={{ background: ABIX.darkMoss, borderColor: ABIX.border25 }}>
      {children}
    </div>
  );
}

function RatingSummary({ stats, reduce }) {
  if (stats.count === 0) {
    return (
      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
        No ratings yet. The average and breakdown will appear here once reviews are approved.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-4">
        <span className="font-display text-6xl leading-none" style={{ color: IVORY }}>
          {stats.average.toFixed(1)}
        </span>
        <div className="pb-1">
          <StarDisplay value={stats.average} size={18} />
          <p className="mt-1 text-xs" style={{ color: MUTED }}>
            {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2" aria-label="Rating breakdown">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = stats.distribution[n];
          const pct = (count / stats.count) * 100;
          return (
            <li key={n} className="flex items-center gap-3 text-xs" style={{ color: MUTED }}>
              <span className="w-6 shrink-0">{n} ★</span>
              <span className="relative h-1.5 flex-1 rounded-full overflow-hidden" style={{ background: ABIX.ivory12 }}>
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: AMBER_FILL }}
                  initial={{ width: reduce ? `${pct}%` : 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
                />
              </span>
              <span className="w-6 shrink-0 text-right">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ReviewForm({ product, user, profile, existing, onDone, onCancel }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [text, setText] = useState(existing?.text || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (rating < 1) {
      setError('Please choose a star rating.');
      return;
    }
    if (trimmed.length < REVIEW_TEXT_MIN) {
      setError(`Please write at least ${REVIEW_TEXT_MIN} characters.`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await submitReview({ productId: product.id, user, profile, rating, text: trimmed, isUpdate: Boolean(existing) });
      await onDone();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Review submit failed:', err?.code, err?.message);
      setError(describeReviewError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel>
      <form onSubmit={handleSubmit} noValidate>
        <h3 className="font-display text-2xl" style={{ color: IVORY }}>
          {existing ? 'Edit your review' : `Review ${product.name}`}
        </h3>
        {existing && (
          <p className="mt-1 text-xs" style={{ color: MUTED }}>
            Saving changes sends your review back for approval.
          </p>
        )}

        <div className="mt-4">
          <StarInput value={rating} onChange={setRating} disabled={submitting} />
        </div>

        <label className="block mt-4">
          <span className="label-meta" style={{ color: MUTED }}>Your review</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, REVIEW_TEXT_MAX))}
            disabled={submitting}
            rows={5}
            placeholder="Share your honest experience with this product."
            className="mt-2 w-full rounded-lg border bg-transparent p-3 text-[15px] leading-relaxed outline-none focus:border-[#B49A62]"
            style={{ borderColor: ABIX.ivory25, color: IVORY }}
          />
          <span className="mt-1 block text-right text-[11px]" style={{ color: MUTED }}>
            {text.length}/{REVIEW_TEXT_MAX}
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-2 text-sm" style={{ color: '#C98473' }}>
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={submitting} className={primaryButton} style={{ background: AMBER_FILL, color: INK }}>
            {submitting ? 'Submitting…' : existing ? 'Save changes' : 'Submit review'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} disabled={submitting} className="text-sm underline underline-offset-4" style={{ color: MUTED }}>
              Cancel
            </button>
          )}
        </div>
        <p className="mt-3 text-[11px]" style={{ color: MUTED }}>
          Reviews are checked before they appear. Your name is shown as first name and last initial.
        </p>
      </form>
    </Panel>
  );
}

function MyReviewPanel({ review, justSubmitted, onEdit }) {
  const copy = STATUS_COPY[review.status] || STATUS_COPY[REVIEW_STATUS.PENDING];
  const canEdit = review.status === REVIEW_STATUS.PENDING || review.status === REVIEW_STATUS.APPROVED;

  return (
    <Panel>
      {justSubmitted && (
        <p role="status" className="mb-4 text-sm" style={{ color: '#8FB28A' }}>
          Thank you. Your review has been submitted and will appear here once it is approved.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-2xl" style={{ color: IVORY }}>Your review</h3>
        <span className="label-meta px-2.5 py-1 rounded-full border" style={{ color: copy.color, borderColor: copy.color }}>
          {copy.label}
        </span>
      </div>
      <div className="mt-3"><StarDisplay value={review.rating} size={16} /></div>
      <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line" style={{ color: ABIX.ivory70 }}>{review.text}</p>
      <p className="mt-3 text-xs" style={{ color: MUTED }}>{copy.note}</p>
      {canEdit && (
        <button type="button" onClick={onEdit} className="mt-4 inline-flex items-center gap-2 text-sm underline underline-offset-4" style={{ color: AMBER }}>
          <PenLine size={14} /> Edit review
        </button>
      )}
    </Panel>
  );
}

function ReviewSkeletons() {
  return (
    <ul className="space-y-4" aria-label="Loading reviews">
      {[0, 1, 2].map((i) => (
        <li key={i} className="list-none h-32 rounded-2xl animate-pulse" style={{ background: ABIX.darkMoss, border: `1px solid ${ABIX.border15}` }} />
      ))}
    </ul>
  );
}

export default function ProductReviews({ product }) {
  const reduce = useReducedMotion();
  const { user, profile, loading: authLoading } = useAuth();
  const { reviews, loading, error, stats } = useApprovedReviews(product.id);
  const mine = useMyReview(product.id, user?.uid);

  const [editing, setEditing] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const jarSrc = REVIEW_JAR_IMAGES[product.slug] || null;

  const handleDone = async () => {
    setEditing(false);
    setJustSubmitted(true);
    await mine.reload();
  };

  let formArea;
  if (authLoading || (user && mine.loading)) {
    formArea = <Panel><p className="text-sm" style={{ color: MUTED }}>Loading…</p></Panel>;
  } else if (!user) {
    formArea = (
      <Panel>
        <h3 className="font-display text-2xl" style={{ color: IVORY }}>Share your experience</h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
          Sign in to rate and review {product.name}.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link to="/login" className={primaryButton} style={{ background: AMBER_FILL, color: INK }}>Sign in</Link>
          <Link to="/create-account" className="text-sm underline underline-offset-4" style={{ color: MUTED }}>Create an account</Link>
        </div>
      </Panel>
    );
  } else if (mine.error) {
    formArea = (
      <Panel>
        <p role="alert" className="text-sm" style={{ color: '#C98473' }}>
          We could not check your existing review right now. Please refresh the page and try again.
        </p>
      </Panel>
    );
  } else if (mine.review && !editing) {
    formArea = <MyReviewPanel review={mine.review} justSubmitted={justSubmitted} onEdit={() => { setJustSubmitted(false); setEditing(true); }} />;
  } else {
    formArea = (
      <ReviewForm
        product={product}
        user={user}
        profile={profile}
        existing={mine.review}
        onDone={handleDone}
        onCancel={mine.review ? () => setEditing(false) : null}
      />
    );
  }

  return (
    <section id="reviews" className="relative py-16 lg:py-24 border-t overflow-hidden" style={{ background: INK, borderColor: `${IVORY}0D` }}>
      <div className="absolute inset-0 grain opacity-[0.04] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-2xl mb-10 lg:mb-14">
          <Eyebrow light>Customer Reviews</Eyebrow>
          <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: IVORY }}>
            In their words.
          </h2>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            {jarSrc && <FloatingJar src={jarSrc} alt={`${product.name} jar`} />}
            <div className={jarSrc ? 'mt-8' : ''}>
              {loading ? (
                <p className="text-sm" style={{ color: MUTED }}>Loading ratings…</p>
              ) : error ? null : (
                <RatingSummary stats={stats} reduce={reduce} />
              )}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {formArea}

            {loading ? (
              <ReviewSkeletons />
            ) : error ? (
              <Panel>
                <p role="alert" className="text-sm" style={{ color: '#C98473' }}>
                  Reviews could not be loaded right now. Please try again in a moment.
                </p>
              </Panel>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 px-6 rounded-2xl border border-dashed" style={{ borderColor: ABIX.border }}>
                <MessageSquareText size={28} className="mx-auto" style={{ color: AMBER }} />
                <p className="mt-4 font-display text-2xl" style={{ color: IVORY }}>No reviews yet.</p>
                <p className="mt-2 text-sm" style={{ color: MUTED }}>
                  Be the first to share what {product.name} is like.
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r, i) => (
                  <ReviewCard key={r.id} review={r} delayIndex={i % 4} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}