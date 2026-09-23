// src/components/abix/HowToTakeShilajitIntro.jsx
import React from 'react';
import Eyebrow from '@/components/abix/Eyebrow';
import PersonalizedRitualSelector from '@/components/abix/PersonalizedRitualSelector';

const INK = '#151417';
const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';

// This is the NEW compact homepage section. It replaces whatever
// component Home.jsx previously imported as "HowToTakeShilajit" —
// that old full-storyline component should stop being used here (it can
// stay in the codebase unused, or be deleted once you confirm nothing
// else references it).
export default function HowToTakeShilajitIntro() {
  return (
    <section className="py-16 lg:py-24" style={{ background: INK }}>
      <div className="mx-auto max-w-2xl px-6 lg:px-10 text-center">
        <Eyebrow light>The Ritual</Eyebrow>
        <h2 className="mt-5 font-display text-3xl sm:text-4xl leading-tight" style={{ color: IVORY }}>
          How To Take Shilajit
        </h2>
        <p className="mt-4 text-base lg:text-lg leading-relaxed max-w-lg mx-auto" style={{ color: MUTED }}>
          A simple ritual, done consistently. Tell us a little about you and see how it fits into your day.
        </p>

        <div className="mt-10 flex justify-center">
          <PersonalizedRitualSelector />
        </div>
      </div>
    </section>
  );
}