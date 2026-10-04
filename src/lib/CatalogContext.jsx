// src/lib/CatalogContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { products as staticProducts, ritualBundles } from '@/data/products';
import { buildProductDocument, isVisibleToCustomers, normalizeProduct } from '@/lib/productSchema';

// Customer-facing product catalog (G3).
//
// Source of truth: the Firestore `products` collection, read with the
// customer Firebase instance. Only `available` and `coming_soon` products are
// requested; `draft` and `archived` are never fetched (the Firestore rules
// enforce the same restriction on the server).
//
// src/data/products.js is used for two things only:
//   1. Bundled image assets, merged in by product ID when a Firestore product
//      has no image URL of its own (so the real Shilajit assets are kept).
//   2. A fallback catalog, used ONLY when the Firestore read fails with an
//      error. A successful read that returns zero documents is an empty
//      catalog, not a reason to show static data.
//
// While the first read is in flight, `loading` is true and `products` is
// empty, so static data is never shown and then swapped out.

const CatalogContext = createContext(null);

const PUBLIC_STATUSES = ['available', 'coming_soon'];
const STATIC_BY_ID = Object.fromEntries(staticProducts.map((p) => [p.id, p]));

// Firestore document ({ id, ...data }) -> the product shape the customer UI
// already uses. normalizeProduct (G1 schema) does the field mapping; images
// come from the document's URL when set, else from the bundled asset.
function toCustomerProduct(raw) {
  const product = normalizeProduct(raw);
  const bundled = STATIC_BY_ID[product.id];
  return {
    ...product,
    image: product.images.primary || bundled?.image || null,
    shopImage: product.images.primary || bundled?.shopImage || null,
  };
}

function sortCatalog(list) {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

// Built once, through the same schema mapping, so the fallback has exactly
// the same shape as the Firestore catalog (including variants).
const STATIC_FALLBACK = sortCatalog(
  staticProducts.map((p, i) =>
    toCustomerProduct({ id: p.id, ...buildProductDocument(p, ritualBundles, (i + 1) * 10) })
  )
);

export function CatalogProvider({ children }) {
  const [state, setState] = useState({ loading: true, source: 'firestore', products: [], error: null });

  useEffect(() => {
    const q = query(collection(db, 'products'), where('status', 'in', PUBLIC_STATUSES));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const products = sortCatalog(
          snap.docs
            .map((d) => toCustomerProduct({ ...d.data(), id: d.id }))
            .filter(isVisibleToCustomers)
        );
        setState({ loading: false, source: 'firestore', products, error: null });
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error(
          '[ABIXMART] Could not read the product catalog from Firestore; using the built-in catalog.',
          err?.code,
          err?.message
        );
        setState({ loading: false, source: 'static', products: STATIC_FALLBACK, error: err });
      }
    );

    return unsubscribe;
  }, []);

  const value = useMemo(() => {
    const { products } = state;
    const byId = new Map(products.map((p) => [p.id, p]));
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return {
      products,
      availableProducts: products.filter((p) => p.status === 'available'),
      comingSoonProducts: products.filter((p) => p.status === 'coming_soon'),
      loading: state.loading,
      source: state.source,
      error: state.error,
      getProductById: (id) => byId.get(id),
      getProductBySlug: (slug) => bySlug.get(slug),
    };
  }, [state]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}