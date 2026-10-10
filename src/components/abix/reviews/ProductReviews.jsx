// src/components/abix/reviews/ProductReviews.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { PenLine, Quote, X } from 'lucide-react';
import Eyebrow from '@/components/abix/Eyebrow';
import { ABIX } from '@/components/abix/brandColors';
import { useAuth } from '@/lib/AuthContext';
import { useApprovedReviews, useMyReview } from '@/lib/useReviews';
import { useFeaturedReviews } from '@/lib/useFeaturedReviews';
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
const ERROR_COLOR = '#C98473';

// Cards shown around the jar (left / right alternating). The rest sit behind
// "View all reviews".
const CARD_CAPACITY = 4;

const STATUS_COPY = {
  [REVIEW_STATUS.PENDING]: { label: 'Awaiting approval', note: 'Only you can see this until it has been approved.', color: AMBER },
  [REVIEW_STATUS.APPROVED]: { label: 'Published', note: 'Your review is live on this page.', color: '#8FB28A' },
  [REVIEW_STATUS.REJECTED]: { label: 'Not published', note: 'This review did not meet our review guidelines.', color: ERROR_COLOR },
  [REVIEW_STATUS.HIDDEN]: { label: 'Hidden', note: 'This review has been hidden by ABIXMART.', color: MUTED },
};

const primaryButton =
  'inline-flex items-center justify-center gap-2 h-12 px-7 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full transition-opacity duration-300 hover:opacity-90 disabled:opacity-60';

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
      await submitReview({ productId: product.id, user, profile, rating, text: trimmed, existing });
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
    <form onSubmit={handleSubmit} noValidate>
      {existing && (
        <p className="mb-4 text-xs" style={{ color: MUTED }}>
          Saving changes sends your review back for approval.
        </p>
      )}

      <div>
        <span className="label-meta" style={{ color: MUTED }}>Your rating</span>
        <div className="mt-2">
          <StarInput value={rating} onChange={setRating} disabled={submitting} />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="review-text" className="label-meta" style={{ color: MUTED }}>Your review</label>
        <textarea
          id="review-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, REVIEW_TEXT_MAX))}
          disabled={submitting}
          rows={5}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'review-error' : 'review-hint'}
          placeholder="Share your honest experience with this product."
          className="mt-2 w-full rounded-lg border bg-transparent p-3 text-[15px] leading-relaxed outline-none focus:border-[#B49A62]"
          style={{ borderColor: ABIX.ivory25, color: IVORY }}
        />
        <div id="review-hint" className="mt-1 flex justify-between text-[11px]" style={{ color: MUTED }}>
          <span>At least {REVIEW_TEXT_MIN} characters.</span>
          <span>{text.length}/{REVIEW_TEXT_MAX}</span>
        </div>
      </div>

      {error && (
        <p id="review-error" role="alert" className="mt-3 text-sm" style={{ color: ERROR_COLOR }}>
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={submitting} className={primaryButton} style={{ background: AMBER_FILL, color: INK }}>
          {submitting ? 'Submitting…' : existing ? 'Save changes' : 'Submit review'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={submitting} className="text-sm underline underline-offset-4" style={{ color: MUTED }}>
            Cancel
          </button>
        )}
      </div>
      <p className="mt-4 text-[11px] leading-relaxed" style={{ color: MUTED }}>
        Reviews are checked before they appear. Your name is shown as first name and last initial.
      </p>
    </form>
  );
}

