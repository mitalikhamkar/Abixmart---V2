// src/components/abix/about/aboutMotion.js
//
// Shared CSS for the About and Support pages' small motions (plus the in-view
// reveal styles). Everything is transform/opacity only, and switches off under
// prefers-reduced-motion.
import { REVEAL_CSS } from '@/hooks/useInViewReveal';

export const ABOUT_CSS = `
  ${REVEAL_CSS}

  @keyframes abixRise {
    from { opacity: 0; transform: translate3d(0, 14px, 0); }
    to   { opacity: 1; transform: none; }
  }
  .abix-rise > * { animation: abixRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .abix-rise > *:nth-child(2) { animation-delay: 0.06s; }
  .abix-rise > *:nth-child(3) { animation-delay: 0.12s; }
  .abix-rise > *:nth-child(4) { animation-delay: 0.18s; }
  .abix-rise > *:nth-child(5) { animation-delay: 0.24s; }
  .abix-in { animation: abixRise 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }

  @keyframes abixAmber {
    0%   { transform: translate3d(-4%, 2%, 0) scale(1);    opacity: 0.55; }
    100% { transform: translate3d(5%, -3%, 0) scale(1.15); opacity: 0.85; }
  }
  .abix-amber { animation: abixAmber 14s ease-in-out infinite alternate; will-change: transform, opacity; }

  @keyframes abixGbar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .abix-gbar { transform-origin: 0 50%; animation-name: abixGbar; animation-timing-function: linear; animation-fill-mode: forwards; }

  @keyframes abixPulse {
    0%   { transform: scale(1);   opacity: 0.6; }
    100% { transform: scale(2.1); opacity: 0; }
  }
  .abix-pulse { animation: abixPulse 2.2s ease-out infinite; }

  @media (prefers-reduced-motion: reduce) {
    .abix-rise > *, .abix-in, .abix-amber, .abix-pulse { animation: none !important; }
  }
`;

export const MOTION_CSS = ABOUT_CSS;