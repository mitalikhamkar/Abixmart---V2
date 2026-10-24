// src/components/abix/ShilajitShowcase.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from 'framer-motion';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useCatalog } from '@/lib/CatalogContext';
import { useShop } from '@/lib/ShopContext';
import { featuredProduct } from '@/data/products';
import showcaseBg from '@/assets/home/productShowcase_bg.png';
import jarImg from '@/assets/home/products/shilajit-jar-cutout.png';
import LeafShadow from '@/components/abix/home/LeafShadow';
import { FOREST, FOCUS_RING, pad } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from './brandColors';

const DESKTOP_QUERY = '(min-width: 1024px)';
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const STEPS = ['Overview', 'Origin & craft', 'The ritual', 'Choose a pack'];
const TRAVEL_VH = 300; // scroll distance the stage stays pinned
const ARCH = '50% 50% 0 0 / 34% 34% 0 0';
const SLUG = 'shilajit';

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

/* Style helpers: only applied in the pinned layout (`on`). */
const fade = (on, active, i = 0) =>
  on
    ? {
        opacity: active ? 1 : 0,
        transform: active ? 'translate3d(0,0,0)' : 'translate3d(0,14px,0)',
        transition: `opacity 0.6s ease ${active ? 0.1 + i * 0.07 : 0}s, transform 0.9s ${EASE} ${
          active ? 0.1 + i * 0.07 : 0
        }s`,
      }
    : undefined;

const layer = (on, active) =>
  on
    ? {
        gridArea: '1 / 1',
        visibility: active ? 'visible' : 'hidden',
        transition: `visibility 0s linear ${active ? 0 : 0.8}s`,
      }
    : undefined;

const flowAttr = (on) => (on ? {} : { 'data-reveal': '' });

const money = (n) => Number(n).toLocaleString('en-IN');

/* ───────────────────────────── Chapters ───────────────────────────── */

function Overview({ on, active }) {
  return (
    <div style={layer(on, active)} {...flowAttr(on)}>
      <p
        className="inline-flex items-center gap-2 font-grotesk text-[11px] uppercase tracking-luxe-sm"
        style={{ color: ABIX.gold, ...fade(on, active, 0) }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: ABIX.gold }} />
        Available now
      </p>
      <h2
        id="shilajit-title"
        className="mt-5 font-display text-4xl sm:text-5xl xl:text-6xl leading-[1.02] tracking-tight"
        style={{ color: ABIX.ivory, ...fade(on, active, 1) }}
      >
        ABIXMART
        <br />
        Himalayan Shilajit
      </h2>
      <p
        className="mt-4 font-display text-xl xl:text-2xl italic"
        style={{ color: ABIX.goldLight, ...fade(on, active, 2) }}
      >
        {featuredProduct.tagline}
      </p>
      <p
        className="mt-4 max-w-md text-base leading-relaxed"
        style={{ color: ABIX.ivory70, ...fade(on, active, 3) }}
      >
        {featuredProduct.description}
      </p>
    </div>
  );
}

