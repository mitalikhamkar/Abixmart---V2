// src/pages/Home.jsx
import React from 'react';
import Hero from '@/components/abix/Hero';
import HowToTakeShilajitIntro from '@/components/abix/HowToTakeShilajitIntro';
import FeaturedProduct from '@/components/abix/FeaturedProduct';
import RitualOffers from '@/components/abix/RitualOffers';
import WhatsGrowingNext from '@/components/abix/WhatsGrowingNext';
import AbixmartCircle from '@/components/abix/AbixmartCircle';
import PageTransition from '@/components/abix/PageTransition';

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <HowToTakeShilajitIntro />
      <FeaturedProduct />
      <RitualOffers />
      <WhatsGrowingNext />
      <AbixmartCircle />
    </PageTransition>
  );
}