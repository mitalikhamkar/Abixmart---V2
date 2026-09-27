import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AbixmartAssist from './AbixmartAssist';
import CartDrawer from './CartDrawer';
import SearchOverlay from './SearchOverlay';
import CheckoutModal from './CheckoutModal';

// Shared site chrome — header, footer, assist, cart, search, checkout.
// Pages render into <Outlet />.
//
// CHANGED: root wrapper was bg-ivory — the one light tone in the ABIX
// system, used elsewhere only as text — which fought the "one
// continuous dark environment" the rest of the palette is built around.
// Swapped to bg-charcoal so any sliver visible outside a page's own
// section backgrounds is dark, not a flash of light ivory.
export default function SiteLayout() {
  return (
    <div className="bg-charcoal min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AbixmartAssist />
      <CartDrawer />
      <SearchOverlay />
      <CheckoutModal />
    </div>
  );
}