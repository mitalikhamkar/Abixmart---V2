// src/components/abix/PersonalizedRitualTimeline.jsx
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { STORY_ORDER, getRitualStory, getAgeLabel, getGenderLabel } from '@/data/ritualStories';
import { ABIX } from '@/components/abix/brandColors';

// CHANGED: these now alias the centralized ABIX token system instead of
// hardcoded hex. The section background below also now uses ABIX.espresso
// instead of a one-off '#1E1C1F' — that mismatch (a shade not used
// anywhere else in the app) is what read as a visible seam against the
// ABIX.obsidian hero directly above it on HowToTakeShilajit.jsx.
const INK = ABIX.obsidian;
const IVORY = ABIX.ivory;
const MUTED = ABIX.ivory45;
const AMBER = ABIX.goldLight;

// A directional "curtain" wipe — the image is revealed edge-first
// instead of just fading in. Direction alternates with which side the
// image sits on, so the motion always travels toward where the text is,
// tying the two columns together instead of two unrelated pop-ins.
function getWipeVariants(fromLeft) {
  return {
    hidden: { clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' },
    show: {
      clipPath: 'inset(0 0% 0 0%)',
      transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] },
    },
  };
}

// The number + title reveal one after another instead of together.
const textContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};
const textItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// Reusable — takes age/gender keys, resolves the correct explicit story
// object, and renders all six scenes with their real images. No scroll
// hijacking (plain whileInView), and fully visible with no animation
// when the user has reduced motion enabled.
export default function PersonalizedRitualTimeline({ age, gender }) {
  const story = getRitualStory(age, gender);
  const reduceMotion = useReducedMotion();
  if (!story) return null;

  return (
    <section className="py-16 lg:py-24 border-t" style={{ background: ABIX.espresso, borderColor: `${IVORY}0D` }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="max-w-xl mb-12 lg:mb-16">
          <span className="font-grotesk text-xs tracking-luxe-sm" style={{ color: AMBER }}>
            YOUR PERSONALIZED ABIXMART RITUAL
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl leading-tight" style={{ color: IVORY }}>
            {getAgeLabel(age)} · {getGenderLabel(gender)}
          </h2>
        </div>

        <div className="space-y-16 lg:space-y-28">
          {STORY_ORDER.map((step, i) => {
            const imageFirst = i % 2 === 1;
            // Wipe travels the same direction the eye already moves —
            // from the text column toward the image column.
            const wipeFromLeft = imageFirst;

            const textMotionProps = reduceMotion
              ? {}
              : {
                  variants: textContainerVariants,
                  initial: 'hidden',
                  whileInView: 'show',
                  viewport: { once: true, margin: '-80px' },
                };

            const wipeMotionProps = reduceMotion
              ? {}
              : {
                  variants: getWipeVariants(wipeFromLeft),
                  initial: 'hidden',
                  whileInView: 'show',
                  viewport: { once: true, margin: '-80px' },
                };

            const kenBurnsProps = reduceMotion
              ? {}
              : {
                  initial: { scale: 1.16 },
                  whileInView: { scale: 1 },
                  viewport: { once: true, margin: '-80px' },
                  transition: { duration: 1.7, ease: [0.16, 1, 0.3, 1] },
                };

            const edgeLineProps = reduceMotion
              ? null
              : {
                  initial: { left: wipeFromLeft ? '0%' : '100%' },
                  whileInView: { left: wipeFromLeft ? '100%' : '0%' },
                  viewport: { once: true, margin: '-80px' },
                  transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] },
                };

            return (
              <div key={step.key} className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-center">
                <motion.div
                  {...textMotionProps}
                  className={`lg:col-span-5 ${imageFirst ? 'lg:order-2' : 'lg:order-1'}`}
                >
                  <motion.span variants={reduceMotion ? undefined : textItemVariants} className="block font-display text-3xl" style={{ color: AMBER }}>
                    {step.number}
                  </motion.span>
                  <motion.h3 variants={reduceMotion ? undefined : textItemVariants} className="mt-2 font-display text-2xl leading-tight" style={{ color: IVORY }}>
                    {step.title}
                  </motion.h3>
                </motion.div>

                {/* Image column — deliberately large (aspect-[4/5] on
                    mobile, [4/3] from sm up) so it's always the visual
                    anchor of the scene, never a background swatch. */}
                <div className={`lg:col-span-7 ${imageFirst ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="relative aspect-[4/5] sm:aspect-[4/3] overflow-hidden" style={{ background: INK }}>
                    <motion.div {...wipeMotionProps} className="absolute inset-0">
                      <motion.img
                        {...kenBurnsProps}
                        src={story[step.key]}
                        alt={step.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </motion.div>

                    {/* Gold thread that travels with the wipe's leading
                        edge — the "curtain being pulled back" accent. */}
                    {edgeLineProps && (
                      <motion.div
                        {...edgeLineProps}
                        className="absolute top-0 bottom-0 w-[2px] z-10 pointer-events-none"
                        style={{ background: AMBER, boxShadow: `0 0 14px ${AMBER}` }}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}