import { useMemo } from 'react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import { products as staticProducts, ritualBundles } from '@/data/products';
import { buildProductDocument, normalizeProduct } from '@/lib/productSchema';

// Admin read access to the product catalog.
//
// source "firestore": the Firestore `products` collection has documents and
//   is the canonical catalog.
// source "static":    the collection is empty (seed not run yet) or could not
//   be read, so the existing static catalog is shown instead. It goes through
//   the same schema mapping, so both sources return the same shape.
//
// Read-only: nothing here writes to Firestore.

const STATIC_BY_ID = Object.fromEntries(staticProducts.map((p) => [p.id, p]));

function withImage(product) {
  return {
    ...product,
    // Uploaded image URL first, else the bundled asset for that product ID.
    shopImage: product.images.primary || STATIC_BY_ID[product.id]?.shopImage || null,
  };
}

export function useAdminProducts() {
  const { data, loading, error } = useAdminCollection('products');

  return useMemo(() => {
    if (!loading && !error && data.length > 0) {
      const products = data
        .map((doc) => withImage(normalizeProduct(doc)))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      return { products, source: 'firestore', loading: false, error: null };
    }

    const products = staticProducts.map((p, i) =>
      withImage(normalizeProduct({ id: p.id, ...buildProductDocument(p, ritualBundles, (i + 1) * 10) }))
    );
    return { products, source: 'static', loading, error: error || null };
  }, [data, loading, error]);
}