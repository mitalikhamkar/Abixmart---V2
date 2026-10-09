// src/lib/reviewService.js
//
// The single data source for product reviews. The product page, the
// homepage section and the customer's own "your review" panel all read and
// write through this file, so they can never disagree.
//
// Collections (see reviewUtils.js and firestore.rules):
//   reviews/{autoId}                public content, no uid
//   reviewOwners/{uid}_{productId}  private ownership record
//   reviewModeration/{reviewId}     private admin audit (admin screen only)

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  REVIEWS_COLLECTION,
  REVIEW_OWNERS_COLLECTION,
  REVIEW_STATUS,
  formatReviewerName,
  isRenderableReview,
  normalizeReview,
  ownerKey,
  sortNewestFirst,
} from '@/lib/reviewUtils';

// Live list of APPROVED reviews. Pass a productId for one product, or null
// for every product (homepage). The status filter is REQUIRED by the
// Firestore rules, which only let the public list approved reviews.
//
// Sorting happens in the browser so no composite index is needed.
export function subscribeApprovedReviews(productId, onData, onError) {
  const constraints = [where('status', '==', REVIEW_STATUS.APPROVED)];
  if (productId) constraints.push(where('productId', '==', productId));

  const q = query(collection(db, REVIEWS_COLLECTION), ...constraints);

  return onSnapshot(
    q,
    (snap) => {
      const reviews = snap.docs
        .map((d) => normalizeReview(d.id, d.data()))
        .filter((r) => r.status === REVIEW_STATUS.APPROVED && isRenderableReview(r));
      onData(sortNewestFirst(reviews));
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Could not read reviews:', err?.code, err?.message);
      onError(err);
    }
  );
}

// The signed-in customer's own review of one product (any status), or null.
// Path: private owner record -> review id -> review. The customer never
// needs a public uid to find their own review.
export async function getMyReview(productId, uid) {
  const ownerRef = doc(db, REVIEW_OWNERS_COLLECTION, ownerKey(uid, productId));
  const ownerSnap = await getDoc(ownerRef);
  if (!ownerSnap.exists()) return null;

  const reviewId = ownerSnap.data().reviewId;
  const reviewSnap = await getDoc(doc(db, REVIEWS_COLLECTION, reviewId));

  if (!reviewSnap.exists()) {
    // The review was removed (for example deleted by an admin). Clear the
    // stale owner record so the customer can review this product again.
    // The rules only allow this when the review really is gone.
    try {
      await deleteDoc(ownerRef);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[ABIXMART] Could not clear a stale review owner record:', err?.code);
    }
    return null;
  }

  return normalizeReview(reviewSnap.id, reviewSnap.data());
}

// Creates a review, or edits the customer's existing one (`existing` is the
// review returned by getMyReview). Either way the review goes (back) to
// `pending`: customers can never set their own status, and the Firestore
// rules reject any attempt to.
export async function submitReview({ productId, user, profile, rating, text, existing }) {
  const displayName = formatReviewerName(profile, user);

  if (existing) {
    await updateDoc(doc(db, REVIEWS_COLLECTION, existing.id), {
      rating,
      text,
      displayName,
      status: REVIEW_STATUS.PENDING,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  // New review: the public review and the private owner record are written
  // in ONE atomic batch. The rules check each against the other.
  const reviewRef = doc(collection(db, REVIEWS_COLLECTION));
  const ownerRef = doc(db, REVIEW_OWNERS_COLLECTION, ownerKey(user.uid, productId));

  const batch = writeBatch(db);
  batch.set(reviewRef, {
    productId,
    displayName,
    rating,
    text,
    status: REVIEW_STATUS.PENDING,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(ownerRef, {
    uid: user.uid,
    productId,
    reviewId: reviewRef.id,
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}

export function describeReviewError(err) {
  if (err?.code === 'permission-denied') {
    return 'We could not save your review. This product may not be open for reviews, or you may already have reviewed it. Please refresh and try again.';
  }
  if (err?.code === 'unavailable' || err?.code === 'deadline-exceeded') {
    return 'You seem to be offline. Please check your connection and try again.';
  }
  return 'Something went wrong while saving your review. Please try again.';
}