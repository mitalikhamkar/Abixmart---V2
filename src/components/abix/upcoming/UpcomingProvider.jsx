// src/components/abix/upcoming/UpcomingProvider.jsx
//
// One place that owns the "upcoming product" dialogs, so Home, Shop, About
// and the product pages all open exactly the same views:
//   openView(product)      the product-information view
//   openPreOrder(product)  the pre-order interest form
//
// Mount it once inside <Router> and inside <CatalogProvider> (see App.jsx).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useCatalog } from '@/lib/CatalogContext';
import { UpcomingContext } from '@/lib/Upcomingcontext';
import UpcomingProductView from '@/components/abix/upcoming/UpcomingProductView';
import PreOrderDialog from '@/components/abix/upcoming/Preorderdialog';

const CLOSED = { view: null, preOrder: null, returnTo: null };

export default function UpcomingProvider({ children }) {
  const { getProductById } = useCatalog();
  const { pathname } = useLocation();
  const [ui, setUi] = useState(CLOSED);

  // Navigating anywhere closes whatever is open.
  useEffect(() => {
    setUi(CLOSED);
  }, [pathname]);

  const openView = useCallback((product) => {
    setUi({ view: product.id, preOrder: null, returnTo: null });
  }, []);

  // Opening the form from the product view returns to that view afterwards.
  const openPreOrder = useCallback((product) => {
    setUi((s) => ({ view: null, preOrder: product.id, returnTo: s.view }));
  }, []);

  const closeView = useCallback(() => setUi(CLOSED), []);
  const closePreOrder = useCallback(() => {
    setUi((s) => ({ view: s.returnTo, preOrder: null, returnTo: null }));
  }, []);

  const value = useMemo(() => ({ openView, openPreOrder }), [openView, openPreOrder]);

  // Products are looked up by id on every render, so an admin change (for
  // example a product becoming available) is reflected immediately: only
  // products that are still Coming Soon can be viewed or pre-ordered.
  const viewProduct = ui.view ? getProductById(ui.view) : null;
  const preOrderProduct = ui.preOrder ? getProductById(ui.preOrder) : null;
  const showView = viewProduct && viewProduct.status === 'coming_soon';
  const showPreOrder = preOrderProduct && preOrderProduct.status === 'coming_soon';

  return (
    <UpcomingContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {showView && (
          <UpcomingProductView key={`view-${viewProduct.id}`} product={viewProduct} onClose={closeView} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPreOrder && (
          <PreOrderDialog key={`preorder-${preOrderProduct.id}`} product={preOrderProduct} onClose={closePreOrder} />
        )}
      </AnimatePresence>
    </UpcomingContext.Provider>
  );
}