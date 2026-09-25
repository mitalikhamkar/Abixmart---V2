// src/components/abix/SectionDivider.jsx
import React from 'react';
import { ABIX } from './brandColors';

// The ONE seam device used between every homepage section — replaces
// the six separate ad-hoc fade-strip hacks that used to live inside
// each section (NatureFilm, ProductShowcase, WhatsGrowingNext), which
// were fading toward colors that didn't always match their neighbor
// and produced visible mismatched bands. This is deliberately the
// only place a "transition" gets built now.
export default function SectionDivider({ fromColor, toColor, accent = ABIX.gold, flip = false }) {
  const gradientId = `seam-${fromColor}-${toColor}-${flip}`.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <div
      className="relative w-full overflow-hidden pointer-events-none select-none"
      style={{ height: 'clamp(56px, 8vw, 100px)', backgroundColor: fromColor }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} />
          </linearGradient>
        </defs>

        <path
          d="M0,38 C220,90 460,10 720,44 C980,78 1220,18 1440,50 L1440,120 L0,120 Z"
          fill={`url(#${gradientId})`}
        />

        <path
          d="M0,38 C220,90 460,10 720,44 C980,78 1220,18 1440,50"
          fill="none"
          stroke={accent}
          strokeWidth="1"
          opacity="0.45"
        />

        <circle cx="720" cy="44" r="2.5" fill={accent} opacity="0.7" />
      </svg>
    </div>
  );
}