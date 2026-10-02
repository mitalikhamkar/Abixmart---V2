import React, { useMemo, useState } from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb } from '@/admin/lib/adminFirebase';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import StatusBadge from '@/admin/components/StatusBadge';
import { formatDateTime } from '@/admin/utils/format';
import { getDisplayOrderId, ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/orderUtils';

// Reads Firestore `orders/{docId}` using the real schema written by
// createOrder() in src/lib/orderUtils.js. Admin can update ONLY the two
// independent fields `orderStatus` and `paymentStatus` (plus `updatedAt`).
// All writes use `adminDb` (the admin session), never the customer `db`.
// Obsolete fields (customerName, amount, status) are read only as a
// backward-compatibility fallback.

function millis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function money(value) {
  if (value === undefined || value === null) return '—';
  const n = Number(value);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : `₹${value}`;
}

function paymentMethodLabel(method) {
  if (!method) return '—';
  return method === 'COD' ? 'Cash on Delivery' : method;
}

function statusLabel(value) {
  return String(value).replace(/_/g, ' ');
}

function DetailRow({ label, control, children }) {
  return (
    <div className={control ? 'is-control' : undefined}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// Direct-selection status control. Shows the stored value (controlled by
// the live Firestore snapshot), so a failed write leaves the previous
// value visible. If the stored value isn't one of the supported options
// (e.g. a legacy value), it is still shown rather than hidden.
function StatusSelect({ value, options, onChange, disabled, saving }) {
  const current = value || '';
  const hasCurrent = current && options.includes(current);
  return (
    <div className="adm-control">
      {saving && <span className="adm-saving">Saving…</span>}
      <select
        value={current}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="adm-select adm-select--sm"
      >
        {!current && (
          <option value="" disabled>
            —
          </option>
        )}
        {current && !hasCurrent && <option value={current}>{statusLabel(current)}</option>}
        {options.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function Orders() {
  // Sorted client-side so orders missing `createdAt` are never silently
  // dropped (Firestore orderBy excludes docs without the field).
  const { data: rawOrders, loading, error } = useAdminCollection('orders');
  const [expandedId, setExpandedId] = useState(null);
  // `${docId}:${field}` -> true while that update is in flight.
  const [saving, setSaving] = useState({});
  // docId -> error message from the last failed update.
  const [updateErrors, setUpdateErrors] = useState({});

  const orders = useMemo(
    () => [...rawOrders].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)),
    [rawOrders]
  );

  const updateField = async (order, field, value) => {
    const key = `${order.id}:${field}`;
    if (saving[key] || order[field] === value) return;

    setSaving((s) => ({ ...s, [key]: true }));
    setUpdateErrors((e) => ({ ...e, [order.id]: '' }));

    try {
      // Only the one status field + updatedAt are written; every other
      // order field (orderId, customer, shippingAddress, items, totals…)
      // is left untouched.
      await updateDoc(doc(adminDb, 'orders', order.id), {
        [field]: value,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART Admin] Failed to update order', field, err?.code, err?.message);
      setUpdateErrors((e) => ({
        ...e,
        [order.id]:
          err?.code === 'permission-denied'
            ? 'Update rejected: this account is not permitted to update orders.'
            : `Could not update ${field === 'orderStatus' ? 'order status' : 'payment status'}. Please try again.`,
      }));
    } finally {
      setSaving((s) => {
        const next = { ...s };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div className="adm-page">
      <PageHeader title="Orders" />

      {loading ? (
        <LoadingState label="Loading orders…" />
      ) : error ? (
        <ErrorState message="Could not load orders. Please refresh." />
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" body="Orders placed through the website checkout will appear here." />
      ) : (
        <div className="adm-list">
          {orders.map((o) => {
            const displayOrderId = getDisplayOrderId(o);
            const customerName = o.customer?.fullName || o.customerName || '—';
            const customerEmail = o.customer?.email || o.email || '';
            const customerPhone = o.customer?.phone || '';
            const total = o.total ?? o.amount;
            const orderStatus = o.orderStatus || o.status;
            const open = expandedId === o.id;
            const addr = o.shippingAddress;
            const items = Array.isArray(o.items) ? o.items : [];
            const savingOrderStatus = Boolean(saving[`${o.id}:orderStatus`]);
            const savingPaymentStatus = Boolean(saving[`${o.id}:paymentStatus`]);

            return (
              <div key={o.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : o.id)}
                  className="adm-row adm-row-btn"
                >
                  <div className="adm-row-main">
                    <p className="adm-row-title adm-mono">{displayOrderId}</p>
                    <p className="adm-row-sub">
                      {customerName}
                      {customerEmail ? ` • ${customerEmail}` : ''}
                    </p>
                  </div>
                  <div className="adm-row-aside">
                    <span className="font-price" style={{ color: 'var(--adm-text)' }}>{money(total)}</span>
                    <span className="adm-row-meta">{formatDateTime(o.createdAt)}</span>
                    {orderStatus ? <StatusBadge status={orderStatus} /> : <span className="adm-row-meta">—</span>}
                    {o.paymentStatus && <StatusBadge status={o.paymentStatus} kind="payment" />}
                    <ChevronDown size={16} className={`adm-chev ${open ? 'is-open' : ''}`} />
                  </div>
                </button>

                {open && (
                  <div className="adm-detail">
                    <div>
                      <div className="adm-detail-section">
                        <span className="adm-label">Order</span>
                        <dl className="adm-kv">
                          <DetailRow label="Order ID">
                            <span className="adm-mono" style={{ userSelect: 'all' }}>{displayOrderId}</span>
                          </DetailRow>
                          <DetailRow label="Placed">{formatDateTime(o.createdAt)}</DetailRow>
                          <DetailRow label="Updated">{formatDateTime(o.updatedAt)}</DetailRow>
                        </dl>
                      </div>

                      <div className="adm-detail-section">
                        <span className="adm-label">Customer</span>
                        <dl className="adm-kv">
                          <DetailRow label="Name">{customerName}</DetailRow>
                          <DetailRow label="Email">{customerEmail || '—'}</DetailRow>
                          <DetailRow label="Phone">{customerPhone || '—'}</DetailRow>
                        </dl>
                      </div>

                      <div className="adm-detail-section">
                        <span className="adm-label">Shipping address</span>
                        <dl className="adm-kv">
                          <DetailRow label="Address">{addr?.address || '—'}</DetailRow>
                          <DetailRow label="City">{addr?.city || '—'}</DetailRow>
                          <DetailRow label="State">{addr?.state || '—'}</DetailRow>
                          <DetailRow label="Pincode">{addr?.pincode || '—'}</DetailRow>
                          <DetailRow label="Country">{addr?.country || '—'}</DetailRow>
                        </dl>
                      </div>
                    </div>

                    <div>
                      <div className="adm-detail-section">
                        <span className="adm-label">Items</span>
                        <div>
                          {items.length === 0 ? (
                            <p className="adm-item-sub" style={{ padding: '0.6rem 0' }}>—</p>
                          ) : (
                            items.map((it, i) => (
                              <div key={`${it.productId || 'item'}-${it.variantId || ''}-${i}`} className="adm-item">
                                <div className="min-w-0">
                                  <p className="adm-item-name">
                                    {it.name || it.productId || 'Item'}
                                    {it.variantLabel ? ` — ${it.variantLabel}` : ''}
                                  </p>
                                  <p className="adm-item-sub">
                                    Qty {it.qty ?? '—'} × {money(it.unitPrice)}
                                  </p>
                                </div>
                                <span className="adm-item-name" style={{ flexShrink: 0 }}>{money(it.subtotal)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="adm-detail-section">
                        <span className="adm-label">Payment</span>
                        <dl className="adm-kv">
                          <DetailRow label="Subtotal">{money(o.subtotal)}</DetailRow>
                          <DetailRow label="Shipping">{o.shipping === 0 ? 'Free' : money(o.shipping)}</DetailRow>
                          <DetailRow label="Total">{money(total)}</DetailRow>
                          <DetailRow label="Method">{paymentMethodLabel(o.paymentMethod)}</DetailRow>
                        </dl>
                      </div>

                      <div className="adm-detail-section">
                        <span className="adm-label">Manage status</span>
                        <dl className="adm-kv">
                          <DetailRow label="Order status" control>
                            <StatusSelect
                              value={orderStatus}
                              options={ORDER_STATUSES}
                              saving={savingOrderStatus}
                              disabled={savingOrderStatus}
                              onChange={(v) => updateField(o, 'orderStatus', v)}
                            />
                          </DetailRow>
                          <DetailRow label="Payment status" control>
                            <StatusSelect
                              value={o.paymentStatus}
                              options={PAYMENT_STATUSES}
                              saving={savingPaymentStatus}
                              disabled={savingPaymentStatus}
                              onChange={(v) => updateField(o, 'paymentStatus', v)}
                            />
                          </DetailRow>
                        </dl>

                        {updateErrors[o.id] && <p className="adm-formerror">{updateErrors[o.id]}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}