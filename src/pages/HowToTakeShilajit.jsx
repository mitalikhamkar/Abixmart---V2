// src/pages/HowToTakeShilajit.jsx
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import PersonalizedRitualTimeline from '@/components/abix/PersonalizedRitualTimeline';
import PersonalizedRitualSelector from '@/components/abix/PersonalizedRitualSelector';
import { AGE_GROUPS, GENDERS } from '@/data/ritualStories';

const INK = '#151417';
const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';

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
      {/* HERO */}
      <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-20" style={{ background: INK }}>
        <div className="absolute inset-0 grain opacity-[0.04] pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-6 lg:px-10 text-center">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm transition-colors mb-10"
            style={{ color: MUTED }}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <Eyebrow light>Ritual Guide</Eyebrow>
          <h1
            className="mt-5 font-display text-4xl sm:text-5xl lg:text-[56px] leading-[1.03] tracking-tight"
            style={{ color: IVORY }}
          >
            This Is How You Take Shilajit
          </h1>
          <p className="mt-6 text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: `${IVORY}B3` }}>
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
        <section className="py-16 lg:py-24 border-t" style={{ background: '#1E1C1F', borderColor: `${IVORY}0D` }}>
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