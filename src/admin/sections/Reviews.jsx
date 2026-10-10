import React, { useMemo, useState } from 'react';
import { Star, Check, X, EyeOff, Search, Sparkles } from 'lucide-react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { adminDb as db } from '@/admin/lib/adminFirebase';
import { useAdminAuth } from '@/admin/lib/AdminAuthContext';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import { formatDateTime } from '@/admin/utils/format';
import {
  REVIEWS_COLLECTION,
  REVIEW_OWNERS_COLLECTION,
  REVIEW_MODERATION_COLLECTION,
  REVIEW_STATUS,
  normalizeReview,
} from '@/lib/reviewUtils';

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

const badgeBase = {
  borderRadius: 999,
  padding: '0.1rem 0.6rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

function ReviewStatusBadge({ status }) {
  const s = BADGE_STYLE[status] || BADGE_STYLE.hidden;
  return <span style={{ ...badgeBase, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>;
}

function FeaturedBadge() {
  return (
    <span style={{ ...badgeBase, color: '#B49A62', border: '1px solid #B49A62' }}>
      <Sparkles size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
      Featured
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
  // Private ownership records: lets the admin see which customer wrote a
  // review without that id ever being stored on the public review.
  const { data: owners } = useAdminCollection(REVIEW_OWNERS_COLLECTION);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const productNames = useMemo(() => {
    const map = new Map();
    products.forEach((p) => map.set(p.id, p.name || p.title || p.id));
    return map;
  }, [products]);

  const ownerByReviewId = useMemo(() => {
    const map = new Map();
    owners.forEach((o) => {
      if (o.reviewId && o.uid) map.set(o.reviewId, o.uid);
    });
    return map;
  }, [owners]);

  const reviews = useMemo(
    () => rawReviews.map((r) => normalizeReview(r.id, r)),
    [rawReviews]
  );

  const counts = useMemo(() => {
    const c = { all: reviews.length, pending: 0, approved: 0, rejected: 0, hidden: 0, featured: 0 };
    reviews.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status] += 1;
      if (r.featured && r.status === REVIEW_STATUS.APPROVED) c.featured += 1;
    });
    return c;
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = reviews;
    if (statusFilter === 'featured') {
      list = list.filter((r) => r.featured && r.status === REVIEW_STATUS.APPROVED);
    } else if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }

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

  // One moderation action = one atomic batch: the public review changes
  // (status / featured only) and the private audit record notes who did it.
  const moderate = async (id, changes, action) => {
    setUpdatingId(id);
    setActionError('');
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, REVIEWS_COLLECTION, id), {
        ...changes,
        updatedAt: serverTimestamp(),
        moderatedAt: serverTimestamp(),
      });
      batch.set(doc(db, REVIEW_MODERATION_COLLECTION, id), {
        reviewId: id,
        lastAction: action,
        moderatedBy: adminUser?.uid || null,
        moderatedAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART Admin] Failed to moderate review:', action, err?.code, err?.message);
      setActionError('Could not update that review. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const approve = (id) => moderate(id, { status: REVIEW_STATUS.APPROVED }, 'approved');
  // Rejecting or hiding also clears "featured", so a re-approved review never
  // comes back featured by surprise.
  const reject = (id) => moderate(id, { status: REVIEW_STATUS.REJECTED, featured: false }, 'rejected');
  const hide = (id) => moderate(id, { status: REVIEW_STATUS.HIDDEN, featured: false }, 'hidden');
  const setFeatured = (id, featured) =>
    moderate(id, { featured }, featured ? 'featured' : 'unfeatured');

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
          <option value="featured">featured ({counts.featured})</option>
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
            const approved = r.status === REVIEW_STATUS.APPROVED;
            const busy = updatingId === r.id;
            const ownerUid = ownerByReviewId.get(r.id);
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
                      {approved && r.featured && <FeaturedBadge />}
                      <Stars rating={r.rating} />
                    </div>

                    <p className="adm-row-sub" style={{ whiteSpace: 'normal' }}>
                      {r.displayName}
                      {ownerUid ? ` | uid ${ownerUid.slice(0, 8)}…` : ''}
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
                        disabled={busy || approved}
                        onClick={() => approve(r.id)}
                      >
                        <Check size={13} /> Approve
                      </button>
                      <button
                        className="adm-btn"
                        disabled={busy || r.status === REVIEW_STATUS.REJECTED}
                        onClick={() => reject(r.id)}
                      >
                        <X size={13} /> Reject
                      </button>
                      <button
                        className="adm-btn"
                        disabled={busy || r.status === REVIEW_STATUS.HIDDEN}
                        onClick={() => hide(r.id)}
                      >
                        <EyeOff size={13} /> Hide
                      </button>
                      <button
                        className="adm-btn"
                        disabled={busy || !approved}
                        title={approved ? undefined : 'Only approved reviews can be featured'}
                        onClick={() => setFeatured(r.id, !r.featured)}
                      >
                        <Sparkles size={13} /> {r.featured ? 'Unfeature' : 'Feature'}
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