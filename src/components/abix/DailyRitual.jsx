// src/components/abix/DailyRitual.jsx
import React, { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

import heroFrame from '@/assets/HowToUse/Hero ritual frame.png';
import resinIntoWaterImg from '@/assets/HowToUse/Resin into warm water.png';
import stirDrinkImg from '@/assets/HowToUse/STIR & DRINK.png';
import morningToNightImg from '@/assets/HowToUse/Morning to night.png';

/**
 * "How to Take Shilajit" — a vertical, scroll-driven editorial story.
 * Not a boxed video-like carousel, not a card grid.
 *
 * ONLY FOUR IMAGES ARE IMPORTED ABOVE. There is no fifth "spoon" asset
 * anywhere in this file — grep for "Spoon" and you get zero matches.
 *
 * PERFORMANCE / FLICKER NOTE (read before changing this file again):
 * Each chapter's image is a *permanent* image, not a slide that gets
 * swapped — so "the transition" is really "the reveal of a specific
 * image, at a specific scroll position." Two bugs used to combine to
 * cause visible flicker/late pop-in:
 *   1. The image itself hadn't finished downloading by the time its
 *      reveal point was reached.
 *   2. The "hidden" starting state (clipped, scaled up, dimmed) was
 *      being applied by gsap.set() *inside* useGSAP, which only runs
 *      after the browser's first paint. That means the browser would
 *      briefly paint the image at full size/opacity, THEN GSAP would
 *      snap it back to hidden, THEN reveal it — a visible double-flip.
 * This version fixes both:
 *   - The hidden starting state is baked directly into the JSX `style`
 *     prop, so it's correct from the very first rendered frame. GSAP
 *     only ever animates forward from a state that was already right.
 *   - Scroll-ahead preloading: each chapter's image starts fetching
 *     while the *previous* chapter is still on screen, well before its
 *     own reveal point.
 *   - The reveal animation is gated on `img.complete` — if the image is
 *     already cached (the normal case, thanks to preloading) it plays
 *     instantly; if a user scrolls unusually fast it waits for the
 *     `load` event and then plays, instead of animating over a blank box.
 * If you change these images, keep this contract: no image gets
 * revealed with GSAP before it exists in the browser's cache, and the
 * pre-reveal visual state always lives in the JSX style, not in a
 * gsap.set() that runs after paint.
 *
 * A fixed `aspect-ratio` box (ASPECT_RATIO below) reserves layout space
 * before the image loads, so there is never a blank gap or layout jump.
 * OBJECT_POSITION lets you nudge framing per-image if the cover-crop
 * trims something important once checked against the real files.
 *
 * The section's background is one continuous mineral gradient — deep
 * charcoal at the edges, warm stone/graphite at the peak — matching the
 * ABIXMART charcoal/mineral/resin system used on Shop/About/ProductDetail.
 * It never brightens to ivory and never reads as coffee-brown.
 *
 * Mobile has its own explicit order (number -> image -> action text),
 * not the desktop split reflowed.
 */
const NARRATION_SRC = null; // TODO: set to the real narration audio file path once available.

const OBJECT_POSITION = {
  take: 'center',
  dissolve: 'center',
  stir: 'center',
  consistency: 'center',
};

// Stable box ratios so the layout never jumps while images load.
// Adjust per-key if a real image's actual ratio causes visible
// cover-cropping of an important detail once checked against the files.
const ASPECT_RATIO = {
  take: '4 / 5',
  dissolve: '4 / 5',
  stir: '4 / 5',
  consistency: '4 / 5',
};

const CHAPTERS = [
  { key: 'take', num: '01', label: 'TAKE', heading: 'Take', line1: 'Start with a pea-sized amount.', line2: '300–500 mg', image: heroFrame, reveal: 'left' },
  { key: 'dissolve', num: '02', label: 'DISSOLVE', heading: 'Dissolve', line1: 'Dissolve in warm water or milk.', line2: '100–150 ml', image: resinIntoWaterImg, reveal: 'bottom' },
  { key: 'stir', num: '03', label: 'STIR & DRINK', heading: 'Stir & Drink', line1: 'Stir well and drink.', line2: 'Once or twice daily', image: stirDrinkImg, reveal: 'right' },
  { key: 'consistency', num: '04', label: 'CONSISTENCY', heading: 'Make it part of your routine', line1: 'Morning or night.', line2: 'Stay consistent for 8–12 weeks.', image: morningToNightImg, reveal: 'left' },
];

const CLIP_FROM = {
  left: 'inset(0 0 0 100%)',
  right: 'inset(0 100% 0 0)',
  bottom: 'inset(100% 0 0 0)',
};

// Initial inline styles for the animated text elements — baked in here
// (not via gsap.set on mount) so there is zero gap between first paint
// and the "hidden" state.
const textStartStyle = (axis, offsetPx) => ({
  opacity: 0,
  transform: axis === 'y' ? `translateY(${offsetPx}px)` : `translateX(${offsetPx}px)`,
});

export default function DailyRitual() {
  const [audioOn, setAudioOn] = useState(false);
  const audioRef = useRef(null);

  const storyRef = useRef(null);
  const railFillRef = useRef(null);
  const railGlowRef = useRef(null);
  const railDotRefs = useRef(CHAPTERS.map(() => React.createRef()));
  const railLabelRefs = useRef(CHAPTERS.map(() => React.createRef()));

  const chapterRefs = useRef(CHAPTERS.map(() => React.createRef()));
  const imageRefs = useRef(CHAPTERS.map(() => React.createRef())); // wrapper div (animated)
  const imgElRefs = useRef(CHAPTERS.map(() => React.createRef())); // actual <img> (load-checked)
  const numRefs = useRef(CHAPTERS.map(() => React.createRef()));
  const headingRefs = useRef(CHAPTERS.map(() => React.createRef()));
  const line1Refs = useRef(CHAPTERS.map(() => React.createRef()));
  const line2Refs = useRef(CHAPTERS.map(() => React.createRef()));

  const preloadedRef = useRef(new Set());

  const preloadImage = (index) => {
    if (index < 0 || index >= CHAPTERS.length) return;
    if (preloadedRef.current.has(index)) return;
    preloadedRef.current.add(index);
    const img = new Image();
    img.src = CHAPTERS[index].image;
  };

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Chapter 2's image is likely to be seen soon after the hero loads,
      // regardless of scroll speed — warm it immediately, don't wait for
      // scroll position.
      preloadImage(1);

      if (reduceMotion) {
        gsap.set(
          [
            ...imageRefs.current.map((r) => r.current),
            ...numRefs.current.map((r) => r.current),
            ...headingRefs.current.map((r) => r.current),
            ...line1Refs.current.map((r) => r.current),
            ...line2Refs.current.map((r) => r.current),
          ].filter(Boolean),
          { opacity: 1, x: 0, y: 0, scale: 1, clearProps: 'transform', clipPath: 'inset(0 0 0 0)' }
        );
        railDotRefs.current.forEach((r) => r.current && gsap.set(r.current, { opacity: 1 }));
        railLabelRefs.current.forEach((r) => r.current && gsap.set(r.current, { opacity: 0.85 }));
        if (railFillRef.current) gsap.set(railFillRef.current, { height: '100%' });
        if (railGlowRef.current) gsap.set(railGlowRef.current, { opacity: 0 });
        CHAPTERS.forEach((_, i) => preloadImage(i));
        return;
      }

      // ---- overall scroll-scrubbed "ritual thread" (no pin — purely observational) ----
      if (railFillRef.current) {
        gsap.set(railFillRef.current, { height: '0%' });
        gsap.set(railGlowRef.current, { top: '0%' });
        gsap.timeline({
          scrollTrigger: {
            trigger: storyRef.current,
            start: 'top center',
            end: 'bottom center',
            scrub: true,
          },
        })
          .to(railFillRef.current, { height: '100%', ease: 'none' }, 0)
          .to(railGlowRef.current, { top: '100%', ease: 'none' }, 0);
      }

      // ---- per-chapter entrance, each independent, none pinned ----
      CHAPTERS.forEach((chapter, i) => {
        const chapterEl = chapterRefs.current[i].current;
        const img = imageRefs.current[i].current;
        const imgEl = imgElRefs.current[i].current;
        const num = numRefs.current[i].current;
        const heading = headingRefs.current[i].current;
        const line1 = line1Refs.current[i].current;
        const line2 = line2Refs.current[i].current;
        const dot = railDotRefs.current[i].current;
        const label = railLabelRefs.current[i].current;

        // NOTE: no gsap.set() for img/num/heading/line1/line2 here — their
        // hidden starting state is already correct from the JSX `style`
        // prop on first paint (see textStartStyle / the image wrapper's
        // inline style below). GSAP only ever animates FORWARD from that
        // state; it never resets anything after paint, so there is no
        // flicker window.
        if (dot) gsap.set(dot, { opacity: 0.3, scale: 1 });
        if (label) gsap.set(label, { opacity: 0.4 });

        // Preload this chapter's image well before it's needed: fire
        // while the *previous* chapter is still comfortably below the
        // fold, giving a full chapter's worth of scroll as lead time
        // before this image's own reveal point.
        if (i > 0) {
          const prevEl = chapterRefs.current[i - 1].current;
          ScrollTrigger.create({
            trigger: prevEl,
            start: 'top 120%',
            once: true,
            onEnter: () => preloadImage(i),
          });
        }

        const playReveal = () => {
          gsap.timeline().to(img, {
            clipPath: 'inset(0 0 0 0)',
            scale: 1,
            opacity: 1,
            duration: 1.2,
            ease: 'power3.out',
          });
        };

        // Image reveal — plays once, but only once the image is actually
        // ready. If it's already cached (the normal case, thanks to the
        // preloading above), it plays immediately with no gap. If a user
        // scrolls unusually fast and it's not ready yet, we wait for the
        // `load` event instead of animating over a blank/placeholder box.
        ScrollTrigger.create({
          trigger: chapterEl,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            if (!imgEl || imgEl.complete) {
              playReveal();
            } else {
              const onLoad = () => {
                playReveal();
                imgEl.removeEventListener('load', onLoad);
              };
              imgEl.addEventListener('load', onLoad);
            }
          },
        });

        // Very subtle continuous parallax drift while the chapter is in view.
        gsap.fromTo(
          img,
          { yPercent: chapter.reveal === 'bottom' ? 3 : -2 },
          {
            yPercent: chapter.reveal === 'bottom' ? -2 : 3,
            ease: 'none',
            scrollTrigger: { trigger: chapterEl, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          }
        );

        // Typography — number, heading and lines move independently, not
        // one flat block; small stagger, one-time as the chapter enters.
        gsap
          .timeline({ scrollTrigger: { trigger: chapterEl, start: 'top 78%', once: true } })
          .to(num, { opacity: 1, y: 0, duration: 0.5 }, 0)
          .to(heading, { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out' }, 0.1)
          .to(line1, { opacity: 1, y: 0, duration: 0.5 }, 0.28)
          .to(line2, { opacity: 1, y: 0, duration: 0.5 }, 0.4);

        // Rail marker: emphasis + a small scale-pulse on the number itself
        // as its chapter becomes active — the "thread" responding to scroll.
        ScrollTrigger.create({
          trigger: chapterEl,
          start: 'top 60%',
          end: 'bottom 40%',
          onEnter: () => {
            if (dot) gsap.to(dot, { opacity: 1, scale: 1.7, duration: 0.4 });
            if (label) gsap.to(label, { opacity: 1, duration: 0.4 });
            gsap.fromTo(num, { scale: 1 }, { scale: 1.12, duration: 0.25, yoyo: true, repeat: 1, ease: 'sine.inOut' });
          },
          onLeave: () => {
            if (dot) gsap.to(dot, { opacity: 0.3, scale: 1, duration: 0.4 });
            if (label) gsap.to(label, { opacity: 0.4, duration: 0.4 });
          },
          onEnterBack: () => {
            if (dot) gsap.to(dot, { opacity: 1, scale: 1.7, duration: 0.4 });
            if (label) gsap.to(label, { opacity: 1, duration: 0.4 });
          },
          onLeaveBack: () => {
            if (dot) gsap.to(dot, { opacity: 0.3, scale: 1, duration: 0.4 });
            if (label) gsap.to(label, { opacity: 0.4, duration: 0.4 });
          },
        });
      });
    },
    { scope: storyRef }
  );

  const toggleAudio = () => {
    setAudioOn((on) => {
      const next = !on;
      const el = audioRef.current;
      if (el && NARRATION_SRC) {
        if (next) {
          el.currentTime = 0;
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      }
      return next;
    });
  };

  return (
    <section
      className="pt-24 pb-24 lg:pt-32 lg:pb-40"
      style={{
        background:
          'linear-gradient(180deg, #151417 0%, #1E1C1F 28%, #322E2C 55%, #1E1C1F 100%)',
      }}
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        {/* Intro */}
        <div className="max-w-2xl mb-20 lg:mb-28">
          <span className="block font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm text-gold-light">How To Use</span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl text-ivory leading-[1.02] tracking-tight">
            How to Take Shilajit
          </h2>
          <p className="mt-5 text-ivory/65 text-lg leading-relaxed">A simple ritual, step by step.</p>

          <audio ref={audioRef} src={NARRATION_SRC || undefined} preload="none" />
          <button
            onClick={toggleAudio}
            className="mt-6 inline-flex items-center gap-2 font-grotesk text-[11px] uppercase tracking-luxe-sm text-ivory/50 hover:text-ivory transition-colors duration-300"
          >
            {audioOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
            Listen to the guide
          </button>
        </div>

        {/* Story */}
        <div ref={storyRef} className="relative">
          {/* Ritual thread — desktop only */}
          <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px bg-ivory/15">
            <div ref={railFillRef} className="absolute top-0 left-0 w-full bg-gold-light origin-top" />
            <div
              ref={railGlowRef}
              className="absolute left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-light blur-[6px]"
            />
          </div>
          <div className="hidden lg:flex flex-col absolute left-0 top-0 bottom-0 justify-between -translate-x-1/2 pointer-events-none">
            {CHAPTERS.map((c, i) => (
              <div key={c.num} className="flex items-center gap-3">
                <span ref={railDotRefs.current[i]} className="w-1.5 h-1.5 rounded-full bg-gold-light shrink-0" />
                <span
                  ref={railLabelRefs.current[i]}
                  className="font-grotesk text-[10px] uppercase tracking-luxe-sm text-ivory/60 whitespace-nowrap"
                >
                  {c.num} · {c.label}
                </span>
              </div>
            ))}
          </div>

          <div className="lg:pl-40 space-y-24 lg:space-y-36">
            {CHAPTERS.map((chapter, i) => {
              const imageFirstDesktop = i % 2 === 1; // alternating editorial rhythm on desktop
              const headingOffset = chapter.reveal === 'right' ? 24 : -24;

              return (
                <div key={chapter.num} ref={chapterRefs.current[i]} className="relative">
                  {/* Mobile-only number, sits above the image */}
                  <span className="lg:hidden block font-display text-2xl mb-3 text-gold-light">{chapter.num}</span>

                  <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
                    <div
                      className={`order-2 ${imageFirstDesktop ? 'lg:order-2' : 'lg:order-1'} lg:col-span-5`}
                    >
                      <span
                        ref={numRefs.current[i]}
                        className="hidden lg:block font-display text-3xl leading-none text-gold-light"
                        style={textStartStyle('y', 14)}
                      >
                        {chapter.num}
                      </span>
                      <h3
                        ref={headingRefs.current[i]}
                        className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl leading-tight tracking-tight text-ivory"
                        style={textStartStyle('x', headingOffset)}
                      >
                        {chapter.heading}
                      </h3>
                      <p
                        ref={line1Refs.current[i]}
                        className="mt-4 text-lg leading-relaxed font-body text-ivory/80"
                        style={textStartStyle('y', 16)}
                      >
                        {chapter.line1}
                      </p>
                      <p
                        ref={line2Refs.current[i]}
                        className="mt-1 text-base font-body text-ivory/55"
                        style={textStartStyle('y', 16)}
                      >
                        {chapter.line2}
                      </p>
                    </div>

                    {/* Fixed aspect-ratio box: reserves space before the
                        image loads, so there is never a blank gap or a
                        layout jump. The clipPath/scale/opacity starting
                        state lives right here in inline style — correct
                        from the very first paint, so GSAP never has to
                        "snap back" a state the browser already rendered
                        differently. Stays fully inside its grid track
                        (no negative-margin bleed). */}
                    <div className={`order-1 ${imageFirstDesktop ? 'lg:order-1' : 'lg:order-2'} lg:col-span-7`}>
                      <div
                        ref={imageRefs.current[i]}
                        className="overflow-hidden bg-black/20"
                        style={{
                          aspectRatio: ASPECT_RATIO[chapter.key],
                          clipPath: CLIP_FROM[chapter.reveal],
                          transform: 'scale(1.1)',
                          opacity: 0.4,
                        }}
                      >
                        <img
                          ref={imgElRefs.current[i]}
                          src={chapter.image}
                          alt={chapter.heading}
                          className="w-full h-full block"
                          loading={i === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          fetchPriority={i === 0 ? 'high' : 'auto'}
                          style={{
                            objectFit: 'cover',
                            objectPosition: OBJECT_POSITION[chapter.key],
                            filter: 'saturate(1.02) contrast(1.02)',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}