import React, { useMemo, useState } from 'react';
import { Bell, Search, Phone, Mail, MessageCircle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '@/admin/lib/adminFirebase';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import StatusBadge from '@/admin/components/StatusBadge';
import { formatDateTime } from '@/admin/utils/format';
import { toMillis } from '@/admin/utils/metrics';

// "Notify Me" requests from the website (collection `productNotifications`,
// one document per customer per product, written by src/lib/notifyUtils.js).
// This page only READS those documents and lets an admin record whether the
// customer has been told. It never creates documents, and it only changes
// the two fields the customer-side write already creates: `status`
// ('pending' | 'notified') and `notifiedAt`. The website does not send any
// message itself, so "notified" is a record the admin keeps by hand.
// Layout and behaviour follow PreOrders.jsx.

const COLLECTION = 'productNotifications';
const STATUSES = ['pending', 'notified'];

// Only an explicit "notified" counts as notified; anything else is pending.
const statusOf = (r) => (String(r.status || '').toLowerCase() === 'notified' ? 'notified' : 'pending');

function telHref(phone) {
  return `tel:${phone}`;
}

// Same rule as PreOrders: a leading "+" carries its country code, a bare
// 10-digit number is treated as Indian, anything else gets no WhatsApp link.
function waHref(phone) {
  const raw = String(phone || '');
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return `https://wa.me/${digits}`;
  if (digits.length === 10) return `https://wa.me/91${digits}`;
  return null;
}

export default function NotifyRequests() {
  const { data: requests, loading, error } = useAdminCollection(COLLECTION);
  // Name and phone are not stored on a request, so they are looked up from
  // the customer's profile by uid. If this read fails the page still works
  // and shows the request's own email.
  const { data: users } = useAdminCollection('users');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState({});

  const customers = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  // Sorted here, not in the query, so a request without `createdAt` is never dropped.
  const sorted = useMemo(
    () => [...requests].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
    [requests]
  );

  const summary = useMemo(() => {
    const byProduct = new Map();
    sorted.forEach((r) => {
      const key = r.productId || 'unknown';
      const entry = byProduct.get(key) || { id: key, name: r.productName || key, requests: 0, pending: 0 };
      entry.requests += 1;
      if (statusOf(r) === 'pending') entry.pending += 1;
      byProduct.set(key, entry);
    });
    return Array.from(byProduct.values()).sort((a, b) => b.requests - a.requests);
  }, [sorted]);

  const filtered = useMemo(() => {
    let list = sorted;

    if (statusFilter !== 'all') list = list.filter((r) => statusOf(r) === statusFilter);
    if (productFilter !== 'all') list = list.filter((r) => r.productId === productFilter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const c = customers.get(r.uid);
        return [r.email, r.productName, c?.fullName, c?.phone].some((f) => (f || '').toLowerCase().includes(q));
      });
    }

    return list;
  }, [sorted, customers, search, statusFilter, productFilter]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);
    setUpdateError({});

    try {
      await updateDoc(doc(db, COLLECTION, id), {
        status,
        notifiedAt: status === 'notified' ? serverTimestamp() : null,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART Admin] Failed to update notify-me status:', err?.code, err?.message);
      setUpdateError({
        id,
        message:
          err?.code === 'permission-denied'
            ? 'Update rejected: this account is not permitted to change Notify Me requests.'
            : 'Could not update the status. Please try again.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="adm-page">
      <PageHeader title="Notify Me">
        <div className="adm-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone or product..."
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
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </PageHeader>

      {loading ? (
        <LoadingState label="Loading Notify Me requests..." />
      ) : error ? (
        <ErrorState message="Could not load Notify Me requests. Please refresh." />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notify Me requests yet"
          body="Customers who ask to be told when a Coming Soon product is available will appear here."
        />
      ) : (
        <>
          <div className="adm-note">
            <span className="adm-label adm-label--gold">Notify Me</span>
            <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
              Each request is one customer asking to be told when a product is available. The website does not send
              any message itself: mark a request as notified once you have contacted the customer.
            </p>
            <dl className="adm-kv" style={{ marginTop: '0.9rem' }}>
              {summary.map((p) => (
                <div key={p.id}>
                  <dt>{p.name}</dt>
                  <dd style={{ fontSize: '0.75rem' }}>
                    {p.requests} request{p.requests === 1 ? '' : 's'} · {p.pending} waiting
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Bell} title="No requests match" body="Try a different search or filter." />
          ) : (
            <div className="adm-stack">
              {filtered.map((r) => {
                const status = statusOf(r);
                const customer = customers.get(r.uid);
                const phone = customer?.phone || '';
                const wa = phone ? waHref(phone) : null;
                return (
                  <div key={r.id} className="adm-panel adm-panel-pad">
                    <div className="adm-inq">
                      <div className="min-w-0" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <p className="adm-row-title" style={{ whiteSpace: 'normal' }}>
                            {customer?.fullName || r.email || 'Customer'}
                          </p>
                          {status === 'notified' ? (
                            <span className="adm-badge adm-s-resolved">notified</span>
                          ) : (
                            <StatusBadge status="pending" />
                          )}
                        </div>

                        <p className="adm-row-sub" style={{ whiteSpace: 'normal' }}>
                          {r.email || 'No email'}
                          {phone ? ` · ${phone}` : ''}
                        </p>

                        <p className="adm-row-meta" style={{ marginTop: '0.3rem' }}>
                          {r.productName || r.productId || 'Unknown product'}
                        </p>

                        <p className="adm-row-meta" style={{ marginTop: '0.7rem' }}>
                          Requested {r.createdAt ? formatDateTime(r.createdAt) : '—'}
                          {status === 'notified' && r.notifiedAt ? ` | Notified ${formatDateTime(r.notifiedAt)}` : ''}
                        </p>
                      </div>

                      <div className="adm-inq-side">
                        <div className="adm-iconrow">
                          {r.email && (
                            <a href={`mailto:${r.email}`} className="adm-iconbtn" title="Email">
                              <Mail size={14} />
                            </a>
                          )}
                          {phone && (
                            <a href={telHref(phone)} className="adm-iconbtn" title="Call">
                              <Phone size={14} />
                            </a>
                          )}
                          {wa && (
                            <a href={wa} target="_blank" rel="noreferrer" className="adm-iconbtn" title="WhatsApp">
                              <MessageCircle size={14} />
                            </a>
                          )}
                        </div>

                        <select
                          value={status}
                          disabled={updatingId === r.id}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          className="adm-select adm-select--sm"
                          aria-label={`Status for ${r.email || 'request'}`}
                        >
                          {STATUSES.map((s) => (
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