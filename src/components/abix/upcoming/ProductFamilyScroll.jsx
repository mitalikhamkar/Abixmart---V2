// src/components/abix/upcoming/ProductFamilyScroll.jsx
//
// "The Living Collection": upcoming products only, in a fixed order.
//
// Desktop: a pinned stage. Every product's visual and text is mounted once;
// the active step is plain state, and a step change only toggles opacity and
// transform (CSS transitions). Because it is state, not a one-shot
// animation, scrolling back up replays every step. The scroll handler runs
// once per frame and updates React only when the step changes.
//
// Mobile, tablet and reduced motion: a compact stacked list. Nothing starts
// hidden in the markup, so content can never get stuck invisible. CHANGED:
// on mobile and tablet the stacked list now animates in as it is scrolled to
// (image clip reveal + staggered fade-and-rise), applied from an effect so
// that reduced motion or a failed animation still shows everything.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { useCatalog } from '@/lib/CatalogContext';
import { ABIX } from '@/components/abix/brandColors';
import Botanical from '@/components/abix/upcoming/livingCollection/Botanicals';
import {
  ConceptualTag,
  FinaleGallery,
  ItemActions,
  ProductImage,
  StatusPill,
} from '@/components/abix/upcoming/livingCollection/CollectionParts';
import { FOCUS_RING, FOREST, pad, textOf } from '@/components/abix/upcoming/livingCollection/theme';

const DESKTOP_QUERY = '(min-width: 1024px)';
const ORDER = ['orthoveda', 'dayaveda', 'triphala', 'ashwagandha'];
const SMOOTH = 'cubic-bezier(0.16, 1, 0.3, 1)';
const STEP_VH = 70; // scroll distance per product

const orderOf = (p) => {
  const i = ORDER.indexOf(p.id);
  return i === -1 ? ORDER.length : i;
};

// Mount only the layout that is needed, so the other one never loads images.
function useIsDesktop() {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return matches;
}

// Transition for opacity + transform. The delay applies only when entering,
// so leaving is immediate and the next step never waits on the previous one.
const move = (active, delay = 0) => {
  const d = active ? delay : 0;
  return `opacity 0.6s ease ${d}s, transform 0.9s ${SMOOTH} ${d}s`;
};

// Hidden steps are visibility:hidden (after their fade-out), which also
// removes their buttons from keyboard focus and screen readers.
const visibility = (active) => ({
  visibility: active ? 'visible' : 'hidden',
  transition: `visibility 0s linear ${active ? 0 : 0.8}s`,
});

const enter = (active, i) => ({
  opacity: active ? 1 : 0,
  transform: active ? 'translate3d(0,0,0)' : 'translate3d(0,14px,0)',
  transition: move(active, 0.1 + i * 0.07),
});

/* ───────────────────────── Desktop: pinned stage ───────────────────────── */

function TextBlock({ item, index, active }) {
  const text = textOf(item);
  return (
    <div style={{ gridArea: '1 / 1', ...visibility(active) }}>
      <p className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold, ...enter(active, 0) }}>
        Chapter {pad(index + 1)}
      </p>
      <div className="mt-4" style={enter(active, 1)}><StatusPill available={false} /></div>
      <h3
        className="mt-4 font-display text-5xl xl:text-6xl leading-[1.02] tracking-tight"
        style={{ color: ABIX.ivory, ...enter(active, 2) }}
      >
        {item.name}
      </h3>
      {item.shortDesc && (
        <p className="mt-3 font-display text-xl xl:text-2xl italic" style={{ color: ABIX.goldLight, ...enter(active, 3) }}>
          {item.shortDesc}
        </p>
      )}
      {text && (
        <p
          className="mt-4 max-w-md text-base leading-relaxed"
          style={{
            color: ABIX.ivory70,
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            ...enter(active, 4),
          }}
        >
          {text}
        </p>
      )}
      <div style={enter(active, 5)}><ItemActions item={item} /></div>
    </div>
  );
}

