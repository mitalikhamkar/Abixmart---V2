// src/components/abix/about/AboutRail.jsx
// The About page's chapters, shown on the shared gold-stem rail.
import React from 'react';
import ChapterRail from '@/components/abix/ChapterRail';

const CHAPTERS = [
  { id: 'about-hero', label: 'Welcome' },
  { id: 'principles', label: 'Principles' },
  { id: 'journey', label: 'Journey' },
  { id: 'transparency', label: 'Transparency' },
  { id: 'ritual', label: 'Ritual' },
  { id: 'closing', label: 'Beginning' },
];

export default function AboutRail() {
  return <ChapterRail chapters={CHAPTERS} label="About page chapters" />;
}