import React, { useEffect, useMemo, useState } from 'react';
import { Plus, ArrowLeft, ShoppingBag } from 'lucide-react';
import { categories } from '@/data/products';
import { useAdminProducts } from '@/admin/hooks/useAdminProducts';
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS, isAvailable } from '@/lib/productSchema';
import { archiveProduct } from '@/admin/lib/productWrites';
import PageHeader from '@/admin/components/PageHeader';
import ProductForm from '@/admin/components/ProductForm';
import { LoadingState, EmptyState } from '@/admin/components/StateViews';

// Product management. The Firestore `products` collection is the canonical
// source. Until it has been seeded (or if it cannot be read) the built-in
// catalog is shown read-only and Add/Edit are disabled.
//
// Products are never deleted: "Archive" sets status = "archived".
// The public website still uses its own built-in catalog; these changes
// affect the Firestore product records only.

const CATEGORY_LABELS = Object.fromEntries(categories.map((c) => [c.key, c.label]));

function formatMoney(value, currency = '₹') {
  const n = Number(value);
  return `${currency}${Number.isFinite(n) ? n.toLocaleString('en-IN') : value}`;
}

export default function Products() {
  const { products, source, loading, error } = useAdminProducts();

  const [mode, setMode] = useState({ view: 'list' }); // { view: 'new' } | { view: 'edit', id }
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState('');
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [archiveError, setArchiveError] = useState({});

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  const canEdit = source === 'firestore' && !loading;
  const editing = mode.view === 'edit' ? products.find((p) => p.id === mode.id) : null;
  const formOpen = canEdit && (mode.view === 'new' || (mode.view === 'edit' && editing));

  const visible = useMemo(
    () => (statusFilter === 'all' ? products : products.filter((p) => p.status === statusFilter)),
    [products, statusFilter]
  );

  const closeForm = () => setMode({ view: 'list' });

  const handleSaved = (message) => {
    setMode({ view: 'list' });
    setNotice(message);
    window.scrollTo({ top: 0 });
  };

  const handleArchive = async (p) => {
    if (archiving) return;
    setArchiving(p.id);
    setArchiveError({});
    try {
      await archiveProduct(p.id);
      setArchiveTarget(null);
      setNotice(`"${p.name}" was archived. The product stays in Firestore.`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART Admin] Failed to archive product', err?.code, err?.message);
      setArchiveError({
        id: p.id,
        message:
          err?.code === 'permission-denied'
            ? 'Archive rejected: this account is not permitted to write products.'
            : 'Could not archive the product. Please try again.',
      });
    } finally {
      setArchiving(null);
    }
  };

  if (formOpen) {
    const isNew = mode.view === 'new';
    return (
      <div className="adm-page">
        <PageHeader
          title={isNew ? 'Add Product' : 'Edit Product'}
          description={
            isNew
              ? 'The product ID is created from the slug and cannot be changed afterwards.'
              : `Product ID: ${editing.id} (fixed — it cannot be changed).`
          }
        >
          <button type="button" className="adm-btn" onClick={closeForm}>
            <ArrowLeft size={13} /> Back to products
          </button>
        </PageHeader>

        <ProductForm
          key={isNew ? 'new' : editing.id}
          product={isNew ? null : editing}
          products={products}
          onCancel={closeForm}
          onSaved={handleSaved}
        />
      </div>
    );
  }

  return (
    <div className="adm-page">
      <PageHeader title="Products">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adm-select"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>{PRODUCT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button
          type="button"
          className="adm-btn adm-btn--gold"
          disabled={!canEdit}
          onClick={() => setMode({ view: 'new' })}
          title={canEdit ? undefined : 'Seed the Firestore catalog first'}
        >
          <Plus size={14} /> Add Product
        </button>
      </PageHeader>

      {loading ? (
        <LoadingState label="Loading products…" />
      ) : (
        <>
          {notice && <div className="adm-notice" role="status">{notice}</div>}

          <div className="adm-note">
            {source === 'firestore' ? (
              <>
                <span className="adm-label adm-label--gold">Firestore catalog</span>
                <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
                  {products.length} product{products.length === 1 ? '' : 's'} read live from the Firestore{' '}
                  <code className="adm-code">products</code> collection. Changes are saved to Firestore; the public
                  website still uses its built-in catalog until a later phase.
                </p>
              </>
            ) : (
              <>
                <span className="adm-label adm-label--gold">Application catalog · Read-only</span>
                <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
                  {error
                    ? 'The Firestore products collection could not be read, so the built-in catalog is shown.'
                    : 'The Firestore products collection is empty, so the built-in catalog is shown.'}{' '}
                  Adding and editing are disabled until it is seeded: run{' '}
                  <code className="adm-code">node scripts/seedProducts.mjs</code>.
                </p>
              </>
            )}
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="No products with this status" body="Choose another status filter." />
          ) : (
            <div className="adm-grid">
              {visible.map((p) => {
                const available = isAvailable(p);
                const hasPrice = available && p.price !== null;
                const statusLabel = PRODUCT_STATUS_LABELS[p.status] || p.status;
                const confirming = archiveTarget === p.id;
                return (
                  <div key={p.id} className={`adm-panel adm-card${p.status === 'archived' ? ' is-archived' : ''}`}>
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

                    <p className="adm-row-meta" style={{ marginTop: '0.4rem', lineHeight: 1.6 }}>
                      {p.variants.length === 0
                        ? 'No variants'
                        : `${p.variants.length} variant${p.variants.length === 1 ? '' : 's'}: ${p.variants
                            .map((v) => `${v.name} ${formatMoney(v.price, p.currency)}`)
                            .join(' · ')}`}
                    </p>

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

                    {canEdit && (
                      <div className="adm-card-actions">
                        <button type="button" className="adm-btn adm-btn--sm" onClick={() => setMode({ view: 'edit', id: p.id })}>
                          Edit
                        </button>
                        {p.status !== 'archived' && !confirming && (
                          <button type="button" className="adm-btn adm-btn--sm adm-btn--danger" onClick={() => setArchiveTarget(p.id)}>
                            Archive
                          </button>
                        )}
                      </div>
                    )}

                    {confirming && (
                      <div className="adm-confirm">
                        <p>Archive “{p.name}”? It stays in Firestore and in past orders, and can be restored by editing its status.</p>
                        <div className="adm-card-actions" style={{ borderTop: 0, paddingTop: 0, marginTop: '0.75rem' }}>
                          <button
                            type="button"
                            className="adm-btn adm-btn--sm adm-btn--danger"
                            disabled={archiving === p.id}
                            onClick={() => handleArchive(p)}
                          >
                            {archiving === p.id ? 'Archiving…' : 'Confirm archive'}
                          </button>
                          <button
                            type="button"
                            className="adm-btn adm-btn--sm"
                            disabled={archiving === p.id}
                            onClick={() => setArchiveTarget(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {archiveError.id === p.id && <p className="adm-formerror">{archiveError.message}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}