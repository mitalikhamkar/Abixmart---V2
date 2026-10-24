// src/pages/Home.jsx
import React from 'react';
import Hero from '@/components/abix/Hero';
import ShilajitShowcase from '@/components/abix/ShilajitShowcase';
import WhatsGrowingNext from '@/components/abix/WhatsGrowingNext';
import AbixmartCircle from '@/components/abix/AbixmartCircle';
import HomeReviews from '@/components/abix/HomeReviews';
import HomeRail from '@/components/abix/home/HomeRail';
import PageTransition from '@/components/abix/PageTransition';

// Order: Hero → Shilajit showcase → Pre-orders → Circle → Reviews → Footer
// (the footer is rendered by SiteLayout).
//
// Colour chain, so no section meets another at a hard seam:
//   Hero bottom (obsidian) → showcase (forest, dusk at the end)
//   → pre-orders (starts at that dusk, ends obsidian)
//   → Circle (obsidian) → Reviews (obsidian) → Footer (fades in from obsidian).
export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <ShilajitShowcase />
      <WhatsGrowingNext />
      <div id="circle">
        <AbixmartCircle />
      </div>
      <HomeReviews />
      <HomeRail />
    </PageTransition>
  );
}