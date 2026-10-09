// src/components/abix/reviews/reviewAssets.js
//
// ONE place to change the jar used by the reviews section.
//
// When your background-removed Shilajit image is ready, either replace the
// file below with the same name, or change the import path. Nothing else
// needs to change.
//
// The image is the real ABIXMART jar, used as-is (no re-drawing, no
// substitution). Only its on-screen size, shadow and motion are tuned here.

import shilajitJar from '@/assets/home/products/shilajit-jar-cutout.png';

// Keyed by product slug. A product with no entry simply has no floating jar.
export const REVIEW_JAR_IMAGES = {
  shilajit: shilajitJar,
};

// Visual treatment.
export const REVIEW_JAR_TREATMENT = {
  width: 'clamp(150px, 20vw, 240px)',
  stageHeight: 'clamp(280px, 36vw, 400px)',
  dropShadow: 'drop-shadow(0 26px 26px rgba(0,0,0,0.55))',
};

// Motion tuning. Keep these small: the brief is "restrained".
export const REVIEW_JAR_MOTION = {
  fromScale: 0.78,
  fromY: 90,
  fromRotateX: 14,
  fromRotateY: -16,
  toRotateY: -5,
  idleFloatPx: 6,
  idleFloatSeconds: 6,
};