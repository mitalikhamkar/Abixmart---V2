import React from 'react';

// Small reusable micro-label — now set in Space Grotesk (the confident/
// modern half of the type system) rather than the editorial serif, and
// used more sparingly across the site than before.
export default function Eyebrow({ children, className = '', light = false, tone = 'resin' }) {
  const text = light ? 'text-ivory/70' : tone === 'moss' ? 'text-moss' : 'text-resin';
  const line = light ? 'bg-ivory/40' : tone === 'moss' ? 'bg-moss/50' : 'bg-resin/50';
  return (
    <span className={`inline-flex items-center gap-3 font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm ${text} ${className}`}>
      <span className={`h-px w-6 ${line}`} />
      {children}
    </span>
  );
}