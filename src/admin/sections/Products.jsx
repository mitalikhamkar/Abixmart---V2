import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';

// Reads from Firestore `products/{productId}` — separate from
// src/data/products.js, the static catalog the live customer site
// currently uses. Empty until products actually exist in Firestore.
export default function Products() {
  const { data: products, loading, error } = useAdminCollection('products');

  return (
    <div className="space-y-6">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Products</h1>
      </div>

      {loading ? (
        <LoadingState label="Loading products…" />
      ) : error ? (
        <ErrorState message="Could not load products. Please refresh." />
      ) : products.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No products in Firestore yet"
          body="The live site currently uses a static product catalog. Once products are added to the Firestore products collection, they'll appear here for management."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className="border border-charcoal/10 bg-ivory rounded-md p-4">
              <p className="text-charcoal font-medium truncate">{p.name || 'Untitled product'}</p>
              <p className="text-sm text-charcoal/50 mt-1">{p.price ? `₹${p.price}` : 'No price set'}</p>
              <p className="text-xs text-charcoal/40 mt-1">Stock: {p.stock ?? '—'}</p>
              <span className={`label-meta inline-block mt-2 ${p.active === false ? 'text-charcoal/35' : 'text-green-600'}`}>
                {p.active === false ? 'Inactive' : 'Active'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}