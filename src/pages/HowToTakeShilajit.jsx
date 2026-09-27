// src/pages/HowToTakeShilajit.jsx
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import PersonalizedRitualTimeline from '@/components/abix/PersonalizedRitualTimeline';
import PersonalizedRitualSelector from '@/components/abix/PersonalizedRitualSelector';
import { AGE_GROUPS, GENDERS } from '@/data/ritualStories';
import { ABIX } from '@/components/abix/brandColors';

// CHANGED: these now alias the centralized ABIX token system instead of
// hardcoded hex — every usage further down the file is untouched.
const INK = ABIX.obsidian;
const IVORY = ABIX.ivory;
const MUTED = ABIX.ivory45;

export default function HowToTakeShilajit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawAge = searchParams.get('age');
  const rawGender = searchParams.get('gender');
  const validAge = AGE_GROUPS.some((a) => a.key === rawAge) ? rawAge : null;
  const validGender = GENDERS.some((g) => g.key === rawGender) ? rawGender : null;
  const hasPersonalizedStory = Boolean(validAge && validGender);

  // Always returns Home, as requested — simple and predictable.
  const handleBack = () => navigate('/');

  return (
    <PageTransition>
      {/* HERO — shrunk down and Back button pulled out of the centered
          column into a real top-left corner position (it was sharing
          the centered flex row with the eyebrow before, which is why it
          read as floating dead-center). The hero itself is also
          shorter now so the actual question below (age/gender, or the
          six-scene story) is what the page reads as being "about",
          instead of getting buried under an oversized title block. */}
      <section className="relative pt-16 lg:pt-20 pb-8 lg:pb-10" style={{ background: INK }}>
        <div className="absolute inset-0 grain opacity-[0.04] pointer-events-none" />

        <button
          type="button"
          onClick={handleBack}
          className="absolute left-6 lg:left-10 top-6 lg:top-8 inline-flex items-center gap-2 text-sm transition-colors z-10"
          style={{ color: MUTED }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="relative mx-auto max-w-3xl px-6 lg:px-10 text-center">
          <Eyebrow light>Ritual Guide</Eyebrow>
          <h1
            className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.05] tracking-tight"
            style={{ color: IVORY }}
          >
            This Is How You Take Shilajit
          </h1>
          <p className="mt-4 text-base sm:text-lg leading-relaxed max-w-xl mx-auto" style={{ color: `${IVORY}B3` }}>
            A simple ritual, done consistently. Here's your ABIXMART story, scene by scene.
          </p>
        </div>
      </section>

      {/* PERSONALIZED SIX-IMAGE RITUAL, or a direct age/gender ask
          if the user landed here without valid query params — no
          extra "reveal" click, straight into the question. */}
      {hasPersonalizedStory ? (
        <PersonalizedRitualTimeline age={validAge} gender={validGender} />
      ) : (
        <section className="pt-10 lg:pt-14 pb-16 lg:pb-24 border-t" style={{ background: ABIX.espresso, borderColor: `${IVORY}0D` }}>
          <div className="mx-auto max-w-2xl px-6 lg:px-10 text-center">
            <Eyebrow light>Personalize Your Ritual</Eyebrow>
            <div className="mt-8">
              <PersonalizedRitualSelector />
            </div>
          </div>
        </section>
      )}
    </PageTransition>
  );
}