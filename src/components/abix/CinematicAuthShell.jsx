import React from 'react';
import logo from '@/assets/logo/Abixmart-header.png';

export default function CinematicAuthShell({ image, imageAlt = '', eyebrow, title, subtitle, footer, children }) {
  return (
    <section className="relative min-h-[100svh] w-full overflow-hidden bg-charcoal flex items-center justify-center py-10 px-4 sm:px-6">
      <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 via-charcoal/45 to-charcoal/85" />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
      <div className="absolute inset-0 grain opacity-[0.06] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[440px]">
        <div className="relative rounded-2xl border border-ivory/15 bg-charcoal/35 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] px-6 py-8 sm:px-10 sm:py-11 overflow-hidden">
          <span className="pointer-events-none absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold-light/70 to-transparent" />

          <div className="inline-flex items-center gap-2 rounded-full bg-ivory/90 backdrop-blur px-3 py-1.5 shadow-md mb-6">
            <img src={logo} alt="ABIXMART" className="h-5 w-auto object-contain" />
          </div>

          {eyebrow && <span className="label-meta text-gold-light">{eyebrow}</span>}
          {title && (
            <h1 className="mt-3 font-display text-3xl sm:text-[2.15rem] leading-tight text-ivory tracking-tight">
              {title}
            </h1>
          )}
          {subtitle && <p className="mt-2.5 text-ivory/55 text-sm leading-relaxed">{subtitle}</p>}

          <div className="mt-7">{children}</div>

          {footer && <p className="mt-7 text-center text-sm text-ivory/50">{footer}</p>}
        </div>
      </div>
    </section>
  );
}