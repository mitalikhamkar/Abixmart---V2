// src/components/abix/ShilajitShowcase.jsx
//
// Shilajit showcase: a self-playing sequence, NOT scroll-driven.
//
// 'wide' (desktop): plays once when the section comes into view.
//   heading + arch open, jar rises to the centre → benefits pop up one by
//   one around it → they leave, the jar glides left → pack options reveal.
//
// 'compact' (phones and tablets): the same story, built for a narrow screen.
//   heading + arch open → benefits appear one by one in a fixed-height slot
//   under the jar (ending on the product facts) → the pack options reveal
//   one by one as they are scrolled to.
//
// 'static' (reduced motion): everything visible, no animation.
//
// Content is visible by default. Animation only hides things from inside the
// effect, so a GSAP failure can never leave the section blank.
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { useReducedMotion } from 'framer-motion';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useCatalog } from '@/lib/CatalogContext';
import { useShop } from '@/lib/ShopContext';
import { featuredProduct, productBenefits } from '@/data/products';
import showcaseBg from '@/assets/home/productShowcase_bg.png';
import jarImg from '@/assets/home/products/shilajit-jar-cutout.png';
import LeafShadow from '@/components/abix/home/LeafShadow';
import { FOREST, FOCUS_RING, pad } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from './brandColors';

const DESKTOP_QUERY = '(min-width: 1024px)';
const ARCH = '50% 50% 0 0 / 34% 34% 0 0';
const SLUG = 'shilajit';
const WIDE_GAP = 0.85; // seconds between benefit pop-ups (desktop)
const COMPACT_GAP = 1.5; // seconds each benefit stays (mobile)
const money = (n) => Number(n).toLocaleString('en-IN');

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

/* ───────────────────────────── Pieces ───────────────────────────── */

function Heading() {
  return (
    <div className="text-center">
      <p
        data-head
        className="inline-flex items-center gap-2 font-grotesk text-[11px] uppercase tracking-luxe-sm"
        style={{ color: ABIX.gold }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: ABIX.gold }} />
        Available now
      </p>
      <h2
        data-head
        id="shilajit-title"
        className="mt-4 font-display text-4xl sm:text-5xl xl:text-6xl leading-[1.05] tracking-tight"
        style={{ color: ABIX.ivory }}
      >
        ABIXMART Himalayan Shilajit
      </h2>
      <p data-head className="mt-3 font-display text-xl xl:text-2xl italic" style={{ color: ABIX.goldLight }}>
        {featuredProduct.tagline}
      </p>
    </div>
  );
}

