// src/components/abix/PersonalizedRitualTimeline.jsx
import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { STORY_ORDER, getRitualStory, getAgeLabel, getGenderLabel } from '@/data/ritualStories';

const INK = '#151417';
const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';
const AMBER = '#D3A467';

// Reusable — takes age/gender keys, resolves the correct explicit story
// object, and renders all six scenes with their real images. No scroll
// hijacking (plain whileInView), and fully visible with no animation
// when the user has reduced motion enabled.
export default function PersonalizedRitualTimeline({ age, gender }) {
  const story = getRitualStory(age, gender);
  const reduceMotion = useReducedMotion();
  if (!story) return null;

  return (
    <section className="py-16 lg:py-24 border-t" style={{ background: '#1E1C1F', borderColor: `${IVORY}0D` }}>
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
            return (
              <motion.div
                key={step.key}
                initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="grid lg:grid-cols-12 gap-6 lg:gap-12 items-center"
              >
                <div className={`lg:col-span-5 ${imageFirst ? 'lg:order-2' : 'lg:order-1'}`}>
                  <span className="font-display text-3xl" style={{ color: AMBER }}>
                    {step.number}
                  </span>
                  <h3 className="mt-2 font-display text-2xl leading-tight" style={{ color: IVORY }}>
                    {step.title}
                  </h3>
                </div>
                {/* Image column — deliberately large (aspect-[4/5] on
                    mobile, [4/3] from sm up) so it's always the visual
                    anchor of the scene, never a background swatch. */}
                <div className={`lg:col-span-7 ${imageFirst ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div
                    className="relative aspect-[4/5] sm:aspect-[4/3] overflow-hidden"
                    style={{ background: INK }}
                  >
                    <img
                      src={story[step.key]}
                      alt={step.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}