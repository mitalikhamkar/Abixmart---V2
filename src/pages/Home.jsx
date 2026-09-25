// src/pages/Home.jsx
import React from 'react';
import Hero from '@/components/abix/Hero';
import NatureFilm from '@/components/abix/NatureFilm';
import ProductShowcase from '@/components/abix/ProductShowcase';
import WhatsGrowingNext from '@/components/abix/WhatsGrowingNext';
import AbixmartCircle from '@/components/abix/AbixmartCircle';
import Footer from '@/components/abix/Footer';
import PageTransition from '@/components/abix/PageTransition';
import SectionDivider from '@/components/abix/SectionDivider';
import { ABIX } from '@/components/abix/brandColors';

// One shared SectionDivider at every boundary, including Hero→Video
// (which previously had none). Colors are matched exactly to what
// each neighboring section actually renders at that edge, so there's
// no more mismatched-band problem.
export default function Home() {
  return (
    <PageTransition>
      <Hero />
      <SectionDivider fromColor={ABIX.obsidian} toColor={ABIX.blackOlive} />
      <NatureFilm />
      <SectionDivider fromColor={ABIX.blackOlive} toColor={ABIX.deep} flip />
      <ProductShowcase />
      <SectionDivider fromColor={ABIX.deep} toColor={ABIX.darkMoss} />
      <WhatsGrowingNext />
      <SectionDivider fromColor={ABIX.darkMoss} toColor={ABIX.blackOlive} flip />
      <AbixmartCircle />
      <SectionDivider fromColor={ABIX.blackOlive} toColor={ABIX.deep} />
      <Footer />
    </PageTransition>
  );
}