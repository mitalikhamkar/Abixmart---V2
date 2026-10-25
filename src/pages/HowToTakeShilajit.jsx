// src/pages/HowToTakeShilajit.jsx
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import LeafShadow from '@/components/abix/home/LeafShadow';
import PersonalizedRitualTimeline from '@/components/abix/PersonalizedRitualTimeline';
import PersonalizedRitualSelector from '@/components/abix/PersonalizedRitualSelector';
import { ABOUT_CSS } from '@/components/abix/about/aboutMotion';
import { AGE_GROUPS, GENDERS } from '@/data/ritualStories';
import { ABIX } from '@/components/abix/brandColors';
import { FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';

const INK = ABIX.obsidian;
const IVORY = ABIX.ivory;
const MUTED = ABIX.ivory45;
const EASE = [0.22, 1, 0.36, 1];

// Headline, split so each word rises out of its own mask. The last word is gold italic.
const HEADLINE = [['This', 'is', 'how'], ['you', 'take', 'Shilajit.']];

export default function HowToTakeShilajit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const rawAge = searchParams.get('age');
  const rawGender = searchParams.get('gender');
  const validAge = AGE_GROUPS.some((a) => a.key === rawAge) ? rawAge : null;
  const validGender = GENDERS.some((g) => g.key === rawGender) ? rawGender : null;
  const hasPersonalizedStory = Boolean(validAge && validGender);

  // Always returns Home — simple and predictable.
  const handleBack = () => navigate('/');

  const toRitual = () => {
    document.getElementById('ritual')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fadeUp = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  let wordIndex = 0;

  return (
    <PageTransition>
      <style>{ABOUT_CSS}</style>

      {/* ============ HERO ============ */}
      <section
        aria-labelledby="ritual-title"
        className="relative overflow-hidden grain"
        style={{ background: INK }}
      >
        <div
          aria-hidden="true"
          className="abix-amber pointer-events-none absolute -right-[10%] top-[0%] h-[80%] w-[70%]"
          style={{ background: `radial-gradient(closest-side, ${ABIX.gold25} 0%, transparent 70%)` }}
        />
        <LeafShadow side="left" opacity={0.08} />

        {/* pt-28 / pt-36 keeps everything clear of the fixed site header */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10 pt-28 lg:pt-36 pb-14 lg:pb-20">
          <motion.div {...fadeUp(0.1)}>
            <button
              type="button"
              onClick={handleBack}
              className={`inline-flex min-h-[44px] items-center gap-2 text-sm transition-colors hover:text-[#F2ECE2] ${FOCUS_RING}`}
              style={{ color: MUTED }}
            >
              <ArrowLeft size={16} aria-hidden="true" /> Back
            </button>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="mt-6">
            <Eyebrow light>Ritual Guide</Eyebrow>
          </motion.div>

          <h1
            id="ritual-title"
            aria-label="This is how you take Shilajit."
            className="mt-6 font-display text-[2.6rem] sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.02] tracking-tight"
            style={{ color: IVORY }}
          >
            {HEADLINE.map((line, li) => (
              <span key={li} className="block" aria-hidden="true">
                {line.map((w) => {
                  const i = wordIndex++;
                  const accent = li === 1 && w === 'Shilajit.';
                  return (
                    <span
                      key={w}
                      className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em] pr-[0.12em] mr-[0.14em]"
                    >
                      <motion.span
                        className={`inline-block ${accent ? 'italic' : ''}`}
                        style={accent ? { color: ABIX.goldLight } : undefined}
                        initial={reduce ? false : { y: '115%' }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.95, ease: EASE, delay: 0.3 + i * 0.1 }}
                      >
                        {w}
                      </motion.span>
                    </span>
                  );
                })}
              </span>
            ))}
          </h1>

          <motion.p
            {...fadeUp(0.95)}
            className="mt-7 max-w-lg text-base sm:text-lg leading-relaxed"
            style={{ color: ABIX.ivory70 }}
          >
            A simple ritual, done consistently. Here's your ABIXMART story, scene by scene.
          </motion.p>

          {hasPersonalizedStory && (
            <motion.div {...fadeUp(1.1)} className="mt-9">
              <button
                type="button"
                onClick={toRitual}
                className={`group inline-flex h-14 w-full items-center justify-center rounded-full px-9 text-[12px] font-semibold uppercase tracking-luxe-sm transition-[filter] duration-300 hover:brightness-110 sm:w-auto ${FOCUS_RING}`}
                style={{ background: ABIX.gold, color: INK }}
              >
                Begin the ritual
                <ArrowDown
                  size={15}
                  className="ml-3 transition-transform duration-300 group-hover:translate-y-0.5"
                  aria-hidden="true"
                />
              </button>
            </motion.div>
          )}
        </div>
      </section>

      {/* ============ PERSONALIZED STORY, or the age/gender question ============ */}
      {hasPersonalizedStory ? (
        <PersonalizedRitualTimeline age={validAge} gender={validGender} />
      ) : (
        <section
          className="relative overflow-hidden grain border-t"
          style={{ background: ABIX.espresso, borderColor: `${IVORY}0D` }}
        >
          <div
            aria-hidden="true"
            className="abix-amber pointer-events-none absolute -left-[10%] top-[10%] h-[70%] w-[60%]"
            style={{ background: `radial-gradient(closest-side, ${ABIX.gold15} 0%, transparent 70%)` }}
          />
          <div className="relative mx-auto max-w-3xl px-6 lg:px-10 py-16 lg:py-28 text-center">
            <div className="flex justify-center">
              <Eyebrow light>Personalize Your Ritual</Eyebrow>
            </div>
            <h2
              className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight"
              style={{ color: IVORY }}
            >
              Two quick questions,{' '}
              <span className="italic" style={{ color: ABIX.goldLight }}>one ritual for you.</span>
            </h2>
            <div className="mt-12">
              <PersonalizedRitualSelector />
            </div>
          </div>
        </section>
      )}
    </PageTransition>
  );
}