import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';

/**
 * Hero intro timeline — runs once when Home mounts, then stops.
 * Same sequence as before (background settle → product fades into a
 * temp spot → text reveals → product sweeps into final position →
 * idle float loop starts), PLUS two additions:
 *
 *  - `idleFloat` ref: the mount-time idle float tween is stored here
 *    (instead of being fire-and-forget) so Hero.jsx can kill/recreate
 *    it around each product-switch transition without fighting this
 *    timeline.
 *  - Scroll interaction: a scrub-linked parallax on the background and
 *    product, using `scrollTrigger` (already used elsewhere, e.g.
 *    FeaturedProduct.jsx) — separate GSAP tweens on different transform
 *    channels (yPercent) than the ones this timeline uses (x/y/scale),
 *    so the two never fight over the same animated property.
 */
export function useHeroIntro(refs) {
  useGSAP(
    () => {
      const {
        container,
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
        idleFloat,
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

      // Phase 2 — product fades into its temporary position.
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

      // Phase 4 — one smooth, continuous diagonal sweep into final position.
      if (hasProduct) {
        const arcStart = 1.9;
        const mainDuration = isMobile ? 0.9 : 1.35;
        const settleDuration = isMobile ? 0.4 : 0.55;

        tl.to(
          productWrap.current,
          { x: startX * 0.14, y: startY * 0.12, rotation: startRotation * 0.15, duration: mainDuration, ease: 'power2.inOut' },
          arcStart
        ).to(
          productImage.current,
          { scale: isMobile ? 0.98 : 0.99, filter: 'blur(1px)', duration: mainDuration, ease: 'power2.inOut' },
          arcStart
        );

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

      // Idle float — stored on the shared ref so Hero.jsx can kill it
      // before a product-switch transition and recreate it after.
      if (hasProduct) {
        tl.call(() => {
          if (idleFloat) {
            idleFloat.current = gsap.to(productImage.current, {
              y: isMobile ? -2 : -5,
              duration: 3.6,
              ease: 'sine.inOut',
              yoyo: true,
              repeat: -1,
            });
          }
        });
      }

      // NEW — subtle scroll interaction. Scrubbed directly to scroll
      // position (not autoplaying), on yPercent only, so it composites
      // cleanly alongside the x/y tweens above rather than overwriting them.
      if (container?.current) {
        gsap.to(background.current, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: container.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        if (hasProduct) {
          gsap.to(productWrap.current, {
            yPercent: -18,
            ease: 'none',
            scrollTrigger: { trigger: container.current, start: 'top top', end: 'bottom top', scrub: true },
          });
        }
      }
    },
    { scope: refs.container }
  );
}