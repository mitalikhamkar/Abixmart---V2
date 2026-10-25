// src/components/abix/about/AboutRail.jsx
//
// A thin gold stem at the left edge (extra-large screens only). It grows as the
// story is read, with a small leaf at each chapter. One rAF-throttled scroll
// listener; the stem is scaled with a transform, so no layout work.
import React, { useEffect, useRef, useState } from 'react';
import { ABIX } from '@/components/abix/brandColors';

const CHAPTERS = [
  { id: 'about-hero', label: 'Welcome' },
  { id: 'principles', label: 'Principles' },
  { id: 'journey', label: 'Journey' },
  { id: 'transparency', label: 'Transparency' },
  { id: 'ritual', label: 'Ritual' },
  { id: 'closing', label: 'Beginning' },
];
const LAST = CHAPTERS.length - 1;

export default function AboutRail() {
  const [active, setActive] = useState(0);
  const fillRef = useRef(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      const tops = CHAPTERS.map((c) => {
        const el = document.getElementById(c.id);
        return el ? el.getBoundingClientRect().top : null;
      });
      let i = 0;
      tops.forEach((t, k) => {
        if (t !== null && t <= mid) i = k;
      });
      let local = 0;
      const t0 = tops[i];
      const t1 = tops[i + 1];
      if (i < LAST && t0 != null && t1 != null && t1 !== t0) {
        local = Math.min(1, Math.max(0, (mid - t0) / (t1 - t0)));
      }
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${(i + local) / LAST})`;
      setActive((p) => (p === i ? p : i));
    };
    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const go = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="About page chapters" className="hidden xl:block fixed left-6 top-1/2 -translate-y-1/2 z-30">
      <div className="relative" style={{ height: 220, width: 14 }}>
        <span aria-hidden="true" className="absolute left-[6px] top-0 bottom-0 w-px" style={{ background: ABIX.ivory12 }} />
        <span
          ref={fillRef}
          aria-hidden="true"
          className="absolute left-[6px] top-0 bottom-0 w-px origin-top"
          style={{ background: ABIX.gold, transform: 'scaleY(0)', willChange: 'transform' }}
        />
        {CHAPTERS.map((c, i) => {
          const on = i === active;
          const reached = i <= active;
          return (
            <a
              key={c.id}
              href={`#${c.id}`}
              onClick={(e) => go(e, c.id)}
              aria-label={c.label}
              aria-current={on ? 'true' : undefined}
              className="group absolute left-0 flex items-center gap-3 -translate-y-1/2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C7AE7D]"
              style={{ top: `${(i / LAST) * 100}%` }}
            >
              <span
                aria-hidden="true"
                className="block h-[13px] w-[13px] transition-all duration-500"
                style={{
                  borderRadius: '0 100% 0 100%',
                  transform: `rotate(-8deg) scale(${on ? 1.2 : 1})`,
                  background: reached ? ABIX.gold : 'transparent',
                  border: `1px solid ${reached ? ABIX.gold : ABIX.ivory25}`,
                }}
              />
              <span
                className="font-grotesk text-[10px] uppercase tracking-luxe-sm whitespace-nowrap opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
                style={{ color: ABIX.ivory70 }}
              >
                {c.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}