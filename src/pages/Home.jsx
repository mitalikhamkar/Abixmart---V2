// src/pages/Home.jsx
import React from 'react';
import Hero from '@/components/abix/Hero';
import BrandPhilosophy from '@/components/abix/BrandPhilosophy';
import RitualOffers from '@/components/abix/RitualOffers';
import DiscoverAbixmart from '@/components/abix/DiscoverAbixmart';
import WhatsGrowingNext from '@/components/abix/WhatsGrowingNext';
import AbixmartCircle from '@/components/abix/AbixmartCircle';
import PageTransition from '@/components/abix/PageTransition';

export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <BrandPhilosophy />
      <RitualOffers />
      <DiscoverAbixmart />
      <WhatsGrowingNext />
      <AbixmartCircle />
    </PageTransition>
  );
}