import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useSyncExternalStore,
} from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useCatalog } from '@/lib/CatalogContext';
import { createCartStore, createGuestStorage } from '@/lib/cartStore';
import { cartRemote } from '@/lib/cartRemote';
import { bundleCeiling, clampJars, resolveLine } from '@/lib/cartPricing';

const ShopContext = createContext(null);

function mergeWishlistIds(localIds, remoteIds) {
  return Array.from(new Set([...localIds, ...remoteIds]));
}

// localStorage can throw just by being touched (blocked storage); the guest
// cart then falls back to memory.
function safeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function ShopProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { getProductById: productById, loading: catalogLoading } = useCatalog();
  const uid = user?.uid ?? null;

  const [wishlist, setWishlist] = useState([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPrefill, setCheckoutPrefill] = useState(null);
  const [assistOpen, setAssistOpen] = useState(false);
  // cartOpen/openCart/closeCart are kept only so CartDrawer.jsx still compiles.
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  /* ───────────────────────── cart ─────────────────────────
     Source of truth: Firestore carts/{uid} for signed-in users, localStorage
     for guests. All loading / saving / merging lives in src/lib/cartStore.js;
     this component only connects it to React and to the product catalog. */

  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = createCartStore({
      remote: cartRemote,
      guest: createGuestStorage(safeLocalStorage()),
    });
  }
  const store = storeRef.current;
  const cartSnap = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  // Always the latest catalog, without making the helpers below change.
  const catalogRef = useRef(productById);
  catalogRef.current = productById;

  const storeHelpers = useMemo(
    () => ({
      // Hold a stored quantity at what the product allows.
      clamp: (id, jars) => {
        const product = catalogRef.current(id);
        return product ? clampJars(product, jars) : Math.max(1, Math.floor(Number(jars)) || 1);
      },
      // Older saved carts counted PACKAGES (qty) of a variant; convert to jars.
      legacyJars: (item) => {
        const product = catalogRef.current(item.id);
        const packs = Math.max(1, Math.floor(Number(item.qty)) || 1);
        const variant = item.variantId
          ? (product?.variants || []).find((v) => v.id === item.variantId)
          : null;
        const perPack = variant && Number(variant.jars) >= 1 ? Number(variant.jars) : 1;
        return packs * perPack;
      },
    }),
    []
  );

  // Connect the cart to the signed-in user (or the guest) once auth and the
  // catalog are both ready. Calling attach() again for the same user is a no-op.
  useEffect(() => {
    if (authLoading || catalogLoading) return;
    store.attach(uid, storeHelpers);
  }, [authLoading, catalogLoading, uid, store, storeHelpers]);

  // A tab that was in the background re-reads its saved cart when it comes
  // back, and unsaved changes are retried when the connection returns.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      store.retry();
      store.refresh();
    };
    const onOnline = () => store.retry();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [store]);

  // Adds jars to the cart. `qty` is a number of jars. For older callers that
  // pass a variant, `qty` is a number of that variant's packages (as before).
  // Returns true when the product can be bought, false when it was refused.
  const addToCart = useCallback(
    (id, qty = 1, variant = null) => {
      const product = productById(id);
      if (!product || product.status !== 'available') {
        // eslint-disable-next-line no-console
        console.warn('[ABIXMART] Refused to add a product that is not available:', id);
        return false;
      }

      let jars = Math.max(1, Math.floor(Number(qty)) || 1);
      if (variant?.id) {
        const v = (product.variants || []).find((x) => x.id === variant.id);
        if (!v) {
          // eslint-disable-next-line no-console
          console.warn('[ABIXMART] Refused to add an unknown variant:', id, variant.id);
          return false;
        }
        jars *= Number(v.jars) >= 1 ? Number(v.jars) : 1;
      }

      store.add(id, jars, bundleCeiling(product));
      return true;
    },
    [productById, store]
  );

  const removeFromCart = useCallback((id) => store.remove(id), [store]);

  // `qty` is the number of jars. The third argument (old variantId) is ignored:
  // the variant is always derived from the jar count.
  const updateQty = useCallback(
    (id, qty) => {
      const n = Math.floor(Number(qty));
      if (!Number.isFinite(n) || n < 1) {
        store.remove(id);
        return;
      }
      const product = productById(id);
      store.setJars(id, n, product ? bundleCeiling(product) : Infinity);
    },
    [productById, store]
  );

  const clearCart = useCallback(() => store.clear(), [store]);
  const retryCart = useCallback(() => store.retry(), [store]);

  /* ───────────────────────── wishlist (unchanged) ───────────────────────── */

  const wishHydratedUidRef = useRef(null);
  const skipNextWishlistSaveRef = useRef(false);

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
      if (wishHydratedUidRef.current) {
        wishHydratedUidRef.current = null;
        setWishlist([]);
      }
      return;
    }

    if (wishHydratedUidRef.current === user.uid) return;

    let cancelled = false;

    (async () => {
      let mergedWishlist = [];

      skipNextWishlistSaveRef.current = true;

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
      wishHydratedUidRef.current = user.uid;

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
    if (!user || wishHydratedUidRef.current !== user.uid) return;
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

  /* ───────────────────────── derived cart ─────────────────────────
     Every stored line (product + jars) is re-resolved against the live
     catalog, so the variant, the price and the displayed quantity are always
     derived from the same jar count.

     cartItems keeps the shape checkout already reads:
       qty        = packages (1 for a bundle) so that subtotal = unitPrice x qty
       jars       = what the customer sees as the quantity
     unavailableItems = lines that cannot be bought. They stay in the cart
     until the customer removes them. While the first catalog read is in
     flight nothing is classified. */
  const { cartItems, unavailableItems } = useMemo(() => {
    const ok = [];
    const bad = [];
    if (catalogLoading) return { cartItems: ok, unavailableItems: bad };

    cartSnap.lines.forEach(({ id, jars }) => {
      const product = productById(id);
      const base = { id, jars, qty: jars, variantId: null, variantLabel: null };

      if (!product || product.status !== 'available') {
        bad.push({ ...base, product: product || null, reason: 'unavailable' });
        return;
      }

      const r = resolveLine(product, jars);
      if (!r) {
        bad.push({ ...base, product, reason: 'no-price' });
        return;
      }

      ok.push({
        id,
        product,
        jars: r.jars,
        qty: r.packages,
        variantId: r.variantId,
        variantLabel: r.variantLabel,
        unitPrice: r.unitPrice,
        jarsPerPack: r.jarsPerPack,
        subtotal: r.subtotal,
        maxJars: bundleCeiling(product),
      });
    });

    return { cartItems: ok, unavailableItems: bad };
  }, [cartSnap.lines, productById, catalogLoading]);

  // Same lines the store holds, in the shape older screens read.
  const cart = useMemo(
    () => cartSnap.lines.map((l) => ({ id: l.id, jars: l.jars, qty: l.jars, variantId: null })),
    [cartSnap.lines]
  );

  const cartCount = useMemo(() => cartSnap.lines.reduce((n, l) => n + l.jars, 0), [cartSnap.lines]);
  const cartTotal = useMemo(() => cartItems.reduce((sum, c) => sum + c.subtotal, 0), [cartItems]);

  // true until the saved cart has loaded; 'load' = it could not be loaded,
  // 'save' = the latest change could not be saved yet (it keeps retrying).
  const cartResolving = catalogLoading || cartSnap.status === 'idle' || cartSnap.status === 'hydrating';
  const cartError = cartSnap.status === 'error' ? 'load' : cartSnap.syncState === 'error' ? 'save' : null;

  const value = {
    cart, cartItems, unavailableItems, cartResolving, cartError, retryCart, cartCount, cartTotal,
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