function Facts({ on, active }) {
  return (
    <div style={layer(on, active)} {...flowAttr(on)}>
      <p
        className="font-grotesk text-[11px] uppercase tracking-luxe-sm"
        style={{ color: ABIX.gold, ...fade(on, active, 0) }}
      >
        Origin &amp; craft
      </p>
      <h3
        className="mt-4 font-display text-3xl sm:text-4xl xl:text-5xl leading-[1.05] tracking-tight"
        style={{ color: ABIX.ivory, ...fade(on, active, 1) }}
      >
        Formed over centuries.
        <br />
        Purified with care.
      </h3>
      <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 max-w-md">
        {featuredProduct.facts.map((f, i) => (
          <div
            key={f.label}
            className="border-t pt-3"
            style={{ borderColor: ABIX.ivory12, ...fade(on, active, 2 + i) }}
          >
            <dt className="label-meta" style={{ color: ABIX.gold }}>{f.label}</dt>
            <dd className="mt-1 font-display text-xl" style={{ color: ABIX.ivory }}>{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Ritual({ on, active }) {
  return (
    <div style={layer(on, active)} {...flowAttr(on)}>
      <p
        className="font-grotesk text-[11px] uppercase tracking-luxe-sm"
        style={{ color: ABIX.gold, ...fade(on, active, 0) }}
      >
        The ritual
      </p>
      <h3
        className="mt-4 font-display text-3xl sm:text-4xl xl:text-5xl leading-[1.05] tracking-tight"
        style={{ color: ABIX.ivory, ...fade(on, active, 1) }}
      >
        Once a day. Unhurried.
      </h3>
      <ol className="mt-7 max-w-md space-y-4">
        {featuredProduct.howToUse.map((line, i) => (
          <li key={line} className="flex gap-4" style={fade(on, active, 2 + i)}>
            <span className="font-grotesk text-xs pt-1" style={{ color: ABIX.gold }}>{pad(i + 1)}</span>
            <span className="text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>{line}</span>
          </li>
        ))}
      </ol>
      <div style={fade(on, active, 5)}>
        <Link
          to="/how-to-take-shilajit"
          className={`mt-7 inline-block text-[11px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline ${FOCUS_RING}`}
          style={{ color: ABIX.goldLight }}
        >
          How to take Shilajit →
        </Link>
      </div>
    </div>
  );
}

function PackPanel({
  on, active, product, variants, activeId, setSelectedId, loading, onAdd, status,
}) {
  const currency = product?.currency || featuredProduct.currency;
  const chosen = variants.find((v) => v.id === activeId);
  const price = chosen ? chosen.price : product?.price ?? featuredProduct.price;
  const canBuy = Boolean(product) && !loading && product.status === 'available';

  return (
    <div style={layer(on, active)} {...flowAttr(on)}>
      <p
        className="font-grotesk text-[11px] uppercase tracking-luxe-sm"
        style={{ color: ABIX.gold, ...fade(on, active, 0) }}
      >
        Choose a pack
      </p>
      <p
        className="mt-4 font-price text-5xl leading-none"
        style={{ color: ABIX.ivory, ...fade(on, active, 1) }}
      >
        {currency}{money(price)}
      </p>

      {variants.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Pack size"
          className="mt-6 grid grid-cols-3 gap-3 max-w-lg"
          style={fade(on, active, 2)}
        >
          {variants.map((v) => {
            const sel = v.id === activeId;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setSelectedId(v.id)}
                className={`text-left border px-3 py-3 transition-colors duration-300 ${FOCUS_RING}`}
                style={{
                  borderColor: sel ? ABIX.gold : ABIX.ivory25,
                  background: sel ? ABIX.gold15 : 'transparent',
                }}
              >
                <span
                  className="block text-[10px] font-semibold uppercase tracking-luxe-sm"
                  style={{ color: sel ? ABIX.ivory : ABIX.ivory70 }}
                >
                  {v.name}
                </span>
                <span className="mt-1 block font-price text-base" style={{ color: ABIX.ivory }}>
                  {currency}{money(v.price)}
                </span>
                {v.originalPrice > v.price && (
                  <span className="block text-xs line-through" style={{ color: ABIX.ivory45 }}>
                    {currency}{money(v.originalPrice)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3" style={fade(on, active, 3)}>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canBuy}
          className={`inline-flex items-center justify-center h-12 lg:h-14 px-8 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300 disabled:opacity-40 disabled:pointer-events-none hover:brightness-110 ${FOCUS_RING}`}
          style={{ background: ABIX.ivory, color: FOREST.deepest }}
        >
          {loading ? 'Loading…' : 'Add to cart'}
        </button>
        <Link
          to={`/shop/${product?.slug || SLUG}`}
          className={`text-[11px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline ${FOCUS_RING}`}
          style={{ color: ABIX.goldLight }}
        >
          View full details →
        </Link>
      </div>

      <p className="mt-4 min-h-[1.25rem] text-sm" role="status" aria-live="polite" style={{ color: ABIX.ivory70 }}>
        {status === 'added' && (
          <>
            Added to your cart.{' '}
            <Link to="/cart" className="underline underline-offset-4" style={{ color: ABIX.goldLight }}>
              View cart
            </Link>
          </>
        )}
        {status === 'failed' && "That pack can't be added right now."}
      </p>
    </div>
  );
}

/* ───────────────────────────── Visual ───────────────────────────── */

function Visual({ r, className }) {
  return (
    <div className={`relative ${className}`}>
      <div
        ref={r.frame}
        aria-hidden="true"
        className="absolute -inset-3 pointer-events-none"
        style={{ border: `1px solid ${ABIX.gold25}`, borderRadius: ARCH }}
      />
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: ARCH }}>
        <div
          ref={r.inner}
          className="absolute inset-0"
          style={{ background: `linear-gradient(165deg, ${FOREST.moss} 0%, ${FOREST.deepest} 100%)` }}
        >
          <img
            ref={r.bg}
            src={showcaseBg}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: 0.55 }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(60% 45% at 50% 72%, ${ABIX.gold25} 0%, transparent 70%)` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(0deg, ${FOREST.deepest}99 0%, transparent 45%)` }}
          />
          <div className="absolute inset-x-0 bottom-[9%] flex justify-center">
            <img
              ref={r.jar}
              src={jarImg}
              alt="ABIXMART Himalayan Shilajit jar"
              className="w-[54%] h-auto select-none"
              style={{ filter: 'drop-shadow(0 22px 24px rgba(0,0,0,0.5))' }}
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Section ───────────────────────────── */

export default function ShilajitShowcase() {
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const pinned = isDesktop && !reduce;

  const rootRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const frameRef = useRef(null);
  const innerRef = useRef(null);
  const bgRef = useRef(null);
  const jarRef = useRef(null);
  const timerRef = useRef(null);

  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('idle');

  const { getProductBySlug, loading } = useCatalog();
  const { addToCart } = useShop();
  const product = getProductBySlug(SLUG) || null;
  const variants = product?.variants || [];
  const activeId = variants.some((v) => v.id === selectedId) ? selectedId : variants[0]?.id ?? null;

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleAdd = () => {
    if (!product) return;
    const variant = variants.find((v) => v.id === activeId) || null;
    const ok = addToCart(product.id, 1, variant);
    setStatus(ok ? 'added' : 'failed');
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setStatus('idle'), 4000);
  };

  useGSAP(
    (context) => {
      if (reduce) return;
      const v = { frame: frameRef.current, inner: innerRef.current, bg: bgRef.current, jar: jarRef.current };
      if (!v.inner) return;

      if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

      if (pinned) {
        const track = trackRef.current;
        if (!track) return;

        // Entrance: arched window opens as the section arrives.
        gsap.fromTo(
          v.inner,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.3,
            ease: 'power3.inOut',
            scrollTrigger: { trigger: track, start: 'top 72%', once: true },
          }
        );
        gsap.fromTo(
          v.frame,
          { opacity: 0, scale: 0.96 },
          {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            delay: 0.4,
            ease: 'power2.out',
            scrollTrigger: { trigger: track, start: 'top 72%', once: true },
          }
        );

        // Scrubbed motion while pinned.
        const range = { trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.6 };
        gsap.fromTo(v.jar, { scale: 0.95, yPercent: 3 }, { scale: 1.06, yPercent: -3, ease: 'none', scrollTrigger: range });
        gsap.fromTo(v.bg, { scale: 1.16 }, { scale: 1, ease: 'none', scrollTrigger: range });
        if (barRef.current) {
          gsap.fromTo(barRef.current, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: range });
        }

        // Chapter state (React) follows scroll progress.
        ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            const next = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length));
            setStep((prev) => (prev === next ? prev : next));
          },
        });
        return;
      }

      // Natural-flow layout: one light reveal per block.
      gsap.fromTo(
        v.inner,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: { trigger: v.inner, start: 'top 85%', once: true },
        }
      );
      context.selector('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });
    },
    { scope: rootRef, dependencies: [pinned, reduce], revertOnUpdate: true }
  );

  const scrollToStep = useCallback((i) => {
    const el = trackRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const travel = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + ((i + 0.5) / STEPS.length) * travel, behavior: 'smooth' });
  }, []);

  const visualRefs = { frame: frameRef, inner: innerRef, bg: bgRef, jar: jarRef };
  const pack = {
    product, variants, activeId, setSelectedId, loading, onAdd: handleAdd, status,
  };

  return (
    <section
      id="shilajit"
      ref={rootRef}
      aria-labelledby="shilajit-title"
      className="relative"
      style={{
        background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deep} 8%, ${FOREST.mid} 35%, ${FOREST.moss} 55%, ${FOREST.mid} 75%, ${FOREST.deepest} 100%)`,
      }}
    >
      {/* dusk glow along the bottom edge, the one colour transition into pre-orders */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[45vh] pointer-events-none"
        style={{ background: `radial-gradient(70% 100% at 50% 100%, ${ABIX.gold15} 0%, transparent 70%)` }}
      />

      {pinned ? (
        <div ref={trackRef} className="relative" style={{ height: `${TRAVEL_VH + 100}vh` }}>
          <div className="sticky top-0 h-screen overflow-hidden">
            <LeafShadow side="left" opacity={0.06} />
            <div
              ref={barRef}
              aria-hidden="true"
              className="absolute left-0 bottom-0 h-px w-full origin-left z-10"
              style={{ transform: 'scaleX(0)', background: ABIX.gold }}
            />

            <div className="relative z-[1] mx-auto h-full max-w-7xl px-10 pt-24 pb-10 grid grid-cols-12 gap-12 items-center">
              <div className="col-span-6 flex justify-center">
                <Visual r={visualRefs} className="h-[64vh] min-h-[380px] aspect-[3/4]" />
              </div>

              <div className="col-span-6">
                <p className="font-grotesk text-xs tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>
                  {pad(step + 1)} / {pad(STEPS.length)}
                </p>
                <div className="mt-6 grid">
                  <Overview on active={step === 0} />
                  <Facts on active={step === 1} />
                  <Ritual on active={step === 2} />
                  <PackPanel on active={step === 3} {...pack} />
                </div>

                <nav aria-label="Shilajit chapters" className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
                  {STEPS.map((label, i) => {
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
      ) : (
        <div className="relative">
          <LeafShadow side="right" opacity={0.06} className="inset-x-0 top-0 h-[60vh]" />
          <div className="relative z-[1] mx-auto max-w-xl md:max-w-2xl px-6 py-20 md:py-24">
            <Overview on={false} />
            <div className="mt-14">
              <Visual r={visualRefs} className="mx-auto w-full max-w-[22rem] aspect-[3/4]" />
            </div>
            <div className="mt-16 space-y-16">
              <Facts on={false} />
              <Ritual on={false} />
              <PackPanel on={false} {...pack} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}