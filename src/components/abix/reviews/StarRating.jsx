// src/components/abix/reviews/StarRating.jsx
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { ABIX } from '@/components/abix/brandColors';

// Read-only stars. Supports fractional values (e.g. 4.3) for averages by
// clipping a filled row over an outlined row.
export function StarDisplay({ value = 0, size = 16, label }) {
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;
  const row = (filled) => (
    <span className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          fill={filled ? 'currentColor' : 'none'}
          style={{ flexShrink: 0 }}
        />
      ))}
    </span>
  );

  return (
    <span
      className="relative inline-flex"
      role="img"
      aria-label={label || `${value.toFixed(1)} out of 5 stars`}
      style={{ color: ABIX.gold }}
    >
      <span style={{ opacity: 0.35 }}>{row(false)}</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        {row(true)}
      </span>
    </span>
  );
}

// Interactive 1–5 selector. Keyboard accessible (arrow keys move the value).
export function StarInput({ value, onChange, disabled = false }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const handleKey = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (value || 1) - 1));
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Your rating out of 5"
      className="inline-flex gap-1.5"
      onMouseLeave={() => setHover(0)}
      onKeyDown={handleKey}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          tabIndex={value === n || (!value && n === 1) ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          className="p-1 rounded-md transition-transform duration-200 hover:scale-110 focus-visible:outline focus-visible:outline-2"
          style={{ color: ABIX.gold, outlineColor: ABIX.goldLight }}
        >
          <Star size={26} strokeWidth={1.5} fill={n <= shown ? 'currentColor' : 'none'} style={{ opacity: n <= shown ? 1 : 0.5 }} />
        </button>
      ))}
    </div>
  );
}