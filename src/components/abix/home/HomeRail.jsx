// src/components/abix/home/HomeRail.jsx
//
// Slim chapter rail for the homepage (xl screens and up). One rAF-throttled
// scroll listener; sections are looked up at scroll time, so a section that
// mounts late (e.g. pre-orders waiting on the catalog) is picked up.
import React, { useEffect, useState } from 'react';
import { ABIX } from '../brandColors';

const SECTIONS = [
  { id: 'top', label: 'Welcome' },
  { id: 'shilajit', label: 'Shilajit' },
  { id: 'growing', label: 'Pre-orders' },
  { id: 'circle', label: 'The Circle' },
  { id: 'reviews', label: 'Voices' },
];

export default function HomeRail() {
  const [active, setActive] = useState('top');

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let current = 'top';
      SECTIONS.forEach((s) => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) current = s.id;
      });
      setActive((prev) => (prev === current ? prev : current));
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
    <nav
      aria-label="Homepage sections"
      className="hidden xl:flex fixed left-5 top-1/2 -translate-y-1/2 z-30 flex-col gap-4"
    >
      {SECTIONS.map((s) => {
        const on = s.id === active;
        return (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => go(e, s.id)}
            aria-current={on ? 'true' : undefined}
            aria-label={s.label}
            className="group flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C7AE7D]"
          >
            <span
              className="block rounded-full transition-all duration-500"
              style={{
                height: on ? 22 : 7,
                width: 3,
                background: on ? ABIX.gold : ABIX.ivory25,
              }}
            />
            <span
              className="font-grotesk text-[10px] uppercase tracking-luxe-sm opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100 group-focus-visible:translate-x-0"
              style={{ color: ABIX.ivory70 }}
            >
              {s.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}