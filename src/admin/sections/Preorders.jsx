import React, { useMemo, useState } from 'react';
import { ClipboardList, Search, Phone, MessageCircle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '@/admin/lib/adminFirebase';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import StatusBadge from '@/admin/components/StatusBadge';
import { formatDateTime } from '@/admin/utils/format';
import {
  PRE_BOOKINGS_COLLECTION,
  PRE_BOOKING_STATUSES,
  TIMING_LABELS,
} from '@/lib/preBookingConfig';

// Pre-order INTEREST requests from the website (collection `preBookings`).
// These are expressions of interest only: no order, reservation or payment
// is attached to them. Layout and behaviour follow Inquiries.jsx.

function telHref(phone) {
  return `tel:${phone}`;
}

// Numbers saved with a leading "+" carry their country code. A bare
// 10-digit number is treated as an Indian number. Anything else gets no
// WhatsApp link, because the country is unknown.
function waHref(phone) {
  const raw = String(phone || '');
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return `https://wa.me/${digits}`;
  if (digits.length === 10) return `https://wa.me/91${digits}`;
  return null;
}

export default function PreOrders() {
  const {
    data: requests,
    loading,
    error,
  } = useAdminCollection(PRE_BOOKINGS_COLLECTION, {
    orderByField: 'createdAt',
    direction: 'desc',
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState({});

  // Interest per product: how many requests and how many units in total.
  const summary = useMemo(() => {
    const byProduct = new Map();
    requests.forEach((r) => {
      const key = r.productId || 'unknown';
      const entry = byProduct.get(key) || { id: key, name: r.productName || key, requests: 0, units: 0 };
      entry.requests += 1;
      entry.units += Number(r.quantity) || 0;
      byProduct.set(key, entry);
    });
    return Array.from(byProduct.values()).sort((a, b) => b.requests - a.requests);
  }, [requests]);

  const filtered = useMemo(() => {
    let list = requests;

    if (statusFilter !== 'all') {
      list = list.filter((r) => (r.status || 'new').toLowerCase() === statusFilter);
    }
    if (productFilter !== 'all') {
      list = list.filter((r) => r.productId === productFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        [r.fullName, r.phone, r.productName].some((f) => (f || '').toLowerCase().includes(q))
      );
    }

    return list;
  }, [requests, search, statusFilter, productFilter]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    setUpdateError({});

    try {
      await updateDoc(doc(db, PRE_BOOKINGS_COLLECTION, id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART Admin] Failed to update pre-order status:', err?.code, err?.message);
      setUpdateError({
        id,
        message:
          err?.code === 'permission-denied'
            ? 'Update rejected: this account is not permitted to change pre-order requests.'
            : 'Could not update the status. Please try again.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="adm-page">
      <PageHeader title="Pre-orders">
        <div className="adm-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone or product..."
            className="adm-input"
          />
        </div>

        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="adm-select"
          aria-label="Filter by product"
        >
          <option value="all">All products</option>
          {summary.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adm-select"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {PRE_BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </PageHeader>

      {loading ? (
        <LoadingState label="Loading pre-orders..." />
      ) : error ? (
        <ErrorState message="Could not load pre-orders. Please refresh." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No pre-order requests yet"
          body="Interest registered on Coming Soon products will appear here."
        />
      ) : (
        <>
          <div className="adm-note">
            <span className="adm-label adm-label--gold">Interest only</span>
            <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
              These are expressions of interest. No order, reservation or payment is attached to them.
            </p>
            <dl className="adm-kv" style={{ marginTop: '0.9rem' }}>
              {summary.map((p) => (
                <div key={p.id}>
                  <dt>{p.name}</dt>
                  <dd style={{ fontSize: '0.75rem' }}>
                    {p.requests} request{p.requests === 1 ? '' : 's'} · {p.units} unit{p.units === 1 ? '' : 's'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No pre-orders match"
              body="Try a different search or filter."
            />
          ) : (
            <div className="adm-stack">
              {filtered.map((r) => {
                const wa = r.phone ? waHref(r.phone) : null;
                return (
                  <div key={r.id} className="adm-panel adm-panel-pad">
                    <div className="adm-inq">
                      <div className="min-w-0" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <p className="adm-row-title" style={{ whiteSpace: 'normal' }}>
                            {r.fullName || 'Unnamed'}
                          </p>
                          <StatusBadge status={r.status || 'new'} />
                        </div>

                        <p className="adm-row-sub" style={{ whiteSpace: 'normal' }}>
                          {r.phone || 'No phone'}
                        </p>

                        <p className="adm-row-meta" style={{ marginTop: '0.3rem' }}>
                          {r.productName || r.productId || 'Unknown product'} · Quantity {r.quantity ?? '—'}
                        </p>
                        <p className="adm-row-meta" style={{ marginTop: '0.2rem' }}>
                          Expected timing: {TIMING_LABELS[r.timing] || r.timing || '—'}
                        </p>

                        <p className="adm-row-meta" style={{ marginTop: '0.7rem' }}>
                          {formatDateTime(r.createdAt)}
                          {' | '}
                          {r.uid ? `Signed-in customer (${r.uid})` : 'Guest'}
                          {r.consent ? ' | Consent given' : ''}
                          {r.consentVersion ? ` (${r.consentVersion})` : ''}
                        </p>
                      </div>

                      <div className="adm-inq-side">
                        <div className="adm-iconrow">
                          {r.phone && (
                            <a href={telHref(r.phone)} className="adm-iconbtn" title="Call">
                              <Phone size={14} />
                            </a>
                          )}
                          {wa && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              className="adm-iconbtn"
                              title="WhatsApp"
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                        </div>

                        <select
                          value={(r.status || 'new').toLowerCase()}
                          disabled={updatingId === r.id}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className="adm-select adm-select--sm"
                          aria-label={`Status for ${r.fullName || 'request'}`}
                        >
                          {PRE_BOOKING_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>

                        {updateError.id === r.id && <p className="adm-formerror">{updateError.message}</p>}
                      </div>
                    </div>
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