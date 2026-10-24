// src/components/abix/upcoming/livingCollection/theme.js
//
// Local palette and helpers for "The Living Collection". The forest greens
// exist ONLY here: global Tailwind tokens and every other page are untouched.
// Ivory and gold come from the existing ABIX palette.

export const FOREST = {
  deepest: '#09150E',
  deep: '#0D1F15',
  mid: '#142C1D',
  moss: '#1B3825',
  lift: '#244A33',
  leaf: '#2F5E41',
  glow: 'rgba(86,140,104,0.16)',
};

export const EASE = [0.16, 1, 0.3, 1];

export const pad = (n) => String(n).padStart(2, '0');
export const isAvailableProduct = (p) => p.status === 'available';
export const textOf = (p) => p.description || p.note || null;

// One distinct mask reveal per product, cycled by position:
// rise, arched window, iris, curtain.
export const REVEALS = [
  {
    hidden: 'inset(100% 0% 0% 0%)',
    shown: 'inset(0% 0% 0% 0%)',
    radius: '0',
  },
  {
    hidden: 'inset(100% 0% 0% 0% round 50% 50% 0% 0% / 26% 26% 0% 0%)',
    shown: 'inset(0% 0% 0% 0% round 50% 50% 0% 0% / 26% 26% 0% 0%)',
    radius: '50% 50% 0 0 / 26% 26% 0 0',
  },
  {
    hidden: 'circle(0% at 50% 55%)',
    shown: 'circle(75% at 50% 55%)',
    radius: '0',
  },
  {
    hidden: 'inset(0% 50% 0% 50%)',
    shown: 'inset(0% 0% 0% 0%)',
    radius: '0',
  },
];

export const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C7AE7D]';