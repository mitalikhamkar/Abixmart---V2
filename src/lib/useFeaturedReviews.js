// src/lib/useFeaturedReviews.js
import { useEffect, useMemo, useState } from 'react';
import { ROTATION_WINDOW_MS, rotationWindowIndex, selectFeaturedReviews } from '@/lib/featuredReviews';

// Featured selection that stays stable while the page is open and rolls
// over when the next 24-hour window starts. One timer, no backend job.
export function useFeaturedReviews(reviews, { limit, scope }) {
  const [windowIndex, setWindowIndex] = useState(() => rotationWindowIndex());

  useEffect(() => {
    const untilNext = (windowIndex + 1) * ROTATION_WINDOW_MS - Date.now();
    const timer = setTimeout(() => setWindowIndex(rotationWindowIndex()), Math.max(untilNext, 1000) + 50);
    return () => clearTimeout(timer);
  }, [windowIndex]);

  return useMemo(
    () => selectFeaturedReviews(reviews, { limit, scope, windowIndex }),
    [reviews, limit, scope, windowIndex]
  );
}