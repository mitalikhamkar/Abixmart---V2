// src/lib/reviewUtils.js
//
// Pure helpers for product reviews (no Firebase imports, so they are easy to
// test). Everything the customer site and the Admin Panel need to agree on
// lives here: collection names, statuses, limits, name formatting, the
// admin transition table, and the rating statistics.
//
// DATA MODEL (revision 2)
//   reviews/{autoId}              public content, NO uid
//                                 admin-only field: featured (boolean)
//   reviewOwners/{uid}_{productId}  private: { uid, productId, reviewId }
//   reviewModeration/{reviewId}     private admin audit

export const REVIEWS_COLLECTION = 'reviews';
export const REVIEW_OWNERS_COLLECTION = 'reviewOwners';
export const REVIEW_MODERATION_COLLECTION = 'reviewModeration';

export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  HIDDEN: 'hidden',
};

// These limits are enforced again by firestore.rules. Keep them in sync.
export const REVIEW_TEXT_MIN = 10;
export const REVIEW_TEXT_MAX = 1000;

// Private ownership record id: one review per customer per product.
export function ownerKey(uid, productId) {
  return `${uid}_${productId}`;
}

// Admin status changes allowed by firestore.rules. 'pending' is never an
// admin target: only a customer edit sends a review back to pending.
export const ADMIN_TRANSITIONS = {
  pending: ['approved', 'rejected', 'hidden'],
  approved: ['rejected', 'hidden'],
  rejected: ['approved', 'hidden'],
  hidden: ['approved', 'rejected'],
};

export function canAdminTransition(from, to) {
  return (ADMIN_TRANSITIONS[from] || []).includes(to);
}

// Public display name. Only the first name and the initial of the last name
// are ever stored on a review ("Mitali K."), because review documents are
// publicly readable. The full name stays in the private users/{uid} doc.
export function formatReviewerName(profile, user) {
  const raw = String(profile?.fullName || user?.displayName || '').trim().replace(/\s+/g, ' ');
  if (!raw) return 'ABIXMART customer';
  const parts = raw.split(' ');
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  const name = last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
  return name.slice(0, 60);
}

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  return 0;
}

// Firestore document ({ id, ...data }) -> the shape the UI uses. There is
// deliberately no uid here: review documents do not contain one.
export function normalizeReview(id, data = {}) {
  return {
    id,
    productId: data.productId || '',
    displayName: data.displayName || 'ABIXMART customer',
    rating: Number(data.rating),
    text: typeof data.text === 'string' ? data.text : '',
    status: data.status || REVIEW_STATUS.PENDING,
    // Set only by admins. Featured reviews are preferred when the site
    // picks which approved reviews to show.
    featured: data.featured === true,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
    moderatedAt: data.moderatedAt || null,
    createdAtMs: toMillis(data.createdAt),
  };
}

export function isRenderableReview(review) {
  return (
    Number.isInteger(review.rating) &&
    review.rating >= 1 &&
    review.rating <= 5 &&
    review.text.trim().length > 0
  );
}

export function sortNewestFirst(reviews) {
  return [...reviews].sort((a, b) => b.createdAtMs - a.createdAtMs);
}

// Average, count and distribution, all derived from the reviews passed in.
// Nothing is stored or hard-coded: callers pass APPROVED reviews only.
export function computeReviewStats(reviews) {
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let count = 0;
  reviews.forEach((r) => {
    if (Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating] += 1;
      sum += r.rating;
      count += 1;
    }
  });
  return {
    count,
    average: count ? sum / count : 0,
    distribution,
  };
}

export function formatReviewDate(review) {
  if (!review.createdAtMs) return '';
  return new Date(review.createdAtMs).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}