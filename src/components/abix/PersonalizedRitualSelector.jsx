// src/components/abix/PersonalizedRitualSelector.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AGE_GROUPS, GENDERS, getAgeLabel, getGenderLabel } from '@/data/ritualStories';
import { ABIX } from '@/components/abix/brandColors';
import { FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';

const IVORY = ABIX.ivory;
const MUTED = ABIX.ivory45;
const AMBER = ABIX.goldLight;
const EASE = [0.16, 1, 0.3, 1];
const STEP_INDEX = { age: 0, gender: 1, confirm: 2 };

// Three-part gold line that fills as the person moves through the questions.
function StepLine({ step }) {
  const current = STEP_INDEX[step];
  return (
    <div className="mx-auto flex max-w-[220px] items-center gap-2" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className="relative h-px flex-1" style={{ background: `${IVORY}26` }}>
          <motion.span
            className="absolute inset-y-0 left-0 block"
            style={{ background: AMBER }}
            initial={false}
            animate={{ width: i <= current ? '100%' : '0%' }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        </span>
      ))}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-3.5 py-1.5 font-sans text-sm lining-nums"
      style={{ borderColor: `${IVORY}30`, color: IVORY }}
    >
      {children}
    </span>
  );
}

function BackLink({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-2 inline-flex min-h-[44px] items-center gap-2 text-xs tracking-luxe-sm transition-colors hover:text-[#F2ECE2] ${FOCUS_RING}`}
      style={{ color: MUTED }}
    >
      <ArrowLeft size={14} aria-hidden="true" />
      {children}
    </button>
  );
}

// Big tappable choice card. Numbers (age groups) use the normal UI font.
function OptionCard({ label, selected, onClick, variants }) {
  return (
    <motion.button
      type="button"
      variants={variants}
      onClick={onClick}
      aria-pressed={selected}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex min-h-[76px] w-full items-center justify-center overflow-hidden border px-6 py-4 transition-colors duration-300 hover:border-[#C7AE7D] ${FOCUS_RING} ${
        selected ? 'border-[#C7AE7D]' : 'border-ivory/25'
      }`}
      style={{ color: IVORY, background: selected ? ABIX.gold15 : 'transparent' }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: AMBER }}
      />
      <span className="font-sans text-xl tracking-wide lining-nums">{label}</span>
    </motion.button>
  );
}

// Reused on Home (compact section) and on the How To Take Shilajit page.
//
// Flow: age -> gender -> confirm. Navigation to the ritual page happens only
// on the final button click; picking a gender alone does NOT navigate away.
export default function PersonalizedRitualSelector() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState(null);
  const [step, setStep] = useState('age'); // 'age' | 'gender' | 'confirm'

  const chooseAge = (key) => {
    setAge(key);
    setStep('gender');
  };

  const chooseGender = (key) => {
    setGender(key);
    setStep('confirm');
  };

  const goToRitual = () => {
    navigate(`/how-to-take-shilajit?age=${age}&gender=${gender}`);
  };

  const container = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.25 } },
      };
  const item = reduce
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 14 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      };

  const stepProps = { variants: container, initial: 'hidden', animate: 'show', exit: 'exit' };

  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <StepLine step={step} />

      <div className="mt-6 min-h-[250px]">
        <AnimatePresence mode="wait">
          {step === 'age' && (
            <motion.div key="age" {...stepProps}>
              <motion.span variants={item} className="block font-grotesk text-xs tracking-luxe-sm" style={{ color: AMBER }}>
                STEP 01 · OF 02
              </motion.span>
              <motion.h3 variants={item} className="mt-3 font-display text-2xl sm:text-3xl" style={{ color: IVORY }}>
                What's your age group?
              </motion.h3>
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {AGE_GROUPS.map((a) => (
                  <OptionCard
                    key={a.key}
                    label={a.label}
                    selected={age === a.key}
                    onClick={() => chooseAge(a.key)}
                    variants={item}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'gender' && (
            <motion.div key="gender" {...stepProps}>
              <motion.div variants={item}>
                <BackLink onClick={() => setStep('age')}>{getAgeLabel(age)}</BackLink>
              </motion.div>
              <motion.span variants={item} className="block font-grotesk text-xs tracking-luxe-sm" style={{ color: AMBER }}>
                STEP 02 · OF 02
              </motion.span>
              <motion.h3 variants={item} className="mt-3 font-display text-2xl sm:text-3xl" style={{ color: IVORY }}>
                What's your gender?
              </motion.h3>
              <div className="mt-7 grid grid-cols-2 gap-3">
                {GENDERS.map((g) => (
                  <OptionCard
                    key={g.key}
                    label={g.label}
                    selected={gender === g.key}
                    onClick={() => chooseGender(g.key)}
                    variants={item}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div key="confirm" {...stepProps}>
              <motion.div variants={item}>
                <BackLink onClick={() => setStep('gender')}>Change answers</BackLink>
              </motion.div>
              <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-2">
                <Chip>{getAgeLabel(age)}</Chip>
                <Chip>{getGenderLabel(gender)}</Chip>
              </motion.div>
              <motion.p
                variants={item}
                className="mx-auto mt-6 max-w-md font-display text-xl leading-snug sm:text-2xl"
                style={{ color: IVORY }}
              >
                See how you can take the ABIXMART Shilajit ritual.
              </motion.p>
              <motion.button
                variants={item}
                type="button"
                onClick={goToRitual}
                className={`group mt-7 inline-flex h-14 w-full items-center justify-center rounded-full px-9 text-[12px] font-semibold uppercase tracking-luxe-sm transition-[filter] duration-300 hover:brightness-110 sm:w-auto ${FOCUS_RING}`}
                style={{ background: ABIX.gold, color: ABIX.obsidian }}
              >
                See My Ritual
                <ArrowRight
                  size={15}
                  className="ml-3 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}