import React, { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { gsap } from '@/lib/gsap';
import leafImg from '@/assets/hero/leaf.png';
import logoImg from '@/assets/logo/Abixmart-full.png';
import { FOREST } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

/* ───────────────────────── shared transition state ─────────────────────────
   ritualRunning is true while the cinematic veil is covering the screen. Pages
   that mount in that window skip their own fade-in, and anything that wants to
   start an intro animation can wait for the veil to lift via whenPageReady(). */
export const REVEAL_EVENT = 'abix:page-reveal';
let ritualRunning = false;
const setRunning = (v) => {
  ritualRunning = v;
};
export const isTransitionActive = () => ritualRunning;
const announceReveal = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(REVEAL_EVENT));
};

// Runs cb right away (next frame) when no transition is covering the page,
// otherwise as soon as the veil starts to lift (with a 3s safety). Returns a cleanup.
export function whenPageReady(cb) {
  if (typeof window === 'undefined') return () => {};
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cb();
  };
  if (!ritualRunning) {
    const id = window.requestAnimationFrame(run);
    return () => {
      done = true;
      window.cancelAnimationFrame(id);
    };
  }
  const t = window.setTimeout(run, 3000);
  const h = () => run();
  window.addEventListener(REVEAL_EVENT, h, { once: true });
  return () => {
    done = true;
    window.clearTimeout(t);
    window.removeEventListener(REVEAL_EVENT, h);
  };
}

// Every page's own short entrance (the "lightweight" fade, about 220 ms).
// Skipped when the cinematic veil is covering the screen.
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={ritualRunning ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────────────────────── Botanical passage ─────────────────────────────
   One transition system with three behaviours, decided by the link clicked:

   A. CINEMATIC (destination is Home, Shop, About, Support, How-to-take or a
      product page): a forest-green veil with an amber glow closes (~0.3 s), the
      ABIXMART logo and a fine gold line appear, leaves drift down. The route
      changes the moment the veil is closed; the page is revealed once the
      sequence has been on screen for ~0.65 s, then the veil lifts (~0.4 s).
   B. LIGHTWEIGHT (any other internal page: cart, wishlist, account, login…): the
      current page fades out (~0.1 s), then the new page fades in (~0.22 s).
   C. NONE: same page, #hash-only or ?query-only links, new-tab clicks,
      external links, downloads, the admin area, reduced motion, and everything
      that is not a link click (add-to-cart, search, wishlist, FAQ, forms,
      carousels, modals). Browser Back/Forward and code-driven navigation are
      left alone: the page's own 0.22 s entrance handles them.

   Rapid or duplicate clicks while a transition runs are swallowed (the latest
   destination wins). If the route never changes, the veil lifts after 0.9 s;
   a 5 s timer always clears everything. Only transform and opacity animate. */

const norm = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p) || '/';
const isSitePath = (p) => !p.startsWith('/admin');
const isPageChange = (a, b) => norm(a) !== norm(b) && isSitePath(a) && isSitePath(b);
const MAJOR = new Set(['/', '/shop', '/about', '/support', '/how-to-take-shilajit']);
const isMajor = (p) => {
  const n = norm(p);
  return MAJOR.has(n) || /^\/shop\/[^/]+$/.test(n);
};
const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCompact = () => window.matchMedia('(max-width: 767px)').matches;

const LEAF_MAX = 14;

