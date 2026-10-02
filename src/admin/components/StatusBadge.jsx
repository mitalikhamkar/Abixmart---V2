import React from 'react';

const STYLES = {
  // Inquiry statuses
  new: 'bg-resin/10 text-resin',
  contacted: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  // Order statuses (existing orderStatus values)
  placed: 'bg-resin/10 text-resin',
  packed: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  // Payment status / legacy
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status = 'new' }) {
  const key = String(status).toLowerCase();
  const cls = STYLES[key] || 'bg-charcoal/8 text-charcoal/60';
  // Display "out_for_delivery" as "out for delivery".
  const label = String(status).replace(/_/g, ' ');
  return (
    <span className={`label-meta inline-flex items-center px-2.5 py-1 rounded-full capitalize ${cls}`}>
      {label}
    </span>
  );
}