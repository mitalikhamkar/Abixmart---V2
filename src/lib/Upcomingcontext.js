// src/lib/upcomingContext.js
//
// Context + hook for the shared upcoming-product views. The provider that
// renders the dialogs lives in components/abix/upcoming/UpcomingProvider.jsx;
// this file has no component imports so the two never form an import cycle.

import { createContext, useContext } from 'react';

export const UpcomingContext = createContext(null);

// { openView(product), openPreOrder(product) }
export function useUpcoming() {
  const ctx = useContext(UpcomingContext);
  if (!ctx) throw new Error('useUpcoming must be used within UpcomingProvider');
  return ctx;
}