function FinaleBlock({ count, active }) {
  return (
    <div style={{ gridArea: '1 / 1', ...visibility(active) }}>
      <p className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold, ...enter(active, 0) }}>
        The whole collection
      </p>
      <h3
        className="mt-4 font-display text-5xl xl:text-6xl leading-[1.02] tracking-tight"
        style={{ color: ABIX.ivory, ...enter(active, 1) }}
      >
        One family, growing together.
      </h3>
      <p className="mt-4 max-w-md text-base leading-relaxed" style={{ color: ABIX.ivory70, ...enter(active, 2) }}>
        {count} product{count === 1 ? ' is' : 's are'} still in development.
      </p>
      <div className="mt-8" style={enter(active, 3)}>
        <Link
          to="/shop"
          className={`inline-flex items-center justify-center h-12 px-8 text-[11px] font-semibold tracking-luxe-sm uppercase ${FOCUS_RING}`}
          style={{ background: ABIX.gold, color: FOREST.deepest }}
        >
          Explore the collection
          <span className="ml-3" aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

// One product's layered visual: back silhouette, image panel, gold frame and
// front silhouette. Only opacity and transform change.
function StageScene({ product, index, active }) {
  const flip = index % 2 === 1;
  const radius = flip ? '50% 50% 0 0 / 26% 26% 0 0' : 0;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden={!active}
      style={visibility(active)}
    >
      <div
        className="absolute"
        style={{
          [flip ? 'left' : 'right']: '-6%',
          top: '-8%',
          height: '112%',
          width: '46%',
          color: FOREST.leaf,
          opacity: active ? 0.5 : 0,
          transform: `translate3d(${active ? 0 : flip ? -24 : 24}px,0,0)`,
          transition: move(active),
        }}
      >
        <Botanical variant={index} className="h-full w-full" />
      </div>

      <div
        className="absolute overflow-hidden"
        style={{
          inset: '5% 9%',
          borderRadius: radius,
          background: `linear-gradient(160deg, ${FOREST.moss} 0%, ${FOREST.deepest} 100%)`,
          boxShadow: '0 24px 50px -28px rgba(0,0,0,0.6)',
          opacity: active ? 1 : 0,
          transform: active ? 'translate3d(0,0,0) scale(1)' : 'translate3d(0,18px,0) scale(0.97)',
          transition: move(active, 0.08),
        }}
      >
        <ProductImage product={product} alt={active ? product.name : ''} eager />
        <div className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${FOREST.deepest}B3 0%, transparent 42%)` }} />
        <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 1px ${ABIX.ivory12}` }} />
        <ConceptualTag className="absolute bottom-3 right-4" />
      </div>

      <div
        className="absolute"
        style={{
          inset: '2% 5% 8% 13%',
          border: `1px solid ${ABIX.gold25}`,
          borderRadius: radius,
          opacity: active ? 1 : 0,
          transform: active ? 'translate3d(0,0,0)' : 'translate3d(0,16px,0)',
          transition: move(active, 0.35),
        }}
      />

      <div
        className="absolute"
        style={{
          [flip ? 'right' : 'left']: '1%',
          bottom: '-4%',
          height: '46%',
          width: '20%',
          color: FOREST.lift,
          opacity: active ? 1 : 0,
          transform: active ? 'translate3d(0,0,0)' : 'translate3d(0,32px,0)',
          transition: move(active, 0.2),
        }}
      >
        <Botanical variant={index + 2} className="h-full w-full" />
      </div>
    </div>
  );
}

