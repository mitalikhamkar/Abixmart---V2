// src/lib/useReviews.js
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMyReview, subscribeApprovedReviews } from '@/lib/reviewService';
import { computeReviewStats } from '@/lib/reviewUtils';

// Approved reviews plus the statistics computed from them. Used by both the
// product page (pass a productId) and the homepage (pass null for all).
export function useApprovedReviews(productId = null) {
  const [state, setState] = useState({ loading: true, error: null, reviews: [] });

  useEffect(() => {
    setState({ loading: true, error: null, reviews: [] });
    return subscribeApprovedReviews(
      productId,
      (reviews) => setState({ loading: false, error: null, reviews }),
      (error) => setState({ loading: false, error, reviews: [] })
    );
  }, [productId]);

  const stats = useMemo(() => computeReviewStats(state.reviews), [state.reviews]);

  return { ...state, stats };
}

// The signed-in customer's own review of a product (any status).
export function useMyReview(productId, uid) {
  const [state, setState] = useState({ loading: Boolean(uid), error: null, review: null });

  const load = useCallback(async () => {
    if (!uid || !productId) {
      setState({ loading: false, error: null, review: null });
      return;
    }
    try {
      const review = await getMyReview(productId, uid);
      setState({ loading: false, error: null, review });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Could not read your review:', error?.code, error?.message);
      setState({ loading: false, error, review: null });
    }
  }, [productId, uid]);

  useEffect(() => {
    setState({ loading: Boolean(uid), error: null, review: null });
    load();
  }, [load, uid]);

  return { ...state, reload: load };
}