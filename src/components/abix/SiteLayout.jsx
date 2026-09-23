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
export default function SiteLayout() {
  return (
    <div className="bg-ivory min-h-screen flex flex-col">
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