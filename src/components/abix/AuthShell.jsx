import React from 'react';
import logo from '@/assets/logo/Abixmart-header.png';

export default function AuthShell({ image, imageAlt = '', eyebrow, title, subtitle, footer, children }) {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center py-14 sm:py-16 overflow-hidden bg-charcoal">
      <div className="absolute inset-0">
        <img src={image} alt={imageAlt} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/75 via-charcoal/45 to-charcoal/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-transparent to-transparent" />
        <div className="absolute inset-0 grain opacity-[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-5 sm:mx-6">
        <div className="bg-charcoal/50 backdrop-blur-xl border border-ivory/15 shadow-[0_20px_60px_rgba(0,0,0,0.45)] p-7 sm:p-10">
          <img src={logo} alt="ABIXMART" className="h-8 w-auto mb-6 mix-blend-multiply" />

          {eyebrow && <span className="label-meta text-gold-light">{eyebrow}</span>}
          <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ivory leading-[1.05] tracking-tight">{title}</h1>
          {subtitle && <p className="mt-3 text-ivory/65 text-sm leading-relaxed">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <p className="mt-7 text-center text-sm text-ivory/55">{footer}</p>}
        </div>
      </div>
    </section>
  );
}