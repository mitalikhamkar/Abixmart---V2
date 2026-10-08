import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useCatalog } from '@/lib/CatalogContext';

const ShopContext = createContext(null);

// A cart line is uniquely identified by product id + variant id
// (null variant = "the plain product").
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
  // cartOpen/openCart/closeCart are kept only so CartDrawer.jsx still compiles.
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const hydratedUidRef = useRef(null);
  const skipNextCartSaveRef = useRef(false);
  const skipNextWishlistSaveRef = useRef(false);

  const { getProductById: productById, loading: catalogLoading } = useCatalog();

  // G4: only `available` products with an existing variant can be added.
  // The price and label are taken from the catalog, never from the caller.
  // Returns true when the line was added, false when it was refused.
  const addToCart = useCallback(
    (id, qty = 1, variant = null) => {
      const product = productById(id);
      if (!product || product.status !== 'available') {
        // eslint-disable-next-line no-console
        console.warn('[ABIXMART] Refused to add a product that is not available:', id);
        return false;
      }

      const variantId = variant?.id ?? null;
      let variantLabel = null;
      let unitPrice = null;
      if (variantId) {
        const v = (product.variants || []).find((x) => x.id === variantId);
        if (!v) {
          // eslint-disable-next-line no-console
          console.warn('[ABIXMART] Refused to add an unknown variant:', id, variantId);
          return false;
        }
        variantLabel = v.name;
        unitPrice = v.price;
      }

      const addQty = Math.max(1, Math.floor(Number(qty) || 1));
      const key = `${id}:${variantId || ''}`;

      setCart((prev) => {
        const existingIndex = prev.findIndex((c) => cartKey(c) === key);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], qty: updated[existingIndex].qty + addQty };
          return updated;
        }
        return [...prev, { id, qty: addQty, variantId, variantLabel, unitPrice }];
      });
      return true;
    },
    [productById]
  );

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

  // G4: every cart line is re-resolved against the live catalog.
  //   cartItems        = purchasable lines only (product is `available`, the
  //                      variant still exists, a price exists). Price, label
  //                      and jarsPerPack come from the catalog, so a stale
  //                      stored unitPrice can never be charged.
  //   unavailableItems = lines that cannot be bought (product missing/not
  //                      available, variant removed, no price). They stay in
  //                      the cart until the customer removes them.
  // While the first catalog read is in flight nothing is classified.
  const { cartItems, unavailableItems } = useMemo(() => {
    const ok = [];
    const bad = [];
    if (catalogLoading) return { cartItems: ok, unavailableItems: bad };

    cart.forEach((c) => {
      const product = productById(c.id);
      if (!product || product.status !== 'available') {
        bad.push({ ...c, product: product || null, reason: 'unavailable' });
        return;
      }

      let unitPrice;
      let jarsPerPack = 1;
      let variantLabel = c.variantLabel ?? null;

      if (c.variantId) {
        const v = (product.variants || []).find((x) => x.id === c.variantId);
        if (!v) {
          bad.push({ ...c, product, reason: 'variant-missing' });
          return;
        }
        unitPrice = v.price;
        jarsPerPack = v.jars || 1;
        variantLabel = v.name;
      } else {
        unitPrice = product.price;
      }

      if (unitPrice === null || unitPrice === undefined || !Number.isFinite(unitPrice)) {
        bad.push({ ...c, product, reason: 'no-price' });
        return;
      }

      ok.push({ ...c, product, variantLabel, unitPrice, jarsPerPack, subtotal: unitPrice * c.qty });
    });

    return { cartItems: ok, unavailableItems: bad };
  }, [cart, productById, catalogLoading]);

  const cartCount = useMemo(() => cart.reduce((n, c) => n + c.qty, 0), [cart]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, c) => sum + c.subtotal, 0), [cartItems]);

  const value = {
    cart, cartItems, unavailableItems, cartResolving: catalogLoading, cartCount, cartTotal,
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