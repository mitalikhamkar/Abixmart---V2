// src/components/abix/shop/ProductGallery.jsx
//
// Image gallery: crossfading stage, previous/next arrows, thumbnails, swipe.
// Optional slow auto-rotation that pauses on hover/focus, after any manual
// interaction, when off-screen, and never runs under reduced motion.
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { ABIX } from '@/components/abix/brandColors';
import { FOREST, FOCUS_RING, pad } from '@/components/abix/upcoming/livingCollection/theme';

const ARCH = '50% 50% 0 0 / 30% 30% 0 0';

export default function ProductGallery({
  images,
  autoRotate = false,
  intervalMs = 6500,
  arch = true,
  aspect = '4 / 5',
  reveal = false,
  toolbar = null,
  label = 'Product images',
}) {
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const swipeStart = useRef(null);
  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false); // hover / keyboard focus
  const [manual, setManual] = useState(false); // user took over
  const [visible, setVisible] = useState(true);

  const count = images.length;
  const current = count ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!autoRotate || reduce || manual || hold || !visible || count < 2) return undefined;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [autoRotate, reduce, manual, hold, visible, count, intervalMs]);

  if (count === 0) return null;

  const step = (dir) => {
    setManual(true);
    setIndex((i) => (Math.min(i, count - 1) + dir + count) % count);
  };
  const select = (i) => {
    setManual(true);
    setIndex(i);
  };

  const onKeyDown = (e) => {
    if (count < 2) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  };

  const arrowClass = `absolute top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full inline-flex items-center justify-center backdrop-blur-md transition-colors hover:brightness-125 ${FOCUS_RING}`;
  const arrowStyle = { background: `${FOREST.deepest}CC`, color: ABIX.ivory, border: `1px solid ${ABIX.ivory12}` };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHold(false);
      }}
    >
      <div className="relative" style={{ aspectRatio: aspect }}>
        {arch && (
          <div
            aria-hidden="true"
            className="absolute -inset-3 pointer-events-none"
            style={{ border: `1px solid ${ABIX.gold25}`, borderRadius: ARCH }}
          />
        )}

        <div
          {...(reveal ? { 'data-clip': '' } : {})}
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: arch ? ARCH : 16,
            background: `linear-gradient(165deg, ${FOREST.moss} 0%, ${FOREST.deepest} 100%)`,
            touchAction: 'pan-y',
          }}
          onPointerDown={(e) => { swipeStart.current = e.clientX; }}
          onPointerUp={(e) => {
            if (swipeStart.current == null) return;
            const dx = e.clientX - swipeStart.current;
            swipeStart.current = null;
            if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { swipeStart.current = null; }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(60% 45% at 50% 62%, ${ABIX.gold25} 0%, transparent 70%)` }}
          />

          {images.map((img, i) => {
            const on = i === current;
            return (
              <img
                key={img.src}
                src={img.src}
                alt={img.alt}
                aria-hidden={!on}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full select-none transition-[opacity,transform] duration-700 ease-out"
                style={{
                  objectFit: img.fit || 'contain',
                  padding: img.fit === 'cover' ? 0 : '9%',
                  opacity: on ? 1 : 0,
                  transform: on ? 'scale(1)' : 'scale(1.04)',
                  filter: img.fit === 'cover' ? 'none' : 'drop-shadow(0 20px 22px rgba(0,0,0,0.45))',
                }}
              />
            );
          })}

          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-1/4 pointer-events-none"
            style={{ background: `linear-gradient(0deg, ${FOREST.deepest}99 0%, transparent 100%)` }}
          />

          {count > 1 && (
            <>
              <button type="button" aria-label="Previous image" onClick={() => step(-1)} className={`${arrowClass} left-2`} style={arrowStyle}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" aria-label="Next image" onClick={() => step(1)} className={`${arrowClass} right-2`} style={arrowStyle}>
                <ChevronRight size={18} />
              </button>
              <span
                aria-hidden="true"
                className="absolute left-4 bottom-3 z-10 font-grotesk text-[10px] tracking-luxe-sm"
                style={{ color: ABIX.ivory70 }}
              >
                {pad(current + 1)} / {pad(count)}
              </span>
            </>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">Image {current + 1} of {count}</p>

      {(count > 1 || toolbar) && (
        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 min-w-0 flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {count > 1 &&
              images.map((img, i) => {
                const on = i === current;
                return (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => select(i)}
                    aria-label={`Show image ${i + 1} of ${count}`}
                    aria-current={on ? 'true' : undefined}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden transition-all duration-300 ${FOCUS_RING}`}
                    style={{
                      border: `1px solid ${on ? ABIX.gold : ABIX.ivory25}`,
                      background: FOREST.deepest,
                      opacity: on ? 1 : 0.6,
                      borderRadius: 8,
                    }}
                  >
                    <img
                      src={img.src}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="h-full w-full"
                      style={{ objectFit: img.fit === 'cover' ? 'cover' : 'contain', padding: img.fit === 'cover' ? 0 : 4 }}
                    />
                  </button>
                );
              })}
          </div>
          {toolbar && <div className="shrink-0">{toolbar}</div>}
        </div>
      )}
    </div>
  );
}