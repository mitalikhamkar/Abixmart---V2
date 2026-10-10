// src/lib/featuredReviews.js
//
// Deterministic featured-review selection. Pure: no React, no Firebase.
//
// The selection depends only on (a) the approved reviews passed in, (b) the
// 24-hour window the clock is in, and (c) a scope string (a product id, or
// 'home'). Nothing is written anywhere, so a review is never modified,
// deleted or re-approved just to rotate it into view, and the result does
// not change between renders inside the same window.
//
// Admin-featured reviews are always considered first; the remaining slots
// are filled from the other approved reviews.

import { REVIEW_STATUS, isRenderableReview } from '@/lib/reviewUtils';

export const ROTATION_WINDOW_MS = 24 * 60 * 60 * 1000;

// Index of the current 24-hour window (UTC days since the epoch).
export function rotationWindowIndex(now = Date.now()) {
  return Math.floor(now / ROTATION_WINDOW_MS);
}

// FNV-1a string hash -> unsigned 32-bit integer.
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Small seeded PRNG (mulberry32).
function mulberry32(seed) {
  let a = seed;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(list, seedKey) {
  const rand = mulberry32(hashString(seedKey));
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// Returns at most `limit` approved reviews. Fewer reviews than `limit`
// means fewer are returned; no reviews means an empty array.
export function selectFeaturedReviews(reviews, { limit, scope = 'all', windowIndex = rotationWindowIndex() } = {}) {
  if (!limit || limit <= 0) return [];

  // Sorted by id first so the result never depends on snapshot order.
  const eligible = reviews
    .filter((r) => r.status === REVIEW_STATUS.APPROVED && isRenderableReview(r))
    .sort(byId);

  const key = `${windowIndex}:${scope}`;
  const featured = eligible.filter((r) => r.featured);
  const others = eligible.filter((r) => !r.featured);

  return [
    ...seededShuffle(featured, `${key}:featured`),
    ...seededShuffle(others, `${key}:rest`),
  ].slice(0, limit);
}