function FinaleStage({ items, active }) {
  return (
    <div
      className="absolute inset-0 flex items-center"
      aria-hidden={!active}
      style={{
        ...visibility(active),
        pointerEvents: active ? 'auto' : 'none',
        opacity: active ? 1 : 0,
        transform: active ? 'translate3d(0,0,0)' : 'translate3d(0,20px,0)',
        transition: `${move(active, 0.1)}, visibility 0s linear ${active ? 0 : 0.8}s`,
      }}
    >
      {[0, 1, 2].map((v) => (
        <div
          key={v}
          aria-hidden="true"
          className="absolute bottom-0"
          style={{ left: `${v * 33}%`, height: '100%', width: '30%', color: FOREST.leaf, opacity: 0.3 }}
        >
          <Botanical variant={v} className="h-full w-full" />
        </div>
      ))}
      <div className="relative w-full px-2">
        <FinaleGallery items={items} cols={items.length} stagger />
      </div>
    </div>
  );
}

function Pinned({ items }) {
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const steps = items.length + 1; // every product, then the collection finale

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    let raf = 0;

    const update = () => {
      raf = 0;
      const travel = Math.max(1, el.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -el.getBoundingClientRect().top / travel));
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
      const next = Math.min(steps - 1, Math.floor(p * steps));
      if (next !== stepRef.current) {
        stepRef.current = next;
        setStep(next);
      }
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
  }, [steps]);

  const scrollToStep = useCallback(
    (i) => {
      const el = trackRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const travel = el.offsetHeight - window.innerHeight;
      window.scrollTo({ top: top + ((i + 0.5) / steps) * travel, behavior: 'smooth' });
    },
    [steps]
  );

  const isFinale = step >= items.length;

  return (
    <div ref={trackRef} className="relative" style={{ height: `calc(${steps - 1} * ${STEP_VH}vh + 100vh)` }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(55% 55% at 68% 48%, ${FOREST.glow} 0%, transparent 70%)` }}
        />
        <div
          ref={barRef}
          aria-hidden="true"
          className="absolute left-0 top-0 h-px w-full origin-left"
          style={{ transform: 'scaleX(0)', background: ABIX.gold, willChange: 'transform' }}
        />

        <div className="relative mx-auto h-full max-w-7xl px-10 grid grid-cols-12 gap-12 items-center">
          <div className="col-span-5">
            <p className="font-grotesk text-xs tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
              {pad(step + 1)} / {pad(steps)}
            </p>
            <div className="mt-6 grid" aria-live="polite">
              {items.map((p, i) => (
                <TextBlock key={p.id} item={p} index={i} active={step === i} />
              ))}
              <FinaleBlock count={items.length} active={isFinale} />
            </div>
          </div>

          <div className="col-span-7">
            <div className="relative h-[62vh] min-h-[380px] w-full">
              {items.map((p, i) => (
                <StageScene key={p.id} product={p} index={i} active={step === i} />
              ))}
              <FinaleStage items={items} active={isFinale} />
            </div>

            <nav aria-label="Collection chapters" className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              {[...items.map((p) => p.name), 'The collection'].map((label, i) => {
                const on = i === step;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => scrollToStep(i)}
                    aria-current={on ? 'step' : undefined}
                    className={`pb-1 text-sm transition-colors duration-300 border-b ${FOCUS_RING}`}
                    style={{ color: on ? ABIX.ivory : ABIX.ivory45, borderColor: on ? ABIX.gold : 'transparent' }}
                  >
                    <span className="mr-2 font-grotesk text-[10px] tracking-luxe-sm" style={{ color: ABIX.gold }}>
                      {pad(i + 1)}
                    </span>
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── Mobile, tablet and reduced motion: stacked ───────────── */

// data-m-image = image box (clip reveal), data-reveal = fade-and-rise.
// Both are only acted on by the effect in <Stacked>.
function MobileItem({ item, index, total }) {
  const text = textOf(item);
  return (
    <article id={`lc-item-${item.id}`} className="relative scroll-mt-24">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{ right: '-3%', top: '-6%', height: '55%', width: '30%', color: FOREST.leaf, opacity: 0.45 }}
        >
          <Botanical variant={index} className="h-full w-full" />
        </div>
        <div
          data-m-image
          className="relative overflow-hidden"
          style={{
            aspectRatio: '1 / 1',
            background: `linear-gradient(160deg, ${FOREST.moss} 0%, ${FOREST.deepest} 100%)`,
            boxShadow: `inset 0 0 0 1px ${ABIX.ivory12}`,
          }}
        >
          <ProductImage product={item} alt={item.name} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(0deg, ${FOREST.deepest}CC 0%, transparent 50%)` }} />
          <ConceptualTag className="absolute bottom-3 right-4" />
        </div>
      </div>

      <div className="mt-5">
        <p data-reveal className="font-grotesk text-xs tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
          {pad(index + 1)} / {pad(total)}
        </p>
        <div data-reveal className="mt-2"><StatusPill available={false} /></div>
        <h3 data-reveal className="mt-2 font-display text-4xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
          {item.name}
        </h3>
        {item.shortDesc && (
          <p data-reveal className="mt-2 font-display text-xl italic" style={{ color: ABIX.goldLight }}>{item.shortDesc}</p>
        )}
        {text && <p data-reveal className="mt-3 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>{text}</p>}
        <div data-reveal><ItemActions item={item} /></div>
      </div>
    </article>
  );
}