function MyReviewBody({ review, justSubmitted, onEdit }) {
  const copy = STATUS_COPY[review.status] || STATUS_COPY[REVIEW_STATUS.PENDING];
  const canEdit = review.status === REVIEW_STATUS.PENDING || review.status === REVIEW_STATUS.APPROVED;

  return (
    <div>
      {justSubmitted && (
        <p role="status" className="mb-4 text-sm leading-relaxed" style={{ color: '#8FB28A' }}>
          Thank you. Your review has been submitted and is awaiting approval. It will appear on this page once it has been approved.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StarDisplay value={review.rating} size={16} />
        <span className="label-meta px-2.5 py-1 rounded-full border" style={{ color: copy.color, borderColor: copy.color }}>
          {copy.label}
        </span>
      </div>
      <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line" style={{ color: ABIX.ivory70 }}>{review.text}</p>
      <p className="mt-3 text-xs" style={{ color: MUTED }}>{copy.note}</p>
      {canEdit && (
        <button type="button" onClick={onEdit} className="mt-5 inline-flex items-center gap-2 text-sm underline underline-offset-4" style={{ color: AMBER }}>
          <PenLine size={14} /> Edit review
        </button>
      )}
    </div>
  );
}

function ReviewSkeletons() {
  return (
    <ul className="mt-10 grid gap-5 md:grid-cols-2" aria-label="Loading reviews">
      {[0, 1].map((i) => (
        <li key={i} className="list-none h-32 rounded-2xl animate-pulse" style={{ background: ABIX.darkMoss, border: `1px solid ${ABIX.border15}` }} />
      ))}
    </ul>
  );
}

export default function ProductReviews({ product }) {
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const { reviews, loading, error, stats } = useApprovedReviews(product.id);
  const mine = useMyReview(product.id, user?.uid);
  const featured = useFeaturedReviews(reviews, { limit: CARD_CAPACITY, scope: `product:${product.id}` });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const autoOpened = useRef(false);

  const jarSrc = REVIEW_JAR_IMAGES[product.slug] || product.shopImage || null;

  // Where to come back to after signing in.
  const returnTo = `${location.pathname}?review=1#reviews`;
  const loginTo = `/login?redirect=${encodeURIComponent(returnTo)}`;
  const createTo = `/create-account?redirect=${encodeURIComponent(returnTo)}`;

  // Returning from sign-in with ?review=1: open the form once.
  useEffect(() => {
    if (autoOpened.current || authLoading || !user) return;
    if (new URLSearchParams(location.search).get('review') !== '1') return;
    autoOpened.current = true;
    setOpen(true);
    window.history.replaceState(window.history.state, '', `${location.pathname}#reviews`);
  }, [authLoading, user, location.pathname, location.search]);

  const openDialog = () => {
    setEditing(false);
    setJustSubmitted(false);
    setOpen(true);
  };

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) {
      setEditing(false);
      setJustSubmitted(false);
    }
  };

  const handleDone = async () => {
    setEditing(false);
    setJustSubmitted(true);
    await mine.reload();
  };

  // ── dialog content ────────────────────────────────────────────────
  let dialogTitle = 'Write a review';
  let dialogBody;
  if (authLoading || (user && mine.loading)) {
    dialogTitle = 'Reviews';
    dialogBody = <p className="text-sm" style={{ color: MUTED }}>Loading…</p>;
  } else if (!user) {
    dialogTitle = 'Share your experience';
    dialogBody = (
      <div>
        <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
          Sign in to rate and review {product.name}. You will come straight back to this page.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link to={loginTo} state={{ from: returnTo }} className={primaryButton} style={{ background: AMBER_FILL, color: INK }}>
            Sign in
          </Link>
          <Link to={createTo} state={{ from: returnTo }} className="text-sm underline underline-offset-4" style={{ color: MUTED }}>
            Create an account
          </Link>
        </div>
      </div>
    );
  } else if (mine.error) {
    dialogTitle = 'Reviews';
    dialogBody = (
      <div>
        <p role="alert" className="text-sm leading-relaxed" style={{ color: ERROR_COLOR }}>
          We could not check your existing review right now. Please try again.
        </p>
        <button type="button" onClick={() => mine.reload()} className={`${primaryButton} mt-4`} style={{ background: AMBER_FILL, color: INK }}>
          Try again
        </button>
      </div>
    );
  } else if (mine.review && !editing) {
    dialogTitle = 'Your review';
    dialogBody = (
      <MyReviewBody
        review={mine.review}
        justSubmitted={justSubmitted}
        onEdit={() => { setJustSubmitted(false); setEditing(true); }}
      />
    );
  } else {
    dialogTitle = mine.review ? 'Edit your review' : `Review ${product.name}`;
    dialogBody = (
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

  // ── page layout ───────────────────────────────────────────────────
  const writeButton = (
    <button type="button" onClick={openDialog} className={primaryButton} style={{ background: AMBER_FILL, color: INK }}>
      <PenLine size={15} />
      {user && mine.review ? 'Your review' : 'Write a Review'}
    </button>
  );

  const showCards = !loading && !error && featured.length > 0;
  const isEmpty = !loading && !error && reviews.length === 0;
  const left = featured.filter((_, i) => i % 2 === 0);
  const right = featured.filter((_, i) => i % 2 === 1);
  const hasMore = !loading && !error && reviews.length > featured.length;
  const myCopy = mine.review ? STATUS_COPY[mine.review.status] || STATUS_COPY[REVIEW_STATUS.PENDING] : null;

  return (
    <section id="reviews" className="relative py-16 lg:py-24 border-t overflow-hidden" style={{ background: INK, borderColor: `${IVORY}0D` }}>
      <div className="absolute inset-0 grain opacity-[0.04] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-10 lg:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow light>Customer Reviews</Eyebrow>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight" style={{ color: IVORY }}>
              In their words.
            </h2>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-4">
            {!loading && !error && stats.count > 0 && (
              <div className="flex items-center gap-4">
                <span className="font-display text-5xl leading-none" style={{ color: IVORY }}>
                  {stats.average.toFixed(1)}
                </span>
                <div>
                  <StarDisplay value={stats.average} size={17} />
                  <p className="mt-1 text-xs" style={{ color: MUTED }}>
                    {stats.count} {stats.count === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>
            )}
            {writeButton}
          </div>
        </div>

        {/* jar centrepiece, review cards left and right */}
        <div className={showCards ? 'grid items-center gap-8 lg:grid-cols-[1fr_minmax(250px,330px)_1fr] lg:gap-10' : 'flex flex-col items-center'}>
          {showCards && left.length > 0 && (
            <ul className="order-2 lg:order-none lg:col-start-1 lg:row-start-1 space-y-5 lg:pt-2">
              {left.map((r, i) => (
                <ReviewCard key={r.id} review={r} delayIndex={i} clampLines />
              ))}
            </ul>
          )}

          {jarSrc && (
            <div className="order-1 lg:order-none lg:col-start-2 lg:row-start-1 w-full">
              <FloatingJar src={jarSrc} alt={`${product.name} jar`} />
            </div>
          )}

          {showCards && right.length > 0 && (
            <ul className="order-3 lg:order-none lg:col-start-3 lg:row-start-1 space-y-5 lg:pt-20">
              {right.map((r, i) => (
                <ReviewCard key={r.id} review={r} delayIndex={i + 1} clampLines />
              ))}
            </ul>
          )}
        </div>

        {loading && <ReviewSkeletons />}

        {error && (
          <p role="alert" className="mt-10 text-center text-sm" style={{ color: ERROR_COLOR }}>
            Reviews could not be loaded right now. Please try again in a moment.
          </p>
        )}

        {isEmpty && (
          <div className="mx-auto mt-8 max-w-md text-center">
            <Quote size={26} className="mx-auto" style={{ color: AMBER }} />
            <p className="mt-3 font-display text-2xl" style={{ color: IVORY }}>No reviews yet.</p>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: MUTED }}>
              Be the first to share what {product.name} is like.
            </p>
            <div className="mt-5">{writeButton}</div>
          </div>
        )}

        {hasMore && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              className="text-sm underline underline-offset-4"
              style={{ color: AMBER }}
            >
              {showAll ? 'Show fewer reviews' : `View all ${reviews.length} reviews`}
            </button>
          </div>
        )}

        {showAll && hasMore && (
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {reviews.map((r, i) => (
              <ReviewCard key={r.id} review={r} delayIndex={i % 2} />
            ))}
          </ul>
        )}

        {user && !mine.loading && !mine.error && mine.review && myCopy && (
          <div
            className="mx-auto mt-12 flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-full border px-5 py-3"
            style={{ borderColor: ABIX.border25, background: ABIX.darkMoss }}
          >
            <span className="label-meta" style={{ color: MUTED }}>Your review</span>
            <span className="label-meta px-2.5 py-1 rounded-full border" style={{ color: myCopy.color, borderColor: myCopy.color }}>
              {myCopy.label}
            </span>
            <button type="button" onClick={openDialog} className="text-sm underline underline-offset-4" style={{ color: AMBER }}>
              View
            </button>
          </div>
        )}
      </div>

      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-[101] max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border p-6 sm:p-8"
            style={{ background: ABIX.darkMoss, borderColor: ABIX.border }}
          >
            <Dialog.Title className="pr-8 font-display text-2xl" style={{ color: IVORY }}>
              {dialogTitle}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Write, check or edit your review of {product.name}.
            </Dialog.Description>
            <Dialog.Close
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full"
              style={{ color: MUTED }}
            >
              <X size={18} />
            </Dialog.Close>
            <div className="mt-5">{dialogBody}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}