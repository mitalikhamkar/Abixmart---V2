// src/hooks/useHeroIntro.js
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';

/**
 * Hero reveal timeline — v4. Logo and product steps removed (those
 * elements no longer exist in Hero.jsx). Sequence is now:
 * branches settle in → headline lines reveal → copy/CTAs fade up →
 * scroll hint appears. Same easing/pacing philosophy as before.
 */
export function useHeroIntro(refs) {
  useGSAP(
    () => {
      const {
        container,
        leftBranch,
        rightBranch,
        headlineLine1,
        headlineLine2,
        description,
        primaryCta,
        secondaryCta,
        scrollHint,
      } = refs;

      const isMobile = window.innerWidth < 1024;
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const fadeEls = [description.current, primaryCta.current, secondaryCta.current].filter(Boolean);
      const headlineEls = [headlineLine1.current, headlineLine2.current].filter(Boolean);
      const hasBranches = Boolean(leftBranch?.current && rightBranch?.current);

      if (reduceMotion) {
        gsap.set(
          [leftBranch?.current, rightBranch?.current, ...fadeEls, scrollHint.current].filter(Boolean),
          { opacity: 0 }
        );
        const tl = gsap.timeline({ defaults: { ease: 'power1.out', duration: 0.5 } });
        if (hasBranches) tl.to([leftBranch.current, rightBranch.current], { opacity: 1 }, 0);
        tl.to(fadeEls, { opacity: 1, stagger: 0.06 }, 0.2)
          .to(scrollHint.current, { opacity: 1 }, 0.5);
        return;
      }

      const branchTravel = isMobile ? 55 : 130;
      const branchRotation = isMobile ? -8 : -10;

      if (hasBranches) {
        gsap.set(leftBranch.current, { x: -branchTravel, y: -30, opacity: 0, rotation: branchRotation });
        gsap.set(rightBranch.current, { x: branchTravel, y: -30, opacity: 0, rotation: -branchRotation });
      }
      gsap.set(fadeEls, { opacity: 0, y: isMobile ? 14 : 20 });
      gsap.set(headlineEls, { yPercent: 100 });
      gsap.set(scrollHint.current, { opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (hasBranches) {
        tl.to(leftBranch.current, { x: 0, y: 0, opacity: 1, rotation: 0, duration: 1.5, ease: 'power3.out' }, 0)
          .to(rightBranch.current, { x: 0, y: 0, opacity: 1, rotation: 0, duration: 1.5, ease: 'power3.out' }, 0.12);
      }

      const textStart = hasBranches ? 1.0 : 0.2;
      tl.to(headlineLine1.current, { yPercent: 0, duration: 0.55 }, textStart)
        .to(headlineLine2.current, { yPercent: 0, duration: 0.55 }, textStart + 0.15)
        .to(description.current, { opacity: 1, y: 0, duration: 0.45 }, textStart + 0.4)
        .to(primaryCta.current, { opacity: 1, y: 0, duration: 0.4 }, textStart + 0.62)
        .to(secondaryCta.current, { opacity: 1, y: 0, duration: 0.4 }, textStart + 0.74);

      const endTime = tl.duration();
      tl.to(scrollHint.current, { opacity: 1, duration: 0.4 }, Math.max(endTime - 0.1, 0));

      if (container?.current && hasBranches) {
        gsap.to(leftBranch.current, {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: { trigger: container.current, start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to(rightBranch.current, {
          yPercent: -6,
          ease: 'none',
          scrollTrigger: { trigger: container.current, start: 'top top', end: 'bottom top', scrub: true },
        });
      }
    },
    { scope: refs.container }
  );
}