import React, { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import { FOREST } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

// Subtle premium page transition — calm fade + gentle rise.
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────── Ritual transition ─────────────────────────
   Shown only when moving between /shop and /shop/:slug.

   1. A link click between the two is intercepted (capture phase): a green
      leaf grows from the centre until it covers the screen.
   2. The route changes underneath while a gold leaf-vein line draws itself.
   3. The green sheet lifts away with a curved lower edge.

   Navigations we did not start (Back/Forward, programmatic navigate) get the
   same cover-and-lift without the click-in. Phones use a short fade with the
   vein; reduced motion skips the effect entirely. A safety timer always
   clears the overlay, and a busy overlay never starts a second run. */

const kindOf = (p) => (/^\/shop\/?$/.test(p) ? 'shop' : /^\/shop\/[^/]+\/?$/.test(p) ? 'detail' : null);
const isRitualPair = (a, b) => {
  const x = kindOf(a);
  const y = kindOf(b);
  return Boolean(x && y && x !== y);
};
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCompact = () => window.matchMedia('(max-width: 767px)').matches;

const LEAF_PATH = 'M50 2 C 84 30 84 70 50 98 C 16 70 16 30 50 2 Z';
const VEINS = [
  LEAF_PATH,
  'M50 10 L50 92',
  'M50 34 Q 62 38 70 46',
  'M50 34 Q 38 38 30 46',
  'M50 54 Q 64 58 73 68',
  'M50 54 Q 36 58 27 68',
];

export function RitualTransition() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sheetRef = useRef(null);
  const solidRef = useRef(null);
  const leafRef = useRef(null);
  const veinRef = useRef(null);
  const ctrlRef = useRef(null);

  // Controller: built once, owns the click listener and all timelines.
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const solid = solidRef.current;
    const leaf = leafRef.current;
    const vein = veinRef.current;
    if (!sheet || !solid || !leaf || !vein) return undefined;
    const paths = vein.querySelectorAll('path');

    const st = {
      phase: 'idle', // idle | closing | covered | opening
      initiated: false,
      covered: false,
      routeReady: false,
      tl: null,
      safety: 0,
      prev: window.location.pathname,
    };

    const hideAll = () => {
      gsap.set(sheet, { autoAlpha: 0, y: 0, pointerEvents: 'none' });
      gsap.set(solid, { autoAlpha: 0 });
      gsap.set(leaf, { scale: 0 });
      gsap.set(vein, { autoAlpha: 0 });
      gsap.set(paths, { strokeDashoffset: 1 });
    };

    const reset = () => {
      if (st.tl) st.tl.kill();
      window.clearTimeout(st.safety);
      st.tl = null;
      st.phase = 'idle';
      st.initiated = false;
      st.covered = false;
      st.routeReady = false;
      hideAll();
    };

    const arm = () => {
      window.clearTimeout(st.safety);
      st.safety = window.setTimeout(reset, 4000);
    };

    const open = () => {
      st.phase = 'opening';
      const compact = isCompact();
      const tl = gsap.timeline({ onComplete: reset });
      tl.to(vein, { autoAlpha: 1, duration: 0.15 }, 0).to(
        paths,
        { strokeDashoffset: 0, duration: compact ? 0.3 : 0.55, ease: 'power2.inOut', stagger: 0.04 },
        0
      );
      const at = compact ? 0.4 : 0.6;
      if (compact) {
        tl.to(sheet, { autoAlpha: 0, duration: 0.35, ease: 'power1.inOut' }, at);
      } else {
        tl.to(vein, { autoAlpha: 0, duration: 0.25 }, at).to(
          sheet,
          { y: '-118vh', duration: 0.75, ease: 'power3.inOut' },
          at
        );
      }
      st.tl = tl;
    };

    const maybeOpen = () => {
      if (st.covered && st.routeReady && st.phase === 'covered') open();
    };

    const startClose = (to) => {
      st.phase = 'closing';
      st.initiated = true;
      st.covered = false;
      st.routeReady = false;
      arm();

      const compact = isCompact();
      gsap.set(sheet, { autoAlpha: 1, y: 0, pointerEvents: 'auto' });
      gsap.set(vein, { autoAlpha: 0 });
      gsap.set(paths, { strokeDashoffset: 1 });
      gsap.set(solid, { autoAlpha: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          st.covered = true;
          st.phase = 'covered';
          if (st.routeReady) {
            maybeOpen(); // route already changed (e.g. Back pressed mid-way)
          } else {
            navigate(to);
          }
        },
      });
      if (compact) {
        tl.to(solid, { autoAlpha: 1, duration: 0.22, ease: 'power1.out' });
      } else {
        gsap.set(leaf, { scale: 0, rotate: -16 });
        tl.to(leaf, { scale: 14, rotate: 0, duration: 0.6, ease: 'power2.in' }, 0).to(
          solid,
          { autoAlpha: 1, duration: 0.2, ease: 'none' },
          0.4
        );
      }
      st.tl = tl;
    };

    const onRoute = (path) => {
      const prev = st.prev;
      st.prev = path;
      if (prev === path) return;

      if (st.phase !== 'idle') {
        // Our own navigation arriving, or an interruption while running.
        st.routeReady = true;
        maybeOpen();
        return;
      }
      if (prefersReduced() || !isRitualPair(prev, path)) return;

      // Navigation we did not start (Back/Forward, programmatic): cover instantly, then lift.
      st.phase = 'covered';
      st.covered = true;
      st.routeReady = true;
      arm();
      gsap.set(sheet, { autoAlpha: 1, y: 0, pointerEvents: 'auto' });
      gsap.set(solid, { autoAlpha: 1 });
      gsap.set(leaf, { scale: 0 });
      open();
    };

    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target?.closest?.('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      let url;
      try {
        url = new URL(a.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (!isRitualPair(window.location.pathname, url.pathname)) return;
      if (st.phase !== 'idle' || prefersReduced()) return;
      e.preventDefault();
      startClose(url.pathname + url.search + url.hash);
    };

    hideAll();
    document.addEventListener('click', onClick, true);
    ctrlRef.current = { onRoute };

    return () => {
      document.removeEventListener('click', onClick, true);
      ctrlRef.current = null;
      reset();
    };
  }, [navigate]);

  // Tell the controller about every route change before the browser paints.
  useLayoutEffect(() => {
    ctrlRef.current?.onRoute(pathname);
  }, [pathname]);

  return (
    <div
      ref={sheetRef}
      aria-hidden="true"
      className="fixed inset-0 z-[90]"
      style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
    >
      <div ref={solidRef} className="absolute inset-0" style={{ background: FOREST.deepest, opacity: 0 }} />

      <svg
        ref={leafRef}
        viewBox="0 0 100 100"
        className="absolute left-1/2 top-1/2"
        style={{ width: '30vmin', height: '30vmin', marginLeft: '-15vmin', marginTop: '-15vmin', transform: 'scale(0)' }}
      >
        <path d={LEAF_PATH} fill={FOREST.moss} />
      </svg>

      <svg
        ref={veinRef}
        viewBox="0 0 100 100"
        fill="none"
        className="absolute left-1/2 top-1/2"
        style={{ width: '26vmin', height: '26vmin', marginLeft: '-13vmin', marginTop: '-13vmin', opacity: 0 }}
      >
        {VEINS.map((d) => (
          <path
            key={d}
            d={d}
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset="1"
            stroke={ABIX.gold}
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* curved lower edge: sits just below the sheet, so it leads when the sheet lifts */}
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        className="absolute left-0 w-full"
        style={{ top: '100%', height: '16vh', marginTop: '-1px' }}
      >
        <path d="M0 0 H100 V9 C 88 17, 74 3, 58 10 S 24 18, 0 8 Z" fill={FOREST.deepest} />
      </svg>
    </div>
  );
}