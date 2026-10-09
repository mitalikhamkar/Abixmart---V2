import React, { useMemo, useState } from 'react';
import { Star, Check, X, EyeOff, Search } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '@/admin/lib/adminFirebase';
import { useAdminAuth } from '@/admin/lib/AdminAuthContext';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import { formatDateTime } from '@/admin/utils/format';
import { REVIEWS_COLLECTION, REVIEW_STATUS, normalizeReview } from '@/lib/reviewUtils';

const STATUSES = [
  REVIEW_STATUS.PENDING,
  REVIEW_STATUS.APPROVED,
  REVIEW_STATUS.REJECTED,
  REVIEW_STATUS.HIDDEN,
];

// Local badge: the shared StatusBadge only styles order/inquiry statuses.
const BADGE_STYLE = {
  pending: { color: '#C7AE7D', border: '#C7AE7D' },
  approved: { color: '#8FB28A', border: '#8FB28A' },
  rejected: { color: '#C98473', border: '#C98473' },
  hidden: { color: '#9a9a8f', border: '#9a9a8f' },
};

function ReviewStatusBadge({ status }) {
  const s = BADGE_STYLE[status] || BADGE_STYLE.hidden;
  return (
    <span
      style={{
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 999,
        padding: '0.1rem 0.6rem',
        fontSize: '0.7rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
}

function Stars({ rating }) {
  return (
    <span aria-label={`${rating} out of 5`} style={{ display: 'inline-flex', gap: 2, color: '#B49A62' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} fill={n <= rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export default function Reviews() {
  const { user: adminUser } = useAdminAuth();
  const { data: rawReviews, loading, error } = useAdminCollection(REVIEWS_COLLECTION, {
    orderByField: 'createdAt',
    direction: 'desc',
  });
  // Used only to show product names; falls back to the product id.
  const { data: products } = useAdminCollection('products');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const productNames = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p.name || p.title || p.id));
    return map;
  }, [products]);

  const reviews = useMemo(
    () => rawReviews.map((r) => normalizeReview(r.id, r)),
    [rawReviews]
  );

  const counts = useMemo(() => {
    const c = { all: reviews.length, pending: 0, approved: 0, rejected: 0, hidden: 0 };
    reviews.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status] += 1;
    });
    return c;
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = reviews;
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.displayName, r.text, r.productId, productNames.get(r.productId)].some((f) =>
          (f || '').toLowerCase().includes(q)
        )
      );
    }

    // Pending first so they are never buried, then newest first.
    return [...list].sort((a, b) => {
      const ap = a.status === REVIEW_STATUS.PENDING ? 0 : 1;
      const bp = b.status === REVIEW_STATUS.PENDING ? 0 : 1;
      return ap - bp || b.createdAtMs - a.createdAtMs;
    });
  }, [reviews, statusFilter, search, productNames]);

  const setStatus = async (id, status) => {
    setUpdatingId(id);
    setActionError('');
    try {
      await updateDoc(doc(db, REVIEWS_COLLECTION, id), {
        status,
        updatedAt: serverTimestamp(),
        moderatedAt: serverTimestamp(),
        moderatedBy: adminUser?.uid || null,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART Admin] Failed to update review status:', err?.code, err?.message);
      setActionError('Could not update that review. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="adm-page">
      <PageHeader title="Reviews">
        <div className="adm-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews..."
            className="adm-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adm-select"
        >
          <option value="all">All statuses ({counts.all})</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s} ({counts[s]})
            </option>
          ))}
        </select>
      </PageHeader>

      {counts.pending > 0 && (
        <p className="adm-row-meta" style={{ marginBottom: '0.9rem', color: '#C7AE7D' }}>
          {counts.pending} {counts.pending === 1 ? 'review is' : 'reviews are'} waiting for approval.
        </p>
      )}

      {actionError && (
        <p role="alert" className="adm-row-meta" style={{ marginBottom: '0.9rem', color: '#C98473' }}>
          {actionError}
        </p>
      )}

      {loading ? (
        <LoadingState label="Loading reviews..." />
      ) : error ? (
        <ErrorState message="Could not load reviews. Please refresh." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews found"
          body="Reviews submitted by customers will appear here for moderation."
        />
      ) : (
        <div className="adm-stack">
          {filtered.map((r) => {
            const pending = r.status === REVIEW_STATUS.PENDING;
            const busy = updatingId === r.id;
            return (
              <div
                key={r.id}
                className="adm-panel adm-panel-pad"
                style={pending ? { borderLeft: '3px solid #C7AE7D' } : undefined}
              >
                <div className="adm-inq">
                  <div className="min-w-0" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <p className="adm-row-title" style={{ whiteSpace: 'normal' }}>
                        {productNames.get(r.productId) || r.productId}
                      </p>
                      <ReviewStatusBadge status={r.status} />
                      <Stars rating={r.rating} />
                    </div>

                    <p className="adm-row-sub" style={{ whiteSpace: 'normal' }}>
                      {r.displayName} | uid {r.uid.slice(0, 8)}…
                    </p>

                    <p className="adm-body-text" style={{ whiteSpace: 'pre-line' }}>
                      {r.text}
                    </p>

                    <p className="adm-row-meta" style={{ marginTop: '0.7rem' }}>
                      Submitted {formatDateTime(r.createdAt)}
                    </p>
                  </div>

                  <div className="adm-inq-side">
                    <div className="adm-iconrow" style={{ flexWrap: 'wrap', gap: '0.4rem' }}>
                      <button
                        className="adm-btn"
                        disabled={busy || r.status === REVIEW_STATUS.APPROVED}
                        onClick={() => setStatus(r.id, REVIEW_STATUS.APPROVED)}
                      >
                        <Check size={13} /> Approve
                      </button>
                      <button
                        className="adm-btn"
                        disabled={busy || r.status === REVIEW_STATUS.REJECTED}
                        onClick={() => setStatus(r.id, REVIEW_STATUS.REJECTED)}
                      >
                        <X size={13} /> Reject
                      </button>
                      <button
                        className="adm-btn"
                        disabled={busy || r.status === REVIEW_STATUS.HIDDEN}
                        onClick={() => setStatus(r.id, REVIEW_STATUS.HIDDEN)}
                      >
                        <EyeOff size={13} /> Hide
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}