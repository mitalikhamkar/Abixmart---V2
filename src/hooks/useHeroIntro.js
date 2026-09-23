import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';

/**
 * Hero intro timeline — runs once when Home mounts, then stops.
 *
 * Sequence:
 *  1. Background settles in.
 *  2. Product fades into a temporary position on the upper-left of the
 *     scene (softer, smaller, blurred) — clear of the text block entirely.
 *  3. Left content reveals while the product waits in that temp spot.
 *  4. Product sweeps in one smooth, continuous diagonal motion from the
 *     left side of the screen down to its final foreground position on
 *     the right, decelerating into a soft landing at the very end.
 *  5. Grounding shadow fades in as it lands. Scroll cue fades in. Done.
 *
 * IMPORTANT: the starting offset is computed from the ACTUAL viewport
 * size at runtime (window.innerWidth/innerHeight), not a percentage of
 * the small product element itself. A percentage of the product's own
 * ~300px width only moved it ~50px — barely a nudge, and it landed the
 * product overlapping the text/CTA area instead of starting from the
 * left side of the screen. Computing from viewport size fixes both the
 * visible travel distance and keeps it correctly responsive on any
 * screen width, recalculated fresh on every mount/refresh.
 *
 * Only two travel stages (not several short stitched ones) with matched
 * easing, so the motion reads as one continuous, smooth sweep rather
 * than a jerky, multi-step animation.
 */
