// src/components/abix/PersonalizedRitualTimeline.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { STORY_ORDER, getRitualStory, getAgeLabel, getGenderLabel } from '@/data/ritualStories';
import { ABIX } from '@/components/abix/brandColors';
import { FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';

const INK = ABIX.obsidian;
const IVORY = ABIX.ivory;
const MUTED = ABIX.ivory45;
const AMBER = ABIX.goldLight;
const EASE = [0.16, 1, 0.3, 1];
const VIEWPORT = { once: true, margin: '-80px' };

// Curtain wipe: the image is revealed edge-first, toward the text column.
function getWipeVariants(fromLeft) {
  return {
    hidden: { clipPath: fromLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' },
    show: {
      clipPath: 'inset(0 0% 0 0%)',
      transition: { duration: 0.9, ease: [0.65, 0, 0.35, 1] },
    },
  };
}

const textContainerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};
const textItemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const jumpTo = (key) => {
  document.getElementById(`ritual-step-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Last word of a title in gold italic.
function TitleWithAccent({ title }) {
  const words = title.split(' ');
  return words.map((w, i) => (
    <React.Fragment key={`${w}-${i}`}>
      {i > 0 ? ' ' : null}
      {i === words.length - 1 ? (
        <span className="italic" style={{ color: AMBER }}>{w}</span>
      ) : (
        w
      )}
    </React.Fragment>
  ));
}

function Scene({ step, index, total, src, nextStep, onActive, reduce }) {
  const ref = useRef(null);
  const imageFirst = index % 2 === 1;
  const wipeFromLeft = imageFirst;

  // Marks this scene as the "current" one when it crosses the middle of the screen.
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' });
  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  // Gentle parallax inside the image frame.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-5%', '5%']);

  const motionIf = (props) => (reduce ? {} : props);
  const counter = `${step.number} / ${String(total).padStart(2, '0')}`;

  return (
    <div
      ref={ref}
      id={`ritual-step-${step.key}`}
      className="grid scroll-mt-40 lg:scroll-mt-48 gap-8 lg:grid-cols-12 lg:gap-14 items-center"
    >
      {/* ---------- text ---------- */}
      <motion.div
        {...motionIf({
          variants: textContainerVariants,
          initial: 'hidden',
          whileInView: 'show',
          viewport: VIEWPORT,
        })}
        className={`relative lg:col-span-5 ${imageFirst ? 'lg:order-2' : 'lg:order-1'}`}
      >
        {/* oversized ghost number — plain UI font so it stays easy to read */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 -left-1 select-none font-sans text-[7rem] font-extralight leading-none tabular-nums lining-nums lg:-top-14 lg:text-[11rem]"
          style={{ color: `${AMBER}1A` }}
        >
          {step.number}
        </span>

        <div className="relative">
          <motion.span
            variants={reduce ? undefined : textItemVariants}
            className="block font-grotesk text-xs tracking-luxe-sm tabular-nums"
            style={{ color: AMBER }}
          >
            SCENE {counter}
          </motion.span>

          <motion.h3
            variants={reduce ? undefined : textItemVariants}
            className="mt-4 font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: IVORY }}
          >
            <TitleWithAccent title={step.title} />
          </motion.h3>

          <motion.span
            variants={reduce ? undefined : textItemVariants}
            aria-hidden="true"
            className="mt-6 block h-px w-16 origin-left"
            style={{ background: AMBER }}
          />

          {nextStep && (
            <motion.button
              variants={reduce ? undefined : textItemVariants}
              type="button"
              onClick={() => jumpTo(nextStep.key)}
              className={`group mt-6 inline-flex min-h-[44px] items-center gap-2 text-left text-sm transition-colors hover:text-[#F2ECE2] ${FOCUS_RING}`}
              style={{ color: MUTED }}
            >
              <span className="font-grotesk text-[11px] uppercase tracking-luxe-sm" style={{ color: AMBER }}>
                Next
              </span>
              <span>{nextStep.title}</span>
              <ArrowDown
                size={14}
                className="transition-transform duration-300 group-hover:translate-y-0.5"
                aria-hidden="true"
              />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ---------- image ---------- */}
      <div className={`lg:col-span-7 ${imageFirst ? 'lg:order-1' : 'lg:order-2'}`}>
        <div className="relative">
          {/* offset gold outline behind the frame */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 border ${
              imageFirst ? '-translate-x-2.5 translate-y-2.5 sm:-translate-x-4 sm:translate-y-4' : 'translate-x-2.5 translate-y-2.5 sm:translate-x-4 sm:translate-y-4'
            }`}
            style={{ borderColor: `${AMBER}40` }}
          />

          <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[4/3]" style={{ background: INK }}>
            <motion.div
              {...motionIf({
                variants: getWipeVariants(wipeFromLeft),
                initial: 'hidden',
                whileInView: 'show',
                viewport: VIEWPORT,
              })}
              className="absolute inset-0"
            >
              <motion.div className="absolute inset-x-0 -top-[7%] h-[114%]" style={{ y }}>
                <motion.img
                  {...motionIf({
                    initial: { scale: 1.14 },
                    whileInView: { scale: 1 },
                    viewport: VIEWPORT,
                    transition: { duration: 1.7, ease: EASE },
                  })}
                  src={src}
                  alt={step.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            </motion.div>

            {/* soft vignette + counter chip */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(0deg, rgba(10,10,12,0.45) 0%, transparent 38%)' }}
            />
            <span
              className="absolute bottom-3 left-3 z-10 px-3 py-1.5 font-sans text-[11px] tracking-widest tabular-nums lining-nums backdrop-blur-md sm:bottom-4 sm:left-4"
              style={{ background: 'rgba(10,10,12,0.4)', color: IVORY }}
            >
              {counter}
            </span>

            {/* gold thread that travels with the wipe's leading edge */}
            {!reduce && (
              <motion.div
                initial={{ left: wipeFromLeft ? '0%' : '100%' }}
                whileInView={{ left: wipeFromLeft ? '100%' : '0%' }}
                viewport={VIEWPORT}
                transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
                className="pointer-events-none absolute bottom-0 top-0 z-10 w-[2px]"
                style={{ background: AMBER, boxShadow: `0 0 14px ${AMBER}` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Takes age/gender keys, resolves the explicit story object and renders the six scenes.
export default function PersonalizedRitualTimeline({ age, gender }) {
  const story = getRitualStory(age, gender);
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const [active, setActive] = useState(0);
  const handleActive = useCallback((i) => setActive(i), []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 40%', 'end 70%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  if (!story) return null;

  const total = STORY_ORDER.length;

  return (
    <section
      id="ritual"
      ref={sectionRef}
      className="relative overflow-x-clip border-t"
      style={{ background: ABIX.espresso, borderColor: `${IVORY}0D` }}
    >
      {/* ambient light (clipped so it never causes sideways scroll) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-[15%] top-[6%] h-[50%] w-[60%]"
          style={{ background: `radial-gradient(closest-side, ${ABIX.gold15} 0%, transparent 70%)` }}
        />
        <div
          className="absolute -right-[15%] bottom-[6%] h-[45%] w-[55%]"
          style={{ background: `radial-gradient(closest-side, ${ABIX.gold15} 0%, transparent 70%)` }}
        />
      </div>

      {/* sticky scene navigation: shows where you are and lets you jump */}
      <div
        className="sticky top-[78px] z-20 border-b backdrop-blur-xl lg:top-[92px]"
        style={{ background: `${INK}CC`, borderColor: `${IVORY}14` }}
      >
        <nav aria-label="Ritual scenes" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <ol className="flex">
            {STORY_ORDER.map((s, i) => (
              <li key={s.key} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => jumpTo(s.key)}
                  aria-current={i === active ? 'step' : undefined}
                  aria-label={`Scene ${s.number}: ${s.title}`}
                  className={`w-full px-1 py-3.5 text-center transition-colors ${FOCUS_RING}`}
                  style={{ color: i === active ? AMBER : i < active ? IVORY : `${IVORY}66` }}
                >
                  <span className="block font-grotesk text-[11px] tracking-luxe-sm tabular-nums">{s.number}</span>
                  <span className="mt-0.5 hidden truncate text-[11px] lg:block">{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <motion.div className="h-px origin-left" style={{ scaleX: progress, background: AMBER }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10 pb-20 pt-14 lg:pb-32 lg:pt-20">
        {/* intro */}
        <div className="mb-16 max-w-2xl lg:mb-24">
          <span className="font-grotesk text-xs tracking-luxe-sm" style={{ color: AMBER }}>
            YOUR PERSONALIZED ABIXMART RITUAL
          </span>
          <h2
            className="mt-4 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl"
            style={{ color: IVORY }}
          >
            Your ritual, <span className="italic" style={{ color: AMBER }}>scene by scene.</span>
          </h2>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {[getAgeLabel(age), getGenderLabel(gender)].map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full border px-3.5 py-1.5 font-sans text-sm lining-nums"
                style={{ borderColor: `${IVORY}30`, color: IVORY }}
              >
                {label}
              </span>
            ))}
            <Link
              to="/how-to-take-shilajit"
              className={`ml-1 inline-flex min-h-[44px] items-center text-sm underline underline-offset-4 transition-colors hover:text-[#F2ECE2] ${FOCUS_RING}`}
              style={{ color: MUTED }}
            >
              Change
            </Link>
          </div>
        </div>

        {/* scenes */}
        <div className="space-y-24 lg:space-y-40">
          {STORY_ORDER.map((step, i) => (
            <Scene
              key={step.key}
              step={step}
              index={i}
              total={total}
              src={story[step.key]}
              nextStep={STORY_ORDER[i + 1]}
              onActive={handleActive}
              reduce={reduce}
            />
          ))}
        </div>

        {/* closing */}
        <div className="mt-24 text-center lg:mt-40">
          <motion.span
            aria-hidden="true"
            className="mx-auto block h-20 w-px origin-top"
            style={{ background: `linear-gradient(180deg, ${ABIX.gold}, transparent)` }}
            initial={reduce ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: EASE }}
          />
          <h3
            className="mt-8 font-display text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl"
            style={{ color: IVORY }}
          >
            Six scenes. <span className="italic" style={{ color: AMBER }}>One simple ritual.</span>
          </h3>
          <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link
              to="/shop/shilajit"
              className={`group inline-flex h-14 items-center justify-center rounded-full px-9 text-[12px] font-semibold uppercase tracking-luxe-sm transition-[filter] duration-300 hover:brightness-110 ${FOCUS_RING}`}
              style={{ background: ABIX.gold, color: INK }}
            >
              Explore Shilajit
              <ArrowRight
                size={15}
                className="ml-3 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <button
              type="button"
              onClick={() => jumpTo(STORY_ORDER[0].key)}
              className={`inline-flex h-14 items-center justify-center rounded-full border px-9 text-[12px] font-semibold uppercase tracking-luxe-sm transition-colors duration-300 hover:bg-[rgba(199,174,125,0.08)] ${FOCUS_RING}`}
              style={{ color: AMBER, borderColor: `${AMBER}66` }}
            >
              Watch again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}