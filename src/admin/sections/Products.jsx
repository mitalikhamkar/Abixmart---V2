import React from 'react';
import { products, categories } from '@/data/products';

// READ-ONLY view of the existing application catalog (src/data/products.js),
// which is what the customer website, cart, wishlist and checkout use today.
// This is NOT an editable Firestore product database, and nothing here
// writes to Firestore. Firestore-backed product management is a separate,
// later phase.

const CATEGORY_LABELS = Object.fromEntries(categories.map((c) => [c.key, c.label]));

export default function Products() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Products</h1>
      </div>

      <div className="border border-charcoal/10 bg-ivory rounded-md p-4 sm:p-5">
        <span className="label-meta text-resin">Application catalog · Read-only</span>
        <p className="mt-2 text-sm text-charcoal/60 leading-relaxed">
          These {products.length} products come from the existing website catalog
          (<code className="text-charcoal/70">src/data/products.js</code>), not from an editable Firestore product
          database. Editing and stock management will be added in a later phase.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => {
          const available = p.status === 'available';
          return (
            <div key={p.id} className="border border-charcoal/10 bg-ivory rounded-md p-4">
              <div className="h-32 rounded-md bg-charcoal/[0.04] flex items-center justify-center overflow-hidden">
                {p.shopImage && (
                  <img src={p.shopImage} alt={p.name} className="h-full w-full object-contain p-2" />
                )}
              </div>

              <p className="mt-3 text-charcoal font-medium truncate">{p.name}</p>
              {p.subtitle && <p className="text-xs text-charcoal/50 mt-0.5">{p.subtitle}</p>}

              <p className="text-sm text-charcoal mt-2 font-price">
                {available && p.price !== null && p.price !== undefined ? `${p.currency || '₹'}${p.price}` : 'Coming Soon'}
              </p>

              {p.shortDesc && <p className="text-xs text-charcoal/55 mt-2 leading-relaxed">{p.shortDesc}</p>}

              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/40">Category</dt>
                  <dd className="text-charcoal/70">{CATEGORY_LABELS[p.category] || p.category || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/40">Slug</dt>
                  <dd className="text-charcoal/70">{p.slug || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-charcoal/40">ID</dt>
                  <dd className="text-charcoal/70">{p.id}</dd>
                </div>
              </dl>

              <span className={`label-meta inline-block mt-3 ${available ? 'text-green-600' : 'text-charcoal/35'}`}>
                {available ? 'Available' : 'Coming Soon'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}