import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { products } from '@/data/products';

// Shop context for the prototype: cart, wishlist, search, checkout & assist UI.
const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [cart, setCart] = useState([]); // [{ id, qty }]
  const [wishlist, setWishlist] = useState([]); // [id]
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPrefill, setCheckoutPrefill] = useState(null);
  const [assistOpen, setAssistOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const productById = useCallback((id) => products.find((p) => p.id === id), []);

  const addToCart = useCallback((id, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) return prev.map((c) => (c.id === id ? { ...c, qty: c.qty + qty } : c));
      return [...prev, { id, qty }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty } : c)));
  }, [removeFromCart]);

  const toggleWishlist = useCallback((id) => {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  }, []);

  const isInWishlist = useCallback((id) => wishlist.includes(id), [wishlist]);

  const openCheckout = useCallback((prefill = null) => {
    setCheckoutPrefill(prefill);
    setCheckoutOpen(true);
    setAssistOpen(false);
    setCartOpen(false);
  }, []);

  const closeCheckout = useCallback(() => {
    setCheckoutOpen(false);
    setCheckoutPrefill(null);
  }, []);

  const openAssist = useCallback(() => setAssistOpen(true), []);
  const closeAssist = useCallback(() => setAssistOpen(false), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const cartCount = useMemo(() => cart.reduce((n, c) => n + c.qty, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + (productById(c.id)?.price || 0) * c.qty, 0),
    [cart, productById]
  );
  const cartItems = useMemo(
    () => cart.map((c) => ({ ...c, product: productById(c.id) })).filter((c) => c.product),
    [cart, productById]
  );

  const value = {
    cart, cartItems, cartCount, cartTotal,
    addToCart, removeFromCart, updateQty,
    wishlist, toggleWishlist, isInWishlist, wishlistCount: wishlist.length,
    checkoutOpen, checkoutPrefill, openCheckout, closeCheckout,
    assistOpen, openAssist, closeAssist,
    cartOpen, openCart, closeCart,
    searchOpen, openSearch, closeSearch,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}