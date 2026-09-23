import React from 'react';

export default function StatCard({ label, value, icon: Icon, hint }) {
  return (
    <div className="border border-charcoal/10 bg-ivory rounded-md px-5 py-5">
      <div className="flex items-center justify-between">
        <span className="label-meta text-charcoal/45">{label}</span>
        {Icon && <Icon size={16} className="text-resin" />}
      </div>
      <p className="mt-3 font-display text-3xl text-charcoal">{value}</p>
      {hint && <p className="mt-1 text-xs text-charcoal/40">{hint}</p>}
    </div>
  );
}