function Visual({ r, className = '', style }) {
  return (
    <div ref={r.arch} className={`relative ${className}`} style={style}>
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

// Desktop: placed around the centred jar.
function Benefit({ item, index, side }) {
  const right = side === 'r';
  return (
    <div
      data-benefit
      data-i={index}
      data-side={side}
      className={`max-w-[260px] ${right ? 'text-left' : 'ml-auto text-right'}`}
    >
      <span className="font-grotesk text-[10px] tracking-luxe-sm" style={{ color: ABIX.gold }}>
        {pad(index + 1)}
      </span>
      <h3 className="mt-1 font-display text-2xl leading-tight" style={{ color: ABIX.ivory }}>
        {item.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
        {item.body}
      </p>
    </div>
  );
}

// Mobile / tablet: one at a time, in the slot under the jar.
function BenefitCompact({ item, index, total }) {
  return (
    <div data-benefit data-i={index} className="text-center max-w-sm mx-auto">
      <span className="font-grotesk text-[10px] tracking-luxe-sm" style={{ color: ABIX.gold }}>
        {pad(index + 1)} / {pad(total)}
      </span>
      <h3 className="mt-1.5 font-display text-3xl leading-tight" style={{ color: ABIX.ivory }}>
        {item.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
        {item.body}
      </p>
    </div>
  );
}

function FactsFinal() {
  const picks = featuredProduct.facts.filter((f) => ['Origin', 'Form', 'Net Weight'].includes(f.label));
  return (
    <div data-final data-i={99} className="text-center max-w-sm mx-auto">
      <span className="font-grotesk text-[10px] tracking-luxe-sm" style={{ color: ABIX.gold }}>
        In every jar
      </span>
      <p className="mt-2 font-display text-2xl leading-snug" style={{ color: ABIX.ivory }}>
        {picks.map((f) => f.value).join(' · ')}
      </p>
    </div>
  );
}

function PackPanel({ product, variants, activeId, setSelectedId, loading, onAdd, status }) {
  const currency = product?.currency || featuredProduct.currency;
  const chosen = variants.find((v) => v.id === activeId);
  const price = chosen ? chosen.price : product?.price ?? featuredProduct.price;
  const saving = chosen && chosen.originalPrice > chosen.price ? chosen.originalPrice - chosen.price : 0;
  const canBuy = Boolean(product) && !loading && product.status === 'available';

  return (
    <div>
      <p data-panel-part className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
        Choose your pack
      </p>
      <div data-panel-part className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-price text-5xl leading-none" style={{ color: ABIX.ivory }}>
          {currency}{money(price)}
        </span>
        {saving > 0 && (
          <span className="text-sm" style={{ color: ABIX.goldLight }}>
            You save {currency}{money(saving)}
          </span>
        )}
      </div>

      {variants.length > 0 && (
        <div role="radiogroup" aria-label="Pack size" className="mt-6 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
          {variants.map((v) => {
            const sel = v.id === activeId;
            return (
              <button
                key={v.id}
                data-panel-part
                type="button"
                role="radio"
                aria-checked={sel}
                onClick={() => setSelectedId(v.id)}
                className={`text-left border px-2.5 sm:px-3 py-4 transition-colors duration-300 ${FOCUS_RING}`}
                style={{
                  borderColor: sel ? ABIX.gold : ABIX.ivory25,
                  background: sel ? ABIX.gold15 : 'transparent',
                }}
              >
                <span
                  className="block text-[10px] font-semibold uppercase tracking-luxe-sm break-words"
                  style={{ color: sel ? ABIX.ivory : ABIX.ivory70 }}
                >
                  {v.name}
                </span>
                {v.jars > 0 && (
                  <span className="mt-1 block text-xs" style={{ color: ABIX.ivory45 }}>
                    {v.jars} {v.jars === 1 ? 'jar' : 'jars'}
                  </span>
                )}
                <span className="mt-2 block font-price text-base sm:text-lg" style={{ color: ABIX.ivory }}>
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

      <div data-panel-part className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
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
          className={`inline-flex items-center min-h-[44px] text-[11px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline ${FOCUS_RING}`}
          style={{ color: ABIX.goldLight }}
        >
          View full details →
        </Link>
      </div>

      <p
        data-panel-part
        className="mt-4 min-h-[1.25rem] text-sm"
        role="status"
        aria-live="polite"
        style={{ color: ABIX.ivory70 }}
      >
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

/* ───────────────────────────── Section ───────────────────────────── */

export default function ShilajitShowcase() {
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const mode = reduce ? 'static' : isDesktop ? 'wide' : 'compact';

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const panelRef = useRef(null);
  const benefitsRef = useRef(null);
  const slotRef = useRef(null);
  const skipRef = useRef(null);
  const tlRef = useRef(null);
  const archRef = useRef(null);
  const frameRef = useRef(null);
  const innerRef = useRef(null);
  const jarRef = useRef(null);
  const timerRef = useRef(null);

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
      if (mode === 'static') return;
      if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

      const head = context.selector('[data-head]');
      const panelParts = context.selector('[data-panel-part]');
      const inner = innerRef.current;
      if (!inner) return;

      /* ───── Desktop: self-playing sequence ───── */
      if (mode === 'wide') {
        const arch = archRef.current;
        const stage = stageRef.current;
        const panel = panelRef.current;
        const layer = benefitsRef.current;
        if (!arch || !stage || !panel || !layer) return;

        const benefits = gsap.utils
          .toArray(context.selector('[data-benefit]'))
          .sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));

        // Where the arch ends up (left column) vs where it starts (stage centre).
        gsap.set(arch, { x: 0 });
        const sr = stage.getBoundingClientRect();
        const ar = arch.getBoundingClientRect();
        const offset = sr.left + sr.width / 2 - (ar.left + ar.width / 2);

        gsap.set(arch, { x: offset });
        gsap.set(inner, { clipPath: 'inset(100% 0% 0% 0%)' });
        gsap.set(frameRef.current, { autoAlpha: 0, scale: 0.96 });
        gsap.set(jarRef.current, { autoAlpha: 0, y: 36, scale: 0.94 });
        gsap.set(head, { autoAlpha: 0, y: 24 });
        gsap.set(panelParts, { autoAlpha: 0, y: 20 });
        gsap.set(panel, { autoAlpha: 0 });
        if (skipRef.current) gsap.set(skipRef.current, { autoAlpha: 0 });

        const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
        tlRef.current = tl;

        tl.to(head, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0)
          .to(inner, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' }, 0.2)
          .to(frameRef.current, { autoAlpha: 1, scale: 1, duration: 1 }, 0.7)
          .to(jarRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 1 }, 0.9);
        if (skipRef.current) tl.to(skipRef.current, { autoAlpha: 1, duration: 0.4 }, 1.3);

        const start = 2.1;
        benefits.forEach((el, i) => {
          const dir = el.dataset.side === 'r' ? 1 : -1;
          tl.fromTo(
            el,
            { autoAlpha: 0, x: dir * -28, scale: 0.92 },
            { autoAlpha: 1, x: 0, scale: 1, duration: 0.6, ease: 'back.out(1.5)' },
            start + i * WIDE_GAP
          );
        });
        tl.to(jarRef.current, { scale: 1.04, duration: benefits.length * WIDE_GAP, ease: 'sine.inOut' }, start);

        const end = start + benefits.length * WIDE_GAP + 0.9;
        tl.to(benefits, { autoAlpha: 0, y: -12, duration: 0.5, stagger: 0.05, ease: 'power2.in' }, end);
        if (skipRef.current) tl.to(skipRef.current, { autoAlpha: 0, duration: 0.3 }, end);
        tl.to(jarRef.current, { scale: 1, duration: 1.2, ease: 'power2.inOut' }, end + 0.2)
          .to(arch, { x: 0, duration: 1.3, ease: 'power3.inOut' }, end + 0.35);

        tl.set(panel, { autoAlpha: 1 }, end + 0.9)
          .to(panelParts, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12 }, end + 0.9);

        ScrollTrigger.create({
          trigger: rootRef.current,
          start: 'top 60%',
          once: true,
          onEnter: () => tl.play(),
        });
        return;
      }

      /* ───── Phones & tablets: compact sequence ───── */
      const slot = slotRef.current;
      if (!slot) return;
      const items = gsap.utils
        .toArray(slot.children)
        .sort((a, b) => Number(a.dataset.i) - Number(b.dataset.i));
      const gap = COMPACT_GAP;

      // All items share one cell, so the slot never changes height.
      gsap.set(slot, { minHeight: '10.5rem', alignContent: 'center' });
      gsap.set(items, { gridArea: '1 / 1', autoAlpha: 0, y: 16 });
      gsap.set(inner, { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(frameRef.current, { autoAlpha: 0, scale: 0.96 });
      gsap.set(jarRef.current, { autoAlpha: 0, y: 30, scale: 0.94 });
      gsap.set(head, { autoAlpha: 0, y: 22 });
      if (skipRef.current) gsap.set(skipRef.current, { autoAlpha: 0 });

      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
      tlRef.current = tl;

      tl.to(head, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1 }, 0)
        .to(inner, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, 0.15)
        .to(frameRef.current, { autoAlpha: 1, scale: 1, duration: 0.9 }, 0.6)
        .to(jarRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9 }, 0.8);
      if (skipRef.current) tl.to(skipRef.current, { autoAlpha: 1, duration: 0.4 }, 1.2);

      const first = 1.6;
      items.forEach((el, i) => {
        const at = first + i * gap;
        const last = i === items.length - 1;
        tl.to(el, { autoAlpha: 1, y: 0, duration: 0.6 }, at);
        if (!last) tl.to(el, { autoAlpha: 0, y: -12, duration: 0.35, ease: 'power2.in' }, at + gap - 0.35);
      });
      if (skipRef.current) tl.to(skipRef.current, { autoAlpha: 0, duration: 0.3 }, first + (items.length - 1) * gap);

      // Starts once the whole slot is on screen, so nothing plays off-screen.
      ScrollTrigger.create({
        trigger: slot,
        start: 'bottom 92%',
        once: true,
        onEnter: () => tl.play(),
      });

      // Pack options: revealed one by one as they are scrolled to.
      gsap.set(panelParts, { autoAlpha: 0, y: 22 });
      ScrollTrigger.batch(panelParts, {
        start: 'top 92%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', overwrite: true }),
      });
    },
    { scope: rootRef, dependencies: [mode], revertOnUpdate: true }
  );

  const skip = () => tlRef.current?.progress(1);
  const visualRefs = { arch: archRef, frame: frameRef, inner: innerRef, jar: jarRef };
  const pack = { product, variants, activeId, setSelectedId, loading, onAdd: handleAdd, status };
  const left = productBenefits.filter((_, i) => i % 2 === 0);
  const right = productBenefits.filter((_, i) => i % 2 === 1);

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
      {/* dusk glow along the bottom edge: the colour transition into pre-orders */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[45vh] pointer-events-none"
        style={{ background: `radial-gradient(70% 100% at 50% 100%, ${ABIX.gold15} 0%, transparent 70%)` }}
      />

      {mode === 'wide' ? (
        <div className="relative">
          <LeafShadow side="left" opacity={0.06} />
          <div className="relative z-[1] mx-auto max-w-7xl px-10 pt-28 pb-14">
            <Heading />

            <div
              ref={stageRef}
              className="relative mt-10 grid grid-cols-2 items-center gap-10"
              style={{ minHeight: 'clamp(420px, 62vh, 600px)' }}
            >
              <div className="flex justify-center">
                <Visual r={visualRefs} style={{ height: 'clamp(380px, 56vh, 540px)', aspectRatio: '3 / 4' }} />
              </div>

              <div ref={panelRef}>
                <PackPanel {...pack} />
              </div>

              {/* benefits around the centred jar (decorative layer, never blocks clicks) */}
              <div ref={benefitsRef} className="absolute inset-0 pointer-events-none">
                <div className="absolute left-0 top-0 bottom-0 w-[30%] flex flex-col justify-around">
                  {left.map((b, k) => (
                    <Benefit key={b.key} item={b} index={k * 2} side="l" />
                  ))}
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-[30%] flex flex-col justify-around">
                  {right.map((b, k) => (
                    <Benefit key={b.key} item={b} index={k * 2 + 1} side="r" />
                  ))}
                </div>
              </div>

              <div className="absolute inset-x-0 -bottom-2 flex justify-center pointer-events-none">
                <button
                  ref={skipRef}
                  type="button"
                  onClick={skip}
                  className={`pointer-events-auto px-3 py-1 text-[10px] uppercase tracking-luxe-sm underline-offset-4 hover:underline ${FOCUS_RING}`}
                  style={{ color: ABIX.ivory45 }}
                >
                  Skip intro
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <LeafShadow side="right" opacity={0.06} className="inset-x-0 top-0 h-[60vh]" />
          <div className="relative z-[1] mx-auto max-w-xl md:max-w-2xl px-6 pt-24 pb-20 md:pb-24">
            <Heading />

            <div className="mt-8 flex justify-center">
              <Visual r={visualRefs} className="w-[13.5rem] sm:w-[16rem] aspect-[3/4]" />
            </div>

            {/* Benefit slot. Without JS (or with reduced motion) this is a plain list. */}
            <div ref={slotRef} className="mt-10 grid gap-8">
              {productBenefits.map((b, i) => (
                <BenefitCompact key={b.key} item={b} index={i} total={productBenefits.length} />
              ))}
              <FactsFinal />
            </div>

            {mode === 'compact' && (
              <div className="mt-2 flex justify-center">
                <button
                  ref={skipRef}
                  type="button"
                  onClick={skip}
                  className={`min-h-[44px] px-4 text-[10px] uppercase tracking-luxe-sm underline-offset-4 hover:underline ${FOCUS_RING}`}
                  style={{ color: ABIX.ivory45 }}
                >
                  Skip intro
                </button>
              </div>
            )}

            <div className="mt-10">
              <PackPanel {...pack} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}