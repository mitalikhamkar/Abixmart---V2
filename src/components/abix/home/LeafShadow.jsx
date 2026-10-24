// src/components/abix/home/LeafShadow.jsx
//
// Slow-drifting leaf-light motif. Purely decorative: aria-hidden, never
// receives pointer events, one cheap CSS transform animation, and it stops
// entirely under prefers-reduced-motion.
import React from 'react';

const LEAF = 'M0,0 C25,-26 95,-30 140,0 C95,30 25,26 0,0Z';
const LEAVES = [
  { r: 18, s: 1.5, x: 0, y: 0 },
  { r: 36, s: 1.15, x: 40, y: 20 },
  { r: 54, s: 1.3, x: 10, y: 60 },
  { r: 72, s: 1.0, x: 70, y: 70 },
  { r: 30, s: 0.85, x: 120, y: 50 },
  { r: 62, s: 1.2, x: 40, y: 130 },
  { r: 84, s: 0.9, x: 110, y: 140 },
  { r: 44, s: 0.8, x: 190, y: 90 },
  { r: 10, s: 0.9, x: 150, y: 10 },
];

const CSS = `
  @keyframes abixLeafSway {
    0%   { transform: rotate(-1.6deg) translate3d(0, 0, 0); }
    100% { transform: rotate(2deg) translate3d(8px, 10px, 0); }
  }
  .abix-leafshadow {
    transform-origin: 0% 0%;
    animation: abixLeafSway 16s ease-in-out infinite alternate;
    will-change: transform;
  }
  @media (prefers-reduced-motion: reduce) {
    .abix-leafshadow { animation: none; }
  }
`;

export default function LeafShadow({
  side = 'left',
  opacity = 0.07,
  className = 'inset-0',
  color = '#E6E1D5',
}) {
  const flip = side === 'right';
  return (
    <div
      aria-hidden="true"
      className={`absolute pointer-events-none overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      <style>{CSS}</style>
      <div
        className="absolute"
        style={{
          top: '-4%',
          [flip ? 'right' : 'left']: '-6%',
          width: 'min(46vw, 520px)',
          transform: flip ? 'scaleX(-1)' : undefined,
        }}
      >
        <svg
          className="abix-leafshadow block w-full h-auto"
          viewBox="0 0 420 560"
          style={{ filter: 'blur(5px)', opacity }}
        >
          <g fill={color}>
            {LEAVES.map((l, i) => (
              <path
                key={i}
                d={LEAF}
                transform={`translate(${l.x + 20} ${l.y + 20}) rotate(${l.r}) scale(${l.s})`}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}