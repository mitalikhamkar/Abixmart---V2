import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { products } from '@/data/products';

const ShopContext = createContext(null);

// A cart line is now uniquely identified by product id + variant id
// (null variant = "the plain product"), so a 1-Jar and a 2-Jar Ritual
// of the same product are correctly two separate lines instead of one
// line whose price would otherwise be recomputed as product.price×qty.
function cartKey(item) {
  return `${item.id}:${item.variantId || ''}`;
}

function mergeCartItems(localItems, remoteItems) {
  const map = new Map();
  const upsert = (item) => {
    const key = cartKey(item);
    if (map.has(key)) {
      map.set(key, { ...map.get(key), qty: map.get(key).qty + item.qty });
    } else {
      map.set(key, { ...item });
    }
  };
  localItems.forEach(upsert);
  remoteItems.forEach(upsert);
  return Array.from(map.values());
}

function mergeWishlistIds(localIds, remoteIds) {
  return Array.from(new Set([...localIds, ...remoteIds]));
}

export function ShopProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [cart, setCart] = useState([]); // [{ id, qty, variantId, variantLabel, unitPrice }]
  const [wishlist, setWishlist] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPrefill, setCheckoutPrefill] = useState(null);
  const [assistOpen, setAssistOpen] = useState(false);
  // NOTE: cartOpen/openCart/closeCart are kept only so CartDrawer.jsx
  // (which is intentionally left in the project per the brief) still
  // compiles if it's ever re-rendered. Nothing in the app calls
  // openCart() anymore — the header and every "add to cart" action
  // navigate to the /cart page instead. See ProductCard.jsx,
  // ProductDetail.jsx and Header.jsx.
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const hydratedUidRef = useRef(null);
  const skipNextCartSaveRef = useRef(false);
  const skipNextWishlistSaveRef = useRef(false);

  const productById = useCallback((id) => products.find((p) => p.id === id), []);

  // CHANGED: no longer calls setCartOpen(true). Adding to cart must
  // never open CartDrawer — the calling component (ProductCard's Quick
  // Add, ProductDetail's Add to Cart) is responsible for navigating to
  // /cart itself, so this stays a pure state update.
  const addToCart = useCallback((id, qty = 1, variant = null) => {
    setCart((prev) => {
      const variantId = variant?.id ?? null;
      const key = `${id}:${variantId || ''}`;
      const existingIndex = prev.findIndex((c) => cartKey(c) === key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], qty: updated[existingIndex].qty + qty };
        return updated;
      }
      return [
        ...prev,
        { id, qty, variantId, variantLabel: variant?.label ?? null, unitPrice: variant?.price ?? null },
      ];
    });
  }, []);

  const removeFromCart = useCallback((id, variantId = null) => {
    setCart((prev) => prev.filter((c) => !(c.id === id && (c.variantId || null) === (variantId || null))));
  }, []);

  const updateQty = useCallback((id, qty, variantId = null) => {
    if (qty < 1) return removeFromCart(id, variantId);
    setCart((prev) =>
      prev.map((c) => ((c.id === id && (c.variantId || null) === (variantId || null)) ? { ...c, qty } : c))
    );
  }, [removeFromCart]);

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

  const cartItems = useMemo(
    () =>
      cart
        .map((c) => {
          const product = productById(c.id);
          if (!product) return null;
          const unitPrice = c.unitPrice ?? product.price ?? 0;
          return { ...c, product, unitPrice, subtotal: unitPrice * c.qty };
        })
        .filter(Boolean),
    [cart, productById]
  );

  const cartCount = useMemo(() => cart.reduce((n, c) => n + c.qty, 0), [cart]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, c) => sum + c.subtotal, 0), [cartItems]);

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