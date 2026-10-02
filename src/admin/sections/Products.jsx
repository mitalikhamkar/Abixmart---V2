import React from 'react';
import { products, categories } from '@/data/products';
import PageHeader from '@/admin/components/PageHeader';

// READ-ONLY view of the existing application catalog (src/data/products.js),
// which is what the customer website, cart, wishlist and checkout use today.
// This is NOT an editable Firestore product database, and nothing here
// writes to Firestore. Firestore-backed product management is a separate,
// later phase.

const CATEGORY_LABELS = Object.fromEntries(categories.map((c) => [c.key, c.label]));

function formatPrice(p) {
  const n = Number(p.price);
  return `${p.currency || '₹'}${Number.isFinite(n) ? n.toLocaleString('en-IN') : p.price}`;
}

export default function Products() {
  return (
    <div className="adm-page">
      <PageHeader title="Products" />

      <div className="adm-note">
        <span className="adm-label adm-label--gold">Application catalog · Read-only</span>
        <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
          These {products.length} products come from the existing website catalog
          (<code className="adm-code">src/data/products.js</code>), not from an editable Firestore product
          database. Editing and stock management will be added in a later phase.
        </p>
      </div>

      <div className="adm-grid">
        {products.map((p) => {
          const available = p.status === 'available';
          const hasPrice = available && p.price !== null && p.price !== undefined;
          return (
            <div key={p.id} className="adm-panel adm-card">
              <div className="adm-card-media">
                {p.shopImage && <img src={p.shopImage} alt={p.name} />}
              </div>

              <p className="adm-row-title" style={{ marginTop: '0.9rem' }}>{p.name}</p>
              {p.subtitle && <p className="adm-row-meta" style={{ marginTop: '0.15rem' }}>{p.subtitle}</p>}

              {hasPrice ? (
                <p className="adm-card-price font-price">{formatPrice(p)}</p>
              ) : (
                <p className="adm-card-price is-soon">Coming Soon</p>
              )}

              {p.shortDesc && (
                <p className="adm-row-meta" style={{ marginTop: '0.6rem', lineHeight: 1.6, color: 'var(--adm-text-2)' }}>
                  {p.shortDesc}
                </p>
              )}

              <dl className="adm-kv" style={{ marginTop: '0.9rem' }}>
                <div>
                  <dt>Category</dt>
                  <dd style={{ fontSize: '0.75rem' }}>{CATEGORY_LABELS[p.category] || p.category || '—'}</dd>
                </div>
                <div>
                  <dt>Slug</dt>
                  <dd style={{ fontSize: '0.75rem' }}>{p.slug || '—'}</dd>
                </div>
                <div>
                  <dt>ID</dt>
                  <dd style={{ fontSize: '0.75rem' }}>{p.id}</dd>
                </div>
              </dl>

              <span className={`adm-avail ${available ? 'is-on' : ''}`}>
                {available ? 'Available' : 'Coming Soon'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}