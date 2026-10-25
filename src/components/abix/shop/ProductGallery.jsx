// src/components/abix/shop/ProductGallery.jsx
//
// Image gallery: crossfading stage, previous/next arrows, thumbnails, swipe.
// Auto-switches every `intervalMs` (default 3s). Manual use pauses it for 8s,
// then it resumes. Hover (mouse only) and keyboard focus pause it too, and it
// never runs when off-screen or under reduced motion.
//
// Smoothness: images are preloaded and decoded up front; the slideshow only
// advances to an image that is ready; crossfades use opacity/transform only.
//
// Mobile: the root can never be wider than its container (min-w-0, max-w-full),
// and the thumbnail strip scrolls inside itself without widening the page.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { ABIX } from '@/components/abix/brandColors';
import { FOREST, FOCUS_RING, pad } from '@/components/abix/upcoming/livingCollection/theme';

const ARCH = '50% 50% 0 0 / 30% 30% 0 0';
const MANUAL_PAUSE_MS = 8000;

const CSS = `
  @keyframes abixGalleryBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  .abix-gbar { transform-origin: 0 50%; animation-name: abixGalleryBar; animation-timing-function: linear; animation-fill-mode: forwards; }
`;

export default function ProductGallery({
  images,
  autoRotate = true,
  intervalMs = 3000,
  arch = true,
  aspect = '4 / 5',
  reveal = false,
  toolbar = null,
  label = 'Product images',
}) {
  const reduce = useReducedMotion();
  const rootRef = useRef(null);
  const thumbsRef = useRef(null);
  const swipeStart = useRef(null);
  const manualTimer = useRef(0);
  const loaded = useRef(new Set());

  const [index, setIndex] = useState(0);
  const [hold, setHold] = useState(false); // mouse hover / keyboard focus
  const [manual, setManual] = useState(false); // user took over for a while
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(0); // bumps as images finish decoding

  const count = images.length;
  const current = count ? Math.min(index, count - 1) : 0;

  // Preload and decode every image so a crossfade never lands on a blank frame.
  useEffect(() => {
    let cancelled = false;
    images.forEach((img) => {
      const el = new Image();
      el.decoding = 'async';
      el.src = img.src;
      const done = () => {
        if (cancelled) return;
        loaded.current.add(img.src);
        setReady((n) => n + 1);
      };
      if (el.decode) el.decode().then(done).catch(done);
      else el.onload = done;
    });
    return () => {
      cancelled = true;
    };
  }, [images]);

  // Pause when scrolled out of view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(manualTimer.current), []);

  const touch = useCallback(() => {
    setManual(true);
    window.clearTimeout(manualTimer.current);
    manualTimer.current = window.setTimeout(() => setManual(false), MANUAL_PAUSE_MS);
  }, []);

  const running = autoRotate && !reduce && !manual && !hold && visible && count > 1;

  useEffect(() => {
    if (!running) return undefined;
    const id = window.setTimeout(() => {
      setIndex((i) => {
        const cur = Math.min(i, count - 1);
        const nxt = (cur + 1) % count;
        return loaded.current.has(images[nxt].src) ? nxt : cur;
      });
    }, intervalMs);
    return () => window.clearTimeout(id);
  }, [running, current, count, intervalMs, images, ready]);

  // Keep the active thumbnail centred in its own strip (never scrolls the page).
  useEffect(() => {
    const box = thumbsRef.current;
    const el = box?.children[current];
    if (!box || !el) return;
    const left = el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2;
    box.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
  }, [current, reduce]);

  if (count === 0) return null;

  const step = (dir) => {
    touch();
    setIndex((i) => (Math.min(i, count - 1) + dir + count) % count);
  };
  const select = (i) => {
    touch();
    setIndex(i);
  };

  const onKeyDown = (e) => {
    if (count < 2) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  };

  const arrowClass = `absolute top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full inline-flex items-center justify-center transition-colors hover:brightness-125 ${FOCUS_RING}`;
  const arrowStyle = { background: `${FOREST.deepest}D9`, color: ABIX.ivory, border: `1px solid ${ABIX.ivory12}` };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className="w-full min-w-0 max-w-full"
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHold(true); }}
      onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHold(false); }}
      onFocus={(e) => { if (e.target.matches && e.target.matches(':focus-visible')) setHold(true); }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHold(false);
      }}
    >
      <style>{CSS}</style>

      <div className="relative" style={{ aspectRatio: aspect }}>
        {arch && (
          <div
            aria-hidden="true"
            className="absolute -inset-2 sm:-inset-3 pointer-events-none"
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
          {images.map((img, i) => {
            const on = i === current;
            const contain = img.fit === 'contain';
            return (
              <img
                key={img.src}
                src={img.src}
                alt={img.alt}
                aria-hidden={!on}
                decoding="async"
                draggable={false}
                className="absolute inset-0 h-full w-full select-none"
                style={{
                  objectFit: contain ? 'contain' : 'cover',
                  padding: contain ? '9%' : 0,
                  opacity: on ? 1 : 0,
                  transform: on ? 'scale(1)' : 'scale(1.03)',
                  transition: 'opacity 0.9s ease, transform 1.4s cubic-bezier(0.16,1,0.3,1)',
                  willChange: 'opacity',
                }}
              />
            );
          })}

          {count > 1 && (
            <>
              <button type="button" aria-label="Previous image" onClick={() => step(-1)} className={`${arrowClass} left-2`} style={arrowStyle}>
                <ChevronLeft size={18} />
              </button>
              <button type="button" aria-label="Next image" onClick={() => step(1)} className={`${arrowClass} right-2`} style={arrowStyle}>
                <ChevronRight size={18} />
              </button>
              {/* counter: top-left, on a small dark chip, clear of the photo's own text */}
              <span
                aria-hidden="true"
                className="absolute left-3 top-3 z-10 px-2.5 py-1 rounded-full font-grotesk text-[10px] tracking-luxe-sm"
                style={{ color: ABIX.ivory, background: `${FOREST.deepest}B3` }}
              >
                {pad(current + 1)} / {pad(count)}
              </span>
            </>
          )}

          {/* countdown to the next photo */}
          {running && (
            <span
              key={current}
              aria-hidden="true"
              className="abix-gbar absolute inset-x-0 bottom-0 z-10 h-[2px]"
              style={{ background: ABIX.gold, animationDuration: `${intervalMs}ms` }}
            />
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">Image {current + 1} of {count}</p>

      {(count > 1 || toolbar) && (
        <div className="mt-5 flex items-center gap-3 w-full min-w-0">
          <div
            ref={thumbsRef}
            className="relative flex-1 min-w-0 flex items-center gap-3 overflow-x-auto no-scrollbar py-1 [contain:inline-size]"
          >
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
                    className={`relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden transition-all duration-300 ${FOCUS_RING}`}
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
                      decoding="async"
                      className="h-full w-full"
                      style={{ objectFit: img.fit === 'contain' ? 'contain' : 'cover', padding: img.fit === 'contain' ? 4 : 0 }}
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