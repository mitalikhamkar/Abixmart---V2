import React from 'react';

// Order / inquiry statuses render as filled pills with a dot.
const ORDER_KEYS = new Set([
  'new', 'contacted', 'resolved',
  'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled',
  'packed', 'pending',
]);

// Payment statuses render as square-cornered, outlined badges so they
// are never mistaken for an order status.
const PAYMENT_KEYS = new Set(['pending', 'paid', 'failed', 'refunded']);

export default function StatusBadge({ status = 'new', kind = 'order' }) {
  const key = String(status).toLowerCase();
  // Display "out_for_delivery" as "out for delivery".
  const label = String(status).replace(/_/g, ' ');

  if (kind === 'payment') {
    const variant = PAYMENT_KEYS.has(key) ? `adm-p-${key}` : '';
    return (
      <span title="Payment status" className={`adm-badge adm-badge--pay ${variant}`}>
        {label}
      </span>
    );
  }

  const variant = ORDER_KEYS.has(key) ? `adm-s-${key}` : '';
  return <span className={`adm-badge ${variant}`}>{label}</span>;
}