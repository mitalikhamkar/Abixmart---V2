// src/components/abix/upcoming/UpcomingProductView.jsx
import React from 'react';
import ModalShell from '@/components/abix/upcoming/ModalShell';
import UpcomingProductContent from '@/components/abix/upcoming/UpcomingProductContent';

// The product-information dialog opened from the cards on Home, Shop and
// About. Shares its content with the full product page.
export default function UpcomingProductView({ product, onClose }) {
  const headingId = `upcoming-view-${product.id}`;

  return (
    <ModalShell labelledBy={headingId} onClose={onClose}>
      <UpcomingProductContent product={product} headingId={headingId} variant="modal" />
    </ModalShell>
  );
}