export function RitualTransition() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // useNavigate's identity changes with the route, so it is read through a ref;
  // listing it as an effect dependency would reset the transition mid-navigation.
  const navRef = useRef(navigate);
  navRef.current = navigate;

  const sheetRef = useRef(null);
  const veilRef = useRef(null);
  const emblemRef = useRef(null);
  const lineRef = useRef(null);
  const leafEls = useRef([]);
  const ctrlRef = useRef(null);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const veil = veilRef.current;
    const emblem = emblemRef.current;
    const line = lineRef.current;
    const leaves = leafEls.current.filter(Boolean);
    if (!sheet || !veil || !emblem || !line || leaves.length === 0) return undefined;

    const st = {
      phase: 'idle', // idle | closing | covered | opening | light
      covered: false,
      routeReady: false,
      leavesDone: false,
      veilDone: false,
      leafTl: null,
      veilTl: null,
      safety: 0,
      openTimer: 0,
      navGuard: 0,
      startedAt: 0,
      minCover: 650,
      target: '',
      mainEl: null,
      prev: window.location.pathname,
    };

    const hideAll = () => {
      gsap.set(sheet, { autoAlpha: 0, pointerEvents: 'none' });
      gsap.set(veil, { autoAlpha: 0 });
      gsap.set(emblem, { autoAlpha: 0 });
      gsap.set(line, { scaleX: 0 });
      gsap.set(leaves, { autoAlpha: 0 });
    };

    const restoreMain = () => {
      if (st.mainEl) gsap.set(st.mainEl, { clearProps: 'opacity' });
      st.mainEl = null;
    };

    const reset = () => {
      const wasRunning = ritualRunning;
      if (st.leafTl) st.leafTl.kill();
      if (st.veilTl) st.veilTl.kill();
      window.clearTimeout(st.safety);
      window.clearTimeout(st.openTimer);
      window.clearTimeout(st.navGuard);
      restoreMain();
      st.leafTl = null;
      st.veilTl = null;
      st.phase = 'idle';
      st.covered = false;
      st.routeReady = false;
      st.leavesDone = false;
      st.veilDone = false;
      setRunning(false);
      hideAll();
      if (wasRunning) announceReveal();
    };

    const finish = () => {
      if (st.leavesDone && st.veilDone) reset();
    };

    const arm = () => {
      window.clearTimeout(st.safety);
      st.safety = window.setTimeout(reset, 5000);
    };

    // A fresh, randomised drift of leaves every time. They fall for about a
    // second, so they are clearly visible without becoming a loading delay.
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
        const size = compact ? 40 + Math.random() * 34 : 58 + Math.random() * 50;
        const left = ((i + Math.random() * 0.8) / count) * 100;
        const delay = Math.random() * (compact ? 0.3 : 0.42);
        const dur = (compact ? 0.95 : 1.1) + Math.random() * 0.5;
        const sway = (compact ? 16 : 36) + Math.random() * 34;
        const dir = Math.random() < 0.5 ? -1 : 1;
        const spin = dir * (100 + Math.random() * 160);

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
      gsap.set(sheet, { pointerEvents: 'none' }); // the page is usable while it lifts
      setRunning(false);
      announceReveal(); // page intros can start now
      const compact = isCompact();
      st.veilTl = gsap
        .timeline({
          onComplete: () => {
            st.veilDone = true;
            finish();
          },
        })
        .to(emblem, { autoAlpha: 0, y: -6, duration: 0.24, ease: 'power1.in' }, 0)
        .to(veil, { autoAlpha: 0, duration: compact ? 0.32 : 0.42, ease: 'power1.inOut' }, 0.08);
    };

    // The page is revealed only once the logo and leaves have been on screen
    // for the minimum time, never longer than that.
    const scheduleOpen = () => {
      window.clearTimeout(st.openTimer);
      const wait = Math.max(60, st.minCover - (performance.now() - st.startedAt));
      st.openTimer = window.setTimeout(() => {
        if (st.phase === 'covered') open();
      }, wait);
    };

    const startClose = (to) => {
      st.phase = 'closing';
      st.covered = false;
      st.routeReady = false;
      st.veilDone = false;
      st.target = to;
      st.startedAt = performance.now();
      const compact = isCompact();
      st.minCover = compact ? 520 : 650;
      arm();
      setRunning(true);

      gsap.set(sheet, { autoAlpha: 1, pointerEvents: 'auto' });
      gsap.set(veil, { autoAlpha: 0 });
      gsap.set(emblem, { autoAlpha: 0, y: 10, scale: 0.96 });
      gsap.set(line, { scaleX: 0 });
      startLeaves(compact);

      st.veilTl = gsap
        .timeline({
          onComplete: () => {
            st.covered = true;
            st.phase = 'covered';
            if (st.routeReady) {
              scheduleOpen(); // route already changed (e.g. Back pressed meanwhile)
              return;
            }
            navRef.current(st.target);
            window.clearTimeout(st.navGuard);
            st.navGuard = window.setTimeout(() => {
              if (!st.routeReady) {
                st.routeReady = true;
                scheduleOpen();
              }
            }, 900);
          },
        })
        .to(veil, { autoAlpha: 1, duration: compact ? 0.26 : 0.32, ease: 'power1.inOut' }, 0.05)
        .to(emblem, { autoAlpha: 1, y: 0, scale: 1, duration: 0.34, ease: 'power2.out' }, 0.14)
        .to(line, { scaleX: 1, duration: 0.4, ease: 'power2.inOut' }, 0.22);
    };

    // Lightweight: the current page fades out quickly; the new one fades in on its own.
    const startLight = (to) => {
      const main = document.querySelector('main');
      if (!main) {
        navRef.current(to);
        return;
      }
      st.phase = 'light';
      st.mainEl = main;
      arm();
      st.veilTl = gsap.timeline({
        onComplete: () => {
          navRef.current(to);
          window.clearTimeout(st.navGuard);
          st.navGuard = window.setTimeout(reset, 800); // route never changed: restore
        },
      });
      st.veilTl.to(main, { opacity: 0, duration: 0.1, ease: 'power1.out' });
    };

    const onRoute = (path) => {
      const prev = st.prev;
      st.prev = path;
      if (norm(prev) === norm(path)) return;

      if (st.phase === 'light') {
        reset(); // restores main before the new page paints
        return;
      }
      if (st.phase !== 'idle') {
        st.routeReady = true;
        window.clearTimeout(st.navGuard);
        if (st.covered && st.phase === 'covered') scheduleOpen();
        return;
      }
      // idle: Back/Forward or code-driven navigation. No overlay; the page's own
      // short entrance handles it.
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
      if (!isPageChange(window.location.pathname, url.pathname)) return; // same page, hash, query, admin
      if (prefersReduced()) return;

      const full = url.pathname + url.search + url.hash;
      if (st.phase === 'closing') {
        e.preventDefault();
        st.target = full; // latest destination wins
        return;
      }
      if (st.phase === 'covered' || st.phase === 'light') {
        e.preventDefault(); // duplicate click while running
        return;
      }
      if (st.phase === 'opening') return; // the page is already usable: navigate normally

      e.preventDefault();
      if (isMajor(url.pathname)) startClose(full);
      else startLight(full);
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
      {/* veil: forest green with a warm amber glow at the centre */}
      <div
        ref={veilRef}
        className="absolute inset-0"
        style={{
          opacity: 0,
          background: `radial-gradient(36% 30% at 50% 48%, ${ABIX.gold25} 0%, transparent 100%), radial-gradient(75% 65% at 50% 45%, ${FOREST.mid} 0%, ${FOREST.deepest} 100%)`,
        }}
      />

      {/* the ABIXMART logo and a fine gold line */}
      <div
        ref={emblemRef}
        className="absolute left-1/2 top-1/2 flex flex-col items-center"
        style={{ transform: 'translate(-50%, -50%)', opacity: 0, visibility: 'hidden' }}
      >
        <img
          src={logoImg}
          alt=""
          draggable={false}
          style={{ width: 'clamp(110px, 22vw, 168px)', height: 'auto', display: 'block' }}
        />
        <span
          ref={lineRef}
          className="block mt-4"
          style={{ width: 'clamp(90px, 18vw, 140px)', height: 1, background: ABIX.gold, transformOrigin: '50% 50%' }}
        />
      </div>

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