import React from 'react';
import { categories } from '@/data/products';
import { useAdminProducts } from '@/admin/hooks/useAdminProducts';
import { PRODUCT_STATUS_LABELS, isAvailable } from '@/lib/productSchema';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState } from '@/admin/components/StateViews';

// READ-ONLY product list. The Firestore `products` collection is the
// canonical source; until it has been seeded (or if it cannot be read) the
// existing static catalog is shown instead and the banner says so.
// Add / Edit Product tools come in a later phase.

const CATEGORY_LABELS = Object.fromEntries(categories.map((c) => [c.key, c.label]));

function formatMoney(value, currency = '₹') {
  const n = Number(value);
  return `${currency}${Number.isFinite(n) ? n.toLocaleString('en-IN') : value}`;
}

export default function Products() {
  const { products, source, loading, error } = useAdminProducts();

  return (
    <div className="adm-page">
      <PageHeader title="Products" />

      {loading ? (
        <LoadingState label="Loading products…" />
      ) : (
        <>
          <div className="adm-note">
            {source === 'firestore' ? (
              <>
                <span className="adm-label adm-label--gold">Firestore catalog · Read-only</span>
                <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
                  These {products.length} products are read live from the Firestore{' '}
                  <code className="adm-code">products</code> collection, the canonical product source. Adding and
                  editing products will be added in a later phase.
                </p>
              </>
            ) : (
              <>
                <span className="adm-label adm-label--gold">Application catalog · Read-only</span>
                <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
                  {error
                    ? 'The Firestore products collection could not be read, so the built-in catalog is shown.'
                    : 'The Firestore products collection is empty, so the built-in catalog is shown.'}{' '}
                  Run <code className="adm-code">node scripts/seedProducts.mjs</code> to create the {products.length}{' '}
                  catalog products in Firestore.
                </p>
              </>
            )}
          </div>

          <div className="adm-grid">
            {products.map((p) => {
              const available = isAvailable(p);
              const hasPrice = available && p.price !== null;
              const statusLabel = PRODUCT_STATUS_LABELS[p.status] || p.status;
              return (
                <div key={p.id} className="adm-panel adm-card">
                  <div className="adm-card-media">
                    {p.shopImage && <img src={p.shopImage} alt={p.name} />}
                  </div>

                  <p className="adm-row-title" style={{ marginTop: '0.9rem' }}>{p.name}</p>
                  {p.subtitle && <p className="adm-row-meta" style={{ marginTop: '0.15rem' }}>{p.subtitle}</p>}

                  {hasPrice ? (
                    <p className="adm-card-price font-price">{formatMoney(p.price, p.currency)}</p>
                  ) : (
                    <p className="adm-card-price is-soon">{available ? 'Price not set' : statusLabel}</p>
                  )}

                  {p.variants.length > 0 && (
                    <p className="adm-row-meta" style={{ marginTop: '0.4rem', lineHeight: 1.6 }}>
                      {p.variants.map((v) => `${v.name} ${formatMoney(v.price, p.currency)}`).join(' · ')}
                    </p>
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

                  <span className={`adm-avail ${available ? 'is-on' : ''}`}>{statusLabel}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}