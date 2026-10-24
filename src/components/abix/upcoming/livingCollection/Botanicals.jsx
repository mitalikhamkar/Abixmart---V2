// src/components/abix/upcoming/livingCollection/Botanicals.jsx
//
// Original, decorative botanical silhouettes drawn as inline SVG. They are
// abstract artwork: they do not depict, and must not be read as, any
// product's ingredient. Colour comes from `currentColor`.

import React from 'react';

const LEAF = 'M0 0 C 16 -20 17 -58 0 -92 C -17 -58 -16 -20 0 0 Z';
const ROUND = 'M0 0 C 26 -10 30 -44 0 -64 C -30 -44 -26 -10 0 0 Z';
const LONG = 'M0 0 C 9 -30 9 -90 0 -150 C -9 -90 -9 -30 0 0 Z';

function Spray() {
  const leaves = [
    [380, -38, 1], [340, 40, 1], [290, -42, 0.95], [250, 44, 0.95],
    [200, -36, 0.85], [165, 38, 0.85], [120, -30, 0.7], [95, 32, 0.7],
  ];
  return (
    <g>
      <path d="M150 500 C 148 400 152 200 150 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {leaves.map(([y, r, s]) => (
        <path key={y} d={LEAF} transform={`translate(150 ${y}) rotate(${r}) scale(${s})`} fill="currentColor" />
      ))}
      <path d={LEAF} transform="translate(150 70) scale(0.6)" fill="currentColor" />
    </g>
  );
}

function bez(t) {
  const p0 = [70, 500], p1 = [70, 330], p2 = [130, 170], p3 = [235, 35];
  const m = 1 - t;
  const x = m ** 3 * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t ** 3 * p3[0];
  const y = m ** 3 * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t ** 3 * p3[1];
  const dx = 3 * m * m * (p1[0] - p0[0]) + 6 * m * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy = 3 * m * m * (p1[1] - p0[1]) + 6 * m * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  return { x, y, a: (Math.atan2(dx, -dy) * 180) / Math.PI };
}

function Frond() {
  const ts = [0.16, 0.26, 0.36, 0.46, 0.56, 0.66, 0.76, 0.86, 0.94];
  return (
    <g>
      <path d="M70 500 C 70 330 130 170 235 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {ts.map((t) => {
        const { x, y, a } = bez(t);
        const s = 0.95 - t * 0.55;
        return (
          <g key={t}>
            <path d={LEAF} transform={`translate(${x} ${y}) rotate(${a - 58}) scale(${s})`} fill="currentColor" />
            <path d={LEAF} transform={`translate(${x} ${y}) rotate(${a + 58}) scale(${s})`} fill="currentColor" />
          </g>
        );
      })}
      {(() => {
        const { x, y, a } = bez(1);
        return <path d={LEAF} transform={`translate(${x} ${y}) rotate(${a}) scale(0.4)`} fill="currentColor" />;
      })()}
    </g>
  );
}

function Sprig() {
  const ys = [440, 388, 336, 284, 232, 180, 128];
  return (
    <g>
      <path d="M150 500 C 154 380 146 180 150 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {ys.map((y, i) => (
        <path
          key={y}
          d={ROUND}
          transform={`translate(150 ${y}) rotate(${i % 2 ? 62 : -62}) scale(${1 - i * 0.08})`}
          fill="currentColor"
        />
      ))}
      <path d={ROUND} transform="translate(150 54) scale(0.5)" fill="currentColor" />
    </g>
  );
}

function Fan() {
  const blades = [[-48, 0.9], [-24, 1.1], [0, 1.25], [24, 1.1], [48, 0.9]];
  return (
    <g>
      {blades.map(([r, s]) => (
        <path key={r} d={LONG} transform={`translate(150 500) rotate(${r}) scale(${s})`} fill="currentColor" />
      ))}
    </g>
  );
}

const ART = [Spray, Frond, Sprig, Fan];

export default function Botanical({ variant = 0, className = '', style }) {
  const Art = ART[((variant % ART.length) + ART.length) % ART.length];
  return (
    <svg
      viewBox="0 0 300 500"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
    >
      <Art />
    </svg>
  );
}