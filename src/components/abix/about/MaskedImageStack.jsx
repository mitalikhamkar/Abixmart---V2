// src/components/abix/about/MaskedImageStack.jsx
//
// A stack of images where exactly one is visible at rest.
// The new image is revealed over the old one with a rising mask; the old one is
// hidden only after the reveal finishes. Inactive layers are visibility:hidden,
// not merely transparent, so a stray layer can never show through.
import React from 'react';
import { useReducedMotion } from 'framer-motion';

const OPEN = 'inset(0% 0% 0% 0%)';
const SHUT = 'inset(100% 0% 0% 0%)';
const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

export default function MaskedImageStack({ images, active, prev = active, className = '', style, position = 'center' }) {
  const reduce = useReducedMotion();
  const d = reduce ? 0 : 0.95;

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {images.map((img, i) => {
        const isActive = i === active;
        const isPrev = !isActive && i === prev;
        return (
          <div
            key={img.src}
            aria-hidden={!isActive}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: isActive ? 2 : isPrev ? 1 : 0,
              clipPath: isActive || isPrev ? OPEN : SHUT,
              visibility: isActive ? 'visible' : 'hidden',
              transition: isActive
                ? `clip-path ${d}s ${EASE}`
                : isPrev
                  ? `visibility 0s linear ${d}s`
                  : 'none',
            }}
          >
            <img
              src={img.src}
              alt={isActive ? img.alt : ''}
              decoding="async"
              draggable={false}
              className="h-full w-full object-cover select-none"
              style={{
                objectPosition: position,
                transform: isActive ? 'scale(1)' : 'scale(1.07)',
                transition: isActive && !reduce ? 'transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}