function Stacked({ items, reduce }) {
  const rootRef = useRef(null);

  const jump = (id) => {
    const el = document.getElementById(`lc-item-${id}`);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  // Scroll reveals for phones and tablets. Skipped for reduced motion.
  useGSAP(
    (context) => {
      if (reduce) return;
      gsap.utils.toArray(context.selector('[data-m-image]')).forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.1,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });
      context.selector('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          }
        );
      });
    },
    { scope: rootRef, dependencies: [reduce, items.length], revertOnUpdate: true }
  );

  return (
    <div ref={rootRef} className="mx-auto max-w-7xl px-6 sm:px-10" style={{ overflowX: 'clip' }}>
      <nav aria-label="Collection chapters" data-reveal className="-mx-6 px-6 sm:mx-0 sm:px-0 mb-8 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {items.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => jump(p.id)}
            className={`shrink-0 h-11 px-4 border text-xs ${FOCUS_RING}`}
            style={{ borderColor: ABIX.ivory25, color: ABIX.ivory70 }}
          >
            <span className="mr-2 font-grotesk text-[10px]" style={{ color: ABIX.gold }}>{pad(i + 1)}</span>
            {p.name}
          </button>
        ))}
      </nav>

      <div className="grid gap-14 md:grid-cols-2 md:gap-x-10">
        {items.map((p, i) => (
          <MobileItem key={p.id} item={p} index={i} total={items.length} />
        ))}
      </div>

      <div className="mt-16">
        <p data-reveal className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>The whole collection</p>
        <h3 data-reveal className="mt-3 font-display text-4xl leading-[1.05] tracking-tight" style={{ color: ABIX.ivory }}>
          One family, growing together.
        </h3>
        <p data-reveal className="mt-3 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
          {items.length} product{items.length === 1 ? ' is' : 's are'} still in development.
        </p>
        <div data-reveal>
          <Link
            to="/shop"
            className={`mt-8 inline-flex items-center justify-center h-12 px-8 text-[11px] font-semibold tracking-luxe-sm uppercase ${FOCUS_RING}`}
            style={{ background: ABIX.gold, color: FOREST.deepest }}
          >
            Explore the collection
            <span className="ml-3" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Entry point ─────────────────────────────── */

export default function ProductFamilyScroll() {
  const { comingSoonProducts } = useCatalog();
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();

  // Upcoming products only, in the requested order (Shilajit is featured
  // elsewhere on the homepage). Anything not in ORDER follows, by catalog order.
  const items = useMemo(
    () => [...comingSoonProducts].sort((a, b) => orderOf(a) - orderOf(b)),
    [comingSoonProducts]
  );

  if (items.length === 0) return null;

  return isDesktop && !reduce ? <Pinned items={items} /> : <Stacked items={items} reduce={Boolean(reduce)} />;
}