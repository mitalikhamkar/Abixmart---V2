// src/components/abix/NatureFilm.jsx
import React, { useRef, useState, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import natureVideoSrc from '@/assets/home/abixmart-nature-video.mp4';
import { ABIX } from './brandColors';

export default function NatureFilm() {
  const sectionRef = useRef(null);
  const introRef = useRef(null);
  const videoRef = useRef(null);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [videoErrored, setVideoErrored] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handleChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || videoErrored) return;
    const p = el.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, [videoErrored]);

  useGSAP(
    () => {
      const items = introRef.current?.querySelectorAll('[data-entrance]');
      if (reduceMotion) {
        gsap.set(items, { opacity: 1, y: 0 });
        return;
      }
      gsap.set(items, { opacity: 0, y: 20 });
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      });
    },
    { scope: sectionRef, dependencies: [reduceMotion] }
  );

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[70vh] lg:min-h-[85vh] overflow-hidden flex items-center"
      style={{ backgroundColor: ABIX.blackOlive }}
    >
      <div className="absolute inset-0 z-0">
        {!videoErrored ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoErrored(true)}
          >
            <source src={natureVideoSrc} type="video/mp4" />
          </video>
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(120% 90% at 30% 20%, ${ABIX.espresso} 0%, ${ABIX.blackOlive} 55%, ${ABIX.obsidian} 100%)`,
            }}
          />
        )}
      </div>

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(16,24,20,0.40) 0%, rgba(16,24,20,0.15) 45%, rgba(16,24,20,0.55) 100%)',
        }}
        aria-hidden="true"
      />

      {/* REMOVED: the bottom fade-to-ABIX.deep strip that used to live
          here — SectionDivider now owns this seam in Home.jsx, at the
          correct blackOlive → deep colors. */}

      <div
        ref={introRef}
        className="relative z-10 mx-auto max-w-4xl w-full px-6 lg:px-10 flex flex-col items-center text-center"
      >
        <span
          data-entrance
          className="block text-[11px] font-semibold tracking-luxe-sm uppercase mb-5"
          style={{ color: ABIX.gold }}
        >
          The ABIXMART Way
        </span>

        <h2
          data-entrance
          className="font-display leading-[1.05] tracking-tight text-[clamp(1.9rem,5vw,3.1rem)]"
          style={{ color: ABIX.ivory }}
        >
          Wellness, experienced in motion.
        </h2>
      </div>
    </section>
  );
}