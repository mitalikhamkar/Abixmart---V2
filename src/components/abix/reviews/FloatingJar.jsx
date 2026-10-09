// src/components/abix/reviews/FloatingJar.jsx
import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ABIX } from '@/components/abix/brandColors';
import { REVIEW_JAR_MOTION as M, REVIEW_JAR_TREATMENT as T } from './reviewAssets';

// The real product jar, drifting forward as the reviews section scrolls into
// view: perspective tilt settling flat, slight scale-up, a contact shadow
// that tightens as the jar "lands", and a very small idle float afterwards.
//
// With prefers-reduced-motion the jar is simply shown, still, with no
// transforms and no looping float.
export default function FloatingJar({ src, alt }) {
  const reduce = useReducedMotion();
  const stageRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ['start 95%', 'start 45%'],
  });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 });

  const scale = useTransform(p, [0, 1], [M.fromScale, 1]);
  const y = useTransform(p, [0, 1], [M.fromY, 0]);
  const rotateX = useTransform(p, [0, 1], [M.fromRotateX, 0]);
  const rotateY = useTransform(p, [0, 1], [M.fromRotateY, M.toRotateY]);
  const opacity = useTransform(p, [0, 0.35], [0, 1]);
  const shadowScale = useTransform(p, [0, 1], [0.4, 1]);
  const shadowOpacity = useTransform(p, [0, 1], [0, 0.6]);

  return (
    <div
      ref={stageRef}
      className="relative mx-auto flex items-end justify-center"
      style={{ perspective: 1200, height: T.stageHeight, maxWidth: 320 }}
      aria-hidden={false}
    >
      {/* soft amber glow behind the jar */}
      <div
        className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
        style={{
          width: 'clamp(220px, 26vw, 340px)',
          height: 'clamp(220px, 26vw, 340px)',
          background: `radial-gradient(closest-side, ${ABIX.gold25}, transparent 72%)`,
          filter: 'blur(8px)',
        }}
      />

      <motion.div
        className="relative z-10 mb-3"
        style={reduce ? undefined : { scale, y, rotateX, rotateY, opacity, transformStyle: 'preserve-3d' }}
      >
        <motion.img
          src={src}
          alt={alt}
          draggable={false}
          className="h-auto select-none"
          style={{ width: T.width, filter: T.dropShadow }}
          animate={reduce ? undefined : { y: [0, -M.idleFloatPx, 0] }}
          transition={reduce ? undefined : { duration: M.idleFloatSeconds, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* contact shadow on the "surface" below the jar */}
      <motion.div
        className="absolute bottom-1 left-1/2 pointer-events-none rounded-full"
        style={{
          x: '-50%',
          width: '58%',
          height: 16,
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.75), transparent 75%)',
          ...(reduce ? { opacity: 0.6 } : { scaleX: shadowScale, opacity: shadowOpacity }),
        }}
      />
    </div>
  );
}