// src/components/abix/BrandStrip.jsx
import React from 'react';
import { Leaf, BookOpen, ShieldCheck, Sunrise } from 'lucide-react';

const PRINCIPLES = [
  { icon: Leaf, label: 'Pure Ingredients' },
  { icon: BookOpen, label: 'Ayurvedic Wisdom' },
  { icon: ShieldCheck, label: 'Trusted Quality' },
  { icon: Sunrise, label: 'A Healthier Tomorrow' },
];

export default function BrandStrip() {
  return (
    <section className="bg-[#2B2620] py-12 lg:py-16 border-t border-[#F2ECE2]/5">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {PRINCIPLES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-3">
              <Icon size={22} className="text-[#BE8A4B]" strokeWidth={1.5} />
              <span className="label-meta text-[#D8CFC2]/80">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}