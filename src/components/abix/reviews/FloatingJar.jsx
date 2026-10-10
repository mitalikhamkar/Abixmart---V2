// src/components/abix/reviews/FloatingJar.jsx
import React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ABIX } from '@/components/abix/brandColors';

// The product jar as the centrepiece of the reviews section.
// - Rises into view once, with perspective and a slight forward tilt.
// - Then floats very gently, with a floor shadow that breathes in step.
// - On a mouse, tilts a few degrees toward the pointer.
// All motion is reduced to a short fade when the visitor prefers it.
// The image is shown with object-contain at its natural proportions.
export default function FloatingJar({ src, alt, className = '' }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const spring = { stiffness: 110, damping: 16 };
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-7, 7]), spring);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), spring);

  const handleMove = (e) => {
    if (reduce || e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => {
    px.set(0);
    py.set(0);
  };

  const ease = [0.16, 1, 0.3, 1];

  return (
    <div
      className={`relative mx-auto w-full max-w-[250px] sm:max-w-[290px] lg:max-w-[330px] ${className}`}
      style={{ perspective: '1100px' }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      {/* soft key light behind the jar */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-[42%] h-[90%] w-[140%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${ABIX.gold25} 0%, transparent 62%)`,
          filter: 'blur(26px)',
        }}
      />

      <motion.div
        className="relative"
        style={{ transformStyle: 'preserve-3d', transformOrigin: '50% 90%' }}
        initial={{ opacity: 0, y: reduce ? 0 : 90, scale: reduce ? 1 : 0.86, rotateX: reduce ? 0 : 20 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: reduce ? 0.2 : 1.3, ease }}
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          animate={reduce ? undefined : { y: [0, -9, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img
            src={src}
            alt={alt}
            draggable={false}
            decoding="async"
            className="block w-full h-auto object-contain select-none"
            style={{
              filter:
                'drop-shadow(0 28px 34px rgba(0,0,0,0.55)) drop-shadow(0 0 38px rgba(180,154,98,0.12))',
            }}
          />
        </motion.div>
      </motion.div>

      {/* floor shadow */}
      <motion.div
        aria-hidden="true"
        className="mx-auto -mt-2 w-3/5"
        initial={{ opacity: 0, scaleX: reduce ? 1 : 0.4 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: reduce ? 0.2 : 1.3, ease }}
      >
        <motion.div
          className="h-5 w-full rounded-full"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, transparent 70%)',
            filter: 'blur(6px)',
          }}
          animate={reduce ? undefined : { scaleX: [1, 0.9, 1], opacity: [0.9, 0.6, 0.9] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
    </div>
  );
}