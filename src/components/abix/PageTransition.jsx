import React, { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import leafImg from '@/assets/hero/leaf.png';
import { FOREST } from '@/components/abix/upcoming/livingCollection/theme';

// True while the leaf transition is covering the screen. Pages mounting at
// that moment skip their own fade-in, so the new page is already fully visible
// when the veil lifts (a second fade under the veil looked like a flicker).
let ritualRunning = false;
const setRunning = (v) => {
  ritualRunning = v;
};

// Subtle premium page transition — calm fade + gentle rise.
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={ritualRunning ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────── "Falling leaves" transition ─────────────────────
   Shown only when moving between /shop and /shop/:slug.

   Leaves (the same leaf asset as the hero) drift down across the screen with a
   slow sway and spin. A forest-green veil fades in behind them, the route
   changes underneath, then the veil lifts while the last leaves finish falling
   over the new page. Only transform and opacity are animated.

   - A link click between the two pages is intercepted so the veil is fully
     closed before the route changes.
   - Back/Forward and programmatic navigation get the veil at once, then lift.
   - Phones use fewer, faster leaves. Reduced motion skips the effect.
   - A safety timer always clears the overlay; a running transition never
     starts a second one; the overlay never blocks clicks once it is lifting. */

const kindOf = (p) => (/^\/shop\/?$/.test(p) ? 'shop' : /^\/shop\/[^/]+\/?$/.test(p) ? 'detail' : null);
const isRitualPair = (a, b) => {
  const x = kindOf(a);
  const y = kindOf(b);
  return Boolean(x && y && x !== y);
};
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCompact = () => window.matchMedia('(max-width: 767px)').matches;

const LEAF_MAX = 14;

export function RitualTransition() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // useNavigate's identity changes with the route, so it is read through a ref;
  // listing it as an effect dependency would rebuild this transition mid-navigation.
  const navRef = useRef(navigate);
  navRef.current = navigate;

  const sheetRef = useRef(null);
  const veilRef = useRef(null);
  const leafEls = useRef([]);
  const ctrlRef = useRef(null);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const veil = veilRef.current;
    const leaves = leafEls.current.filter(Boolean);
    if (!sheet || !veil || leaves.length === 0) return undefined;

    const st = {
      phase: 'idle', // idle | closing | covered | opening
      covered: false,
      routeReady: false,
      leavesDone: false,
      veilDone: false,
      leafTl: null,
      veilTl: null,
      safety: 0,
      openTimer: 0,
      prev: window.location.pathname,
    };

    const hideAll = () => {
      gsap.set(sheet, { autoAlpha: 0, pointerEvents: 'none' });
      gsap.set(veil, { autoAlpha: 0 });
      gsap.set(leaves, { autoAlpha: 0 });
    };

    const reset = () => {
      if (st.leafTl) st.leafTl.kill();
      if (st.veilTl) st.veilTl.kill();
      window.clearTimeout(st.safety);
      window.clearTimeout(st.openTimer);
      st.leafTl = null;
      st.veilTl = null;
      st.phase = 'idle';
      st.covered = false;
      st.routeReady = false;
      st.leavesDone = false;
      st.veilDone = false;
      setRunning(false);
      hideAll();
    };

    const finish = () => {
      if (st.leavesDone && st.veilDone) reset();
    };

    const arm = () => {
      window.clearTimeout(st.safety);
      st.safety = window.setTimeout(reset, 5000);
    };

    // A fresh, randomised fall every time.
    const startLeaves = (compact) => {
      if (st.leafTl) st.leafTl.kill();
      st.leavesDone = false;
      const count = compact ? 8 : LEAF_MAX;
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          st.leavesDone = true;
          finish();
        },
      });

      leaves.forEach((el, i) => {
        if (i >= count) {
          gsap.set(el, { autoAlpha: 0 });
          return;
        }
        const size = compact ? 40 + Math.random() * 34 : 60 + Math.random() * 52;
        const left = ((i + Math.random() * 0.8) / count) * 100;
        const delay = Math.random() * (compact ? 0.35 : 0.5);
        const dur = (compact ? 1.15 : 1.4) + Math.random() * 0.5;
        const sway = (compact ? 18 : 40) + Math.random() * 38;
        const dir = Math.random() < 0.5 ? -1 : 1;
        const spin = dir * (110 + Math.random() * 170);

        gsap.set(el, {
          width: size,
          left: `${left}%`,
          x: 0,
          y: '-22vh',
          rotation: Math.random() * 60 - 30,
          autoAlpha: 0,
        });
        tl.to(el, { autoAlpha: 0.95, duration: 0.2, ease: 'none' }, delay)
          .to(el, { y: '120vh', duration: dur, ease: 'none' }, delay)
          .fromTo(
            el,
            { x: -sway * dir },
            { x: sway * dir, duration: dur / 2, ease: 'sine.inOut', yoyo: true, repeat: 1 },
            delay
          )
          .to(el, { rotation: `+=${spin}`, duration: dur, ease: 'none' }, delay);
      });

      st.leafTl = tl;
      tl.play(0);
    };

    const open = () => {
      st.phase = 'opening';
      st.veilDone = false;
      gsap.set(sheet, { pointerEvents: 'none' }); // page is usable while the last leaves fall
      st.veilTl = gsap.to(veil, {
        autoAlpha: 0,
        duration: isCompact() ? 0.45 : 0.65,
        ease: 'power1.inOut',
        onComplete: () => {
          st.veilDone = true;
          finish();
        },
      });
    };

    // Give the new page a beat to finish mounting while it is still hidden.
    const scheduleOpen = (delay = 160) => {
      window.clearTimeout(st.openTimer);
      st.openTimer = window.setTimeout(() => {
        if (st.phase === 'covered') open();
      }, delay);
    };

    const startClose = (to) => {
      st.phase = 'closing';
      st.covered = false;
      st.routeReady = false;
      st.veilDone = false;
      arm();
      setRunning(true);

      const compact = isCompact();
      gsap.set(sheet, { autoAlpha: 1, pointerEvents: 'auto' });
      gsap.set(veil, { autoAlpha: 0 });
      startLeaves(compact);

      st.veilTl = gsap.timeline({
        onComplete: () => {
          st.covered = true;
          st.phase = 'covered';
          if (st.routeReady) scheduleOpen(160); // route already changed (e.g. Back pressed)
          else navRef.current(to);
        },
      });
      // a few leaves are already falling over the old page before the veil closes
      st.veilTl.to(veil, { autoAlpha: 1, duration: compact ? 0.4 : 0.55, ease: 'power1.inOut' }, compact ? 0.08 : 0.12);
    };

    const onRoute = (path) => {
      const prev = st.prev;
      st.prev = path;
      if (prev === path) return;

      if (st.phase !== 'idle') {
        // Our own navigation arriving, or an interruption while running.
        st.routeReady = true;
        if (st.covered && st.phase === 'covered') scheduleOpen(160);
        return;
      }
      if (prefersReduced() || !isRitualPair(prev, path)) return;

      // Navigation we did not start (Back/Forward, programmatic): veil at once, then lift.
      st.phase = 'covered';
      st.covered = true;
      st.routeReady = true;
      st.veilDone = false;
      arm();
      setRunning(true);
      gsap.set(sheet, { autoAlpha: 1, pointerEvents: 'auto' });
      gsap.set(veil, { autoAlpha: 1 });
      startLeaves(isCompact());
      scheduleOpen(480); // the new page's own entrance finishes while hidden
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
  }, []);

  // Tell the controller about every route change before the browser paints.
  useLayoutEffect(() => {
    ctrlRef.current?.onRoute(pathname);
  }, [pathname]);

  return (
    <div
      ref={sheetRef}
      aria-hidden="true"
      className="fixed inset-0 z-[90] overflow-hidden"
      style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}
    >
      <div
        ref={veilRef}
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70% 60% at 50% 45%, ${FOREST.mid} 0%, ${FOREST.deepest} 100%)`,
          opacity: 0,
        }}
      />
      {Array.from({ length: LEAF_MAX }, (_, i) => (
        <img
          key={i}
          ref={(el) => {
            leafEls.current[i] = el;
          }}
          src={leafImg}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 64,
            height: 'auto',
            opacity: 0,
            visibility: 'hidden',
            willChange: 'transform, opacity',
            filter: 'brightness(1.35) saturate(1.1) drop-shadow(0 4px 10px rgba(0,0,0,0.5))',
          }}
        />
      ))}
    </div>
  );
}