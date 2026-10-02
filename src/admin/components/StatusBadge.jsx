import React from 'react';

// Order / inquiry statuses — rounded-full pill.
const STYLES = {
  // Inquiry statuses
  new: 'bg-resin/10 text-resin',
  contacted: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  // Order statuses (orderStatus)
  placed: 'bg-resin/10 text-resin',
  confirmed: 'bg-sky-100 text-sky-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-blue-100 text-blue-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  // Legacy / fallback values
  packed: 'bg-orange-100 text-orange-700',
  pending: 'bg-amber-100 text-amber-700',
};

// Payment statuses (paymentStatus) — square-cornered, outlined, so they
// are visually distinct from the order-status pills.
const PAYMENT_STYLES = {
  pending: 'border-amber-300 bg-amber-50 text-amber-700',
  paid: 'border-green-300 bg-green-50 text-green-700',
  failed: 'border-red-300 bg-red-50 text-red-700',
  refunded: 'border-purple-300 bg-purple-50 text-purple-700',
};

export default function StatusBadge({ status = 'new', kind = 'order' }) {
  const key = String(status).toLowerCase();
  // Display "out_for_delivery" as "out for delivery".
  const label = String(status).replace(/_/g, ' ');

  if (kind === 'payment') {
    const cls = PAYMENT_STYLES[key] || 'border-charcoal/15 bg-charcoal/5 text-charcoal/60';
    return (
      <span
        title="Payment status"
        className={`label-meta inline-flex items-center px-2.5 py-1 rounded-md border capitalize ${cls}`}
      >
        {label}
      </span>
    );
  }

  const cls = STYLES[key] || 'bg-charcoal/8 text-charcoal/60';
  return (
    <span className={`label-meta inline-flex items-center px-2.5 py-1 rounded-full capitalize ${cls}`}>
      {label}
    </span>
  );
}