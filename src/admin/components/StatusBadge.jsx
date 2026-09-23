import React from 'react';

const STYLES = {
  new: 'bg-resin/10 text-resin',
  contacted: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status = 'new' }) {
  const key = String(status).toLowerCase();
  const cls = STYLES[key] || 'bg-charcoal/8 text-charcoal/60';
  return (
    <span className={`label-meta inline-flex items-center px-2.5 py-1 rounded-full capitalize ${cls}`}>
      {status}
    </span>
  );
}