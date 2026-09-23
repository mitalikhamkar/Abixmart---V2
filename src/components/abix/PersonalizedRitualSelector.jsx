// src/components/abix/PersonalizedRitualSelector.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AGE_GROUPS, GENDERS, getAgeLabel, getGenderLabel } from '@/data/ritualStories';

const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';
const AMBER = '#D3A467';

// Reused on both Home (compact section) and the dedicated page's
// "Personalize your ritual" fallback — same component, same logic.
//
// Flow: age -> gender -> confirm (framing text + one button).
// Navigation to the dedicated page only happens on that final button
// click — picking gender alone does NOT navigate away.
export default function PersonalizedRitualSelector() {
  const navigate = useNavigate();
  const [age, setAge] = useState(null);
  const [gender, setGender] = useState(null);
  const [step, setStep] = useState('age'); // 'age' | 'gender' | 'confirm'

  const chooseAge = (key) => {
    setAge(key);
    setStep('gender');
  };

  const chooseGender = (genderKey) => {
    setGender(genderKey);
    setStep('confirm');
  };

  const goToRitual = () => {
    navigate(`/how-to-take-shilajit?age=${age}&gender=${gender}`);
  };

  return (
    <div className="max-w-xl mx-auto text-center">
      <AnimatePresence mode="wait">
        {step === 'age' && (
          <motion.div
            key="age"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="font-grotesk text-xs tracking-luxe-sm" style={{ color: AMBER }}>
              STEP 01
            </span>
            <h3 className="mt-2 font-display text-2xl" style={{ color: IVORY }}>
              What's your age group?
            </h3>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {AGE_GROUPS.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => chooseAge(a.key)}
                  className="h-12 px-6 border text-sm font-medium tracking-wide transition-colors duration-300"
                  style={{ borderColor: `${IVORY}30`, color: IVORY }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = AMBER)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${IVORY}30`)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'gender' && (
          <motion.div
            key="gender"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={() => setStep('age')}
              className="text-xs tracking-luxe-sm mb-4 transition-colors"
              style={{ color: MUTED }}
            >
              ← {getAgeLabel(age)}
            </button>
            <span className="font-grotesk text-xs tracking-luxe-sm block" style={{ color: AMBER }}>
              STEP 02
            </span>
            <h3 className="mt-2 font-display text-2xl" style={{ color: IVORY }}>
              What's your gender?
            </h3>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {GENDERS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => chooseGender(g.key)}
                  className="h-12 px-8 text-sm font-medium tracking-wide transition-colors duration-300"
                  style={{ borderColor: `${IVORY}30`, color: IVORY, border: '1px solid' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = AMBER)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${IVORY}30`)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              type="button"
              onClick={() => setStep('gender')}
              className="text-xs tracking-luxe-sm mb-4 transition-colors"
              style={{ color: MUTED }}
            >
              ← {getAgeLabel(age)} · {getGenderLabel(gender)}
            </button>
            <p className="font-display text-xl lg:text-2xl leading-snug" style={{ color: IVORY }}>
              See how you can take the ABIXMART Shilajit ritual.
            </p>
            <button
              type="button"
              onClick={goToRitual}
              className="mt-6 inline-flex items-center justify-center h-12 px-8 text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
              style={{ background: '#BE8A4B', color: '#151417' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = AMBER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#BE8A4B')}
            >
              See My Ritual
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}