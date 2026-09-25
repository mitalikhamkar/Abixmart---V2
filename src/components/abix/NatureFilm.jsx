// src/components/abix/NatureFilm.jsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from '@/lib/gsap';
import { Play, Pause } from 'lucide-react';
import natureVideoSrc from '@/assets/home/abixmart-nature-video.mp4';
import { ABIX } from './brandColors';

// ABIXMART homepage — Section 02: cinematic nature film.
// Full-width video with one minimal circular play/pause control.
// The video is a real bundled asset (src/assets/home/), imported
// the same way Hero.jsx imports its images — Vite resolves it to a
// hashed URL at build time, so if the file is genuinely missing the
// build fails loudly instead of silently 404ing at runtime.

export default function NatureFilm() {
  const sectionRef = useRef(null);
  const introRef = useRef(null);
  const videoRef = useRef(null);

  const [reduceMotion, setReduceMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoErrored, setVideoErrored] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handleChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  // Entrance — label + heading + control settle once. No pin/scrub.
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

  const togglePlayback = useCallback(() => {
    const el = videoRef.current;
    if (!el || videoErrored) return;

    if (el.paused) {
      el.play().catch(() => setIsPlaying(false));
    } else {
      el.pause();
    }
  }, [videoErrored]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePlayback();
      }
    },
    [togglePlayback]
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return undefined;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setVideoErrored(true);

    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('error', onError);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-[70vh] lg:min-h-[85vh] overflow-hidden flex items-center"
      style={{ backgroundColor: ABIX.deep }}
    >
      {/* Hero -> film tonal continuation, no hard seam */}
      <div
        className="absolute inset-x-0 top-0 h-40 lg:h-56 z-[2] pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${ABIX.deep} 0%, transparent 100%)`,
        }}
        aria-hidden="true"
      />

      {/* VIDEO / FALLBACK LAYER */}
      <div className="absolute inset-0 z-0">
        {!videoErrored ? (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setVideoErrored(true)}
          >
            <source src={natureVideoSrc} type="video/mp4" />
          </video>
        ) : (
          // Static cinematic fallback if the video genuinely can't
          // play at runtime (e.g. unsupported codec) — brand surface,
          // no broken player, no placeholder imagery.
          <div
            className="w-full h-full"
            style={{
              background: `radial-gradient(120% 90% at 30% 20%, ${ABIX.deeper} 0%, ${ABIX.deep} 60%, #0B1712 100%)`,
            }}
          />
        )}
      </div>

      {/* READABILITY OVERLAY — lightens slightly once playing */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none transition-opacity duration-700"
        style={{
          background: `linear-gradient(180deg, rgba(15,32,24,0.55) 0%, rgba(15,32,24,0.3) 45%, rgba(15,32,24,0.6) 100%)`,
          opacity: isPlaying ? 0.7 : 1,
        }}
        aria-hidden="true"
      />

      {/* CONTENT */}
      <div
        ref={introRef}
        className="relative z-10 mx-auto max-w-4xl w-full px-6 lg:px-10 flex flex-col items-center text-center transition-opacity duration-700"
        style={{ opacity: isPlaying ? 0.55 : 1 }}
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
          className="font-display leading-[1.05] tracking-tight text-[clamp(1.9rem,5vw,3.1rem)] mb-10 lg:mb-14"
          style={{ color: ABIX.ivory }}
        >
          Wellness, experienced in motion.
        </h2>

        {!videoErrored && (
          <button
            data-entrance
            type="button"
            onClick={togglePlayback}
            onKeyDown={handleKeyDown}
            aria-label={isPlaying ? 'Pause the film' : 'Play the film'}
            className="group relative flex items-center justify-center w-16 h-16 sm:w-[70px] sm:h-[70px] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: ABIX.gold, ['--tw-ring-color']: ABIX.gold }}
          >
            <span
              className="absolute inset-0 rounded-full border transition-transform duration-500"
              style={{
                borderColor: ABIX.gold,
                animation:
                  !isPlaying && !reduceMotion
                    ? 'abixPlayPulse 2.6s ease-in-out infinite'
                    : 'none',
              }}
              aria-hidden="true"
            />
            <span className="relative flex items-center justify-center w-full h-full">
              {isPlaying ? (
                <Pause size={20} color={ABIX.ivory} fill={ABIX.ivory} strokeWidth={0} />
              ) : (
                <Play
                  size={20}
                  color={ABIX.ivory}
                  fill={ABIX.ivory}
                  strokeWidth={0}
                  className="translate-x-[1px]"
                />
              )}
            </span>
          </button>
        )}
      </div>

      <style>{`
        @keyframes abixPlayPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 0.25; }
        }
      `}</style>
    </section>
  );
}