export function useHeroIntro(refs) {
  useGSAP(
    () => {
      const {
        background,
        productWrap,
        productImage,
        productShadow,
        eyebrow,
        headlineLine1,
        headlineLine2,
        description,
        primaryCta,
        secondaryCta,
        scrollHint,
      } = refs;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 1024;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const fadeEls = [
        eyebrow.current,
        description.current,
        primaryCta.current,
        secondaryCta.current,
      ].filter(Boolean);
      const headlineEls = [headlineLine1.current, headlineLine2.current].filter(Boolean);
      const hasProduct = Boolean(productWrap?.current && productImage?.current);

      // ---------------------------------------------------------------
      // Reduced motion: short, simple, accessible reveal.
      // ---------------------------------------------------------------
      if (reduceMotion) {
        gsap.set([background.current, ...fadeEls, scrollHint.current], { opacity: 0 });
        if (hasProduct) {
          gsap.set(productImage.current, { opacity: 0 });
          if (productShadow?.current) gsap.set(productShadow.current, { opacity: 0 });
        }
        const tl = gsap.timeline({ defaults: { ease: 'power1.out', duration: 0.5 } });
        tl.to(background.current, { opacity: 1 }, 0);
        if (hasProduct) {
          tl.to(productImage.current, { opacity: 1 }, 0.1);
          if (productShadow?.current) tl.to(productShadow.current, { opacity: 1 }, 0.1);
        }
        tl.to(fadeEls, { opacity: 1, stagger: 0.06 }, 0.2).to(scrollHint.current, { opacity: 1 }, 0.5);
        return;
      }

      // ---------------------------------------------------------------
      // Full cinematic sequence.
      // ---------------------------------------------------------------
      gsap.set(background.current, { scale: 1.06, opacity: 0 });
      gsap.set(fadeEls, { opacity: 0, y: isMobile ? 16 : 28 });
      gsap.set(headlineEls, { yPercent: 100 }); // yPercent only — never opacity

      gsap.set(scrollHint.current, { opacity: 0 });

      // Starting offset relative to the FINAL position, computed from the
      // real viewport so it's correctly responsive on any screen size:
      //  - desktop: starts well over on the LEFT side of the screen and
      //    higher up, clear of the text block, then sweeps down-right.
      //  - mobile: product already lives in its own dedicated zone above
      //    the text, so it only needs a short, mostly vertical/diagonal
      //    offset — not a full screen-width traversal.
      const startX = isMobile ? 24 : -(vw * 0.46);
      const startY = isMobile ? -32 : -(vh * 0.3);
      const startRotation = isMobile ? -4 : -6;

      if (hasProduct) {
        gsap.set(productWrap.current, { x: startX, y: startY, rotation: startRotation });
        gsap.set(productImage.current, {
          opacity: 0,
          scale: isMobile ? 0.82 : 0.8,
          filter: 'blur(10px)',
          transformOrigin: '50% 65%',
          willChange: 'transform, filter, opacity',
        });
        if (productShadow?.current) {
          gsap.set(productShadow.current, { opacity: 0, scaleX: 0.55 });
        }
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Phase 1 — scene appears.
      tl.to(background.current, { scale: 1, opacity: 1, duration: 0.8 }, 0);

      // Phase 2 — product fades into its temporary position: present,
      // visibly not final — softer, smaller, blurred. It does not move
      // yet, it just becomes visible where it already sits (left/upper,
      // clear of the text).
      if (hasProduct) {
        tl.to(
          productImage.current,
          { opacity: 0.9, scale: isMobile ? 0.88 : 0.86, filter: 'blur(6px)', duration: 0.6 },
          0.15
        );
      }

      // Phase 3 — left content reveals while the product waits.
      const textStart = 0.8;
      tl.to(eyebrow.current, { opacity: 1, y: 0, duration: 0.45 }, textStart)
        .to(headlineLine1.current, { yPercent: 0, duration: 0.55 }, textStart + 0.2)
        .to(headlineLine2.current, { yPercent: 0, duration: 0.55 }, textStart + 0.35)
        .to(description.current, { opacity: 1, y: 0, duration: 0.45 }, textStart + 0.65)
        .to(primaryCta.current, { opacity: 1, y: 0, duration: 0.4 }, textStart + 0.9)
        .to(secondaryCta.current, { opacity: 1, y: 0, duration: 0.4 }, textStart + 1.03);

      // Phase 4 — one smooth, continuous diagonal sweep from the left/
      // upper temp position to the final foreground spot, then a short
      // deceleration into the landing. Two stages sharing the same
      // easing family so the motion reads as one fluid arc, not several
      // stitched moves.
      if (hasProduct) {
        const arcStart = 1.9;
        const mainDuration = isMobile ? 0.9 : 1.35;
        const settleDuration = isMobile ? 0.4 : 0.55;

        // Main sweep — covers ~85% of the journey, smooth ease-in-out so
        // it accelerates gently away from the temp position and starts
        // decelerating before the final stage takes over.
        tl.to(
          productWrap.current,
          { x: startX * 0.14, y: startY * 0.12, rotation: startRotation * 0.15, duration: mainDuration, ease: 'power2.inOut' },
          arcStart
        ).to(
          productImage.current,
          { scale: isMobile ? 0.98 : 0.99, filter: 'blur(1px)', duration: mainDuration, ease: 'power2.inOut' },
          arcStart
        );

        // Final settle — the last short stretch, softly decelerating
        // into the exact final position ("landing").
        tl.to(
          productWrap.current,
          { x: 0, y: 0, rotation: 0, duration: settleDuration, ease: 'power3.out' },
          arcStart + mainDuration
        ).to(
          productImage.current,
          { scale: 1, opacity: 1, filter: 'blur(0px)', duration: settleDuration, ease: 'power3.out' },
          arcStart + mainDuration
        );

        if (productShadow?.current) {
          tl.to(
            productShadow.current,
            { opacity: 1, scaleX: 1, duration: settleDuration, ease: 'power2.out' },
            arcStart + mainDuration
          );
        }
      }

      // Phase 6 — resting state: scroll cue fades in, timeline ends.
      const endTime = tl.duration();
      tl.to(scrollHint.current, { opacity: 1, duration: 0.4 }, Math.max(endTime - 0.1, 0));

      // The ONLY thing that continues after the intro.
      if (hasProduct) {
        tl.call(() => {
          gsap.to(productImage.current, {
            y: isMobile ? -2 : -5,
            duration: 3.6,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
        });
      }
    },
    { scope: refs.container }
  );
}