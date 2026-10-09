// src/pages/Home.jsx
import React from 'react';
import Hero from '@/components/abix/Hero';
import ProductShowcase from '@/components/abix/ProductShowcase';
import HomeReviews from '@/components/abix/HomeReviews';
import WhatsGrowingNext from '@/components/abix/WhatsGrowingNext';
import AbixmartCircle from '@/components/abix/AbixmartCircle';
import PageTransition from '@/components/abix/PageTransition';

// CHANGED: NatureFilm (the "Wellness Experience in Motion" video
// section) removed entirely per the new homepage structure. Hero now
// leads directly into ProductShowcase — see both files for the
// matched gradient that makes that one seam the focal transition.
//
// H1.1: HomeReviews sits between ProductShowcase and WhatsGrowingNext.
// Both neighbours are flat Obsidian at that seam, and HomeReviews is flat
// Obsidian too, so no new gradient seam is introduced.
export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <ProductShowcase />
      <HomeReviews />
      <WhatsGrowingNext />
      <AbixmartCircle />
    </PageTransition>
  );
}