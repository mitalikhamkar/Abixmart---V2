import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { products } from '@/data/products';

const ShopContext = createContext(null);

function mergeCartItems(localItems, remoteItems) {
  const qtyById = new Map();
  localItems.forEach((item) => qtyById.set(item.id, item.qty));
  remoteItems.forEach((item) => {
    qtyById.set(item.id, (qtyById.get(item.id) || 0) + item.qty);
  });
  return Array.from(qtyById.entries()).map(([id, qty]) => ({ id, qty }));
}

function mergeWishlistIds(localIds, remoteIds) {
  return Array.from(new Set([...localIds, ...remoteIds]));
}

export function ShopProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPrefill, setCheckoutPrefill] = useState(null);
  const [assistOpen, setAssistOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const hydratedUidRef = useRef(null);
  const skipNextCartSaveRef = useRef(false);
  const skipNextWishlistSaveRef = useRef(false);

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

  // NEW — Phase 2: clears the cart locally. For an authenticated,
  // already-hydrated user this alone is sufficient: the existing
  // "save on change" effect below fires whenever `cart` changes and
  // writes { items: [], updatedAt } to carts/{uid} automatically —
  // no separate Firestore call needed here.
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

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

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (hydratedUidRef.current) {
        hydratedUidRef.current = null;
        setCart([]);
        setWishlist([]);
      }
      return;
    }

    if (hydratedUidRef.current === user.uid) return;

    let cancelled = false;

    (async () => {
      let mergedCart = [];
      let mergedWishlist = [];

      skipNextCartSaveRef.current = true;
      skipNextWishlistSaveRef.current = true;

      try {
        const cartSnap = await getDoc(doc(db, 'carts', user.uid));
        const remoteItems = cartSnap.exists() ? cartSnap.data().items || [] : [];
        if (cancelled) return;
        setCart((prevLocalCart) => {
          mergedCart = mergeCartItems(prevLocalCart, remoteItems);
          return mergedCart;
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Failed to load cart from Firestore', err?.code, err?.message);
        setCart((prevLocalCart) => {
          mergedCart = prevLocalCart;
          return prevLocalCart;
        });
      }

      try {
        const wishSnap = await getDoc(doc(db, 'wishlists', user.uid));
        const remoteIds = wishSnap.exists() ? wishSnap.data().productIds || [] : [];
        if (cancelled) return;
        setWishlist((prevLocalWishlist) => {
          mergedWishlist = mergeWishlistIds(prevLocalWishlist, remoteIds);
          return mergedWishlist;
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Failed to load wishlist from Firestore', err?.code, err?.message);
        setWishlist((prevLocalWishlist) => {
          mergedWishlist = prevLocalWishlist;
          return prevLocalWishlist;
        });
      }

      if (cancelled) return;
      hydratedUidRef.current = user.uid;

      try {
        await setDoc(doc(db, 'carts', user.uid), { items: mergedCart, updatedAt: serverTimestamp() });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Failed to save cart to Firestore', err?.code, err?.message);
      }
      try {
        await setDoc(doc(db, 'wishlists', user.uid), { productIds: mergedWishlist, updatedAt: serverTimestamp() });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Failed to save wishlist to Firestore', err?.code, err?.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  useEffect(() => {
    if (!user || hydratedUidRef.current !== user.uid) return;
    if (skipNextCartSaveRef.current) {
      skipNextCartSaveRef.current = false;
      return;
    }
    (async () => {
      try {
        await setDoc(doc(db, 'carts', user.uid), { items: cart, updatedAt: serverTimestamp() });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Failed to save cart to Firestore', err?.code, err?.message);
      }
    })();
  }, [cart, user]);

  useEffect(() => {
    if (!user || hydratedUidRef.current !== user.uid) return;
    if (skipNextWishlistSaveRef.current) {
      skipNextWishlistSaveRef.current = false;
      return;
    }
    (async () => {
      try {
        await setDoc(doc(db, 'wishlists', user.uid), { productIds: wishlist, updatedAt: serverTimestamp() });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Failed to save wishlist to Firestore', err?.code, err?.message);
      }
    })();
  }, [wishlist, user]);

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
    addToCart, removeFromCart, updateQty, clearCart,
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