// src/components/abix/brandColors.js
//
// SINGLE SOURCE OF TRUTH for the ABIXMART homepage palette. Every
// Home-page section imports ABIX from here instead of defining its own
// hex values. This is what keeps the whole homepage as ONE visual
// world — no section can drift into a different near-black/gray/green
// mix than another, because they're all reading the same constants.
//
// Do not add new colors here casually — the brand rule is ONE fixed
// identity, not a palette to pick and choose from per section.

export const ABIX = {
  // Primary background — used for EVERY homepage section background.
  // A real, visible deep forest green — not a near-black gray.
  deep: '#142A1F',

  // Same hue family, marginally deeper — for gradients/vignettes WITHIN
  // a section only (never as a competing section background).
  deeper: '#0F2018',

  ivory: '#F3ECE0',
  ivory70: 'rgba(243,236,224,0.7)',
  ivory45: 'rgba(243,236,224,0.45)',
  ivory25: 'rgba(243,236,224,0.25)',
  ivory12: 'rgba(243,236,224,0.12)',

  gold: '#B08D57',
  goldLight: '#CBA876',
  gold25: 'rgba(176,141,87,0.25)',
  gold15: 'rgba(176,141,87,0.15)',
};