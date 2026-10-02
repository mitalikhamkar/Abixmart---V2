import React, { useMemo, useState } from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb } from '@/admin/lib/adminFirebase';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
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
  return value === undefined || value === null ? '—' : `₹${value}`;
}

function paymentMethodLabel(method) {
  if (!method) return '—';
  return method === 'COD' ? 'Cash on Delivery' : method;
}

function statusLabel(value) {
  return String(value).replace(/_/g, ' ');
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-charcoal/8 pb-2">
      <dt className="label-meta text-charcoal/45 shrink-0 pt-1.5">{label}</dt>
      <dd className="text-sm text-charcoal text-right min-w-0 break-words">{children}</dd>
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
    <div className="flex items-center justify-end gap-2">
      {saving && <span className="text-xs text-charcoal/45">Saving…</span>}
      <select
        value={current}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 px-2.5 border border-charcoal/15 bg-ivory text-xs text-charcoal rounded-md focus:outline-none focus:border-resin capitalize disabled:opacity-50"
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
    <div className="space-y-6">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Orders</h1>
      </div>

      {loading ? (
        <LoadingState label="Loading orders…" />
      ) : error ? (
        <ErrorState message="Could not load orders. Please refresh." />
      ) : orders.length === 0 ? (
        <EmptyState icon={Package} title="No orders yet" body="Orders placed through the website checkout will appear here." />
      ) : (
        <div className="border border-charcoal/10 bg-ivory rounded-md divide-y divide-charcoal/8 overflow-hidden">
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
                  className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-charcoal/[0.02]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-charcoal font-medium lining-nums tabular-nums">{displayOrderId}</p>
                    <p className="text-sm text-charcoal/50 truncate">
                      {customerName}
                      {customerEmail ? ` • ${customerEmail}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <span className="font-price text-charcoal">{money(total)}</span>
                    <span className="text-xs text-charcoal/40">{formatDateTime(o.createdAt)}</span>
                    {orderStatus ? <StatusBadge status={orderStatus} /> : <span className="text-xs text-charcoal/40">—</span>}
                    {o.paymentStatus && <StatusBadge status={o.paymentStatus} kind="payment" />}
                    <ChevronDown
                      size={16}
                      className={`text-charcoal/40 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {open && (
                  <div className="px-4 sm:px-5 pb-5 grid gap-6 md:grid-cols-2">
                    <div>
                      <span className="label-meta text-charcoal/35 block">Order</span>
                      <dl className="mt-2 space-y-3">
                        <DetailRow label="Order ID">
                          <span className="lining-nums tabular-nums select-all">{displayOrderId}</span>
                        </DetailRow>
                        <DetailRow label="Placed">{formatDateTime(o.createdAt)}</DetailRow>
                        <DetailRow label="Updated">{formatDateTime(o.updatedAt)}</DetailRow>
                      </dl>

                      <span className="label-meta text-charcoal/35 mt-6 block">Customer</span>
                      <dl className="mt-2 space-y-3">
                        <DetailRow label="Name">{customerName}</DetailRow>
                        <DetailRow label="Email">{customerEmail || '—'}</DetailRow>
                        <DetailRow label="Phone">{customerPhone || '—'}</DetailRow>
                      </dl>

                      <span className="label-meta text-charcoal/35 mt-6 block">Shipping address</span>
                      <dl className="mt-2 space-y-3">
                        <DetailRow label="Address">{addr?.address || '—'}</DetailRow>
                        <DetailRow label="City">{addr?.city || '—'}</DetailRow>
                        <DetailRow label="State">{addr?.state || '—'}</DetailRow>
                        <DetailRow label="Pincode">{addr?.pincode || '—'}</DetailRow>
                        <DetailRow label="Country">{addr?.country || '—'}</DetailRow>
                      </dl>
                    </div>

                    <div>
                      <span className="label-meta text-charcoal/35 block">Items</span>
                      <div className="mt-2 space-y-3">
                        {items.length === 0 ? (
                          <p className="text-sm text-charcoal/50">—</p>
                        ) : (
                          items.map((it, i) => (
                            <div key={`${it.productId || 'item'}-${it.variantId || ''}-${i}`} className="flex items-start justify-between gap-4 border-b border-charcoal/8 pb-2">
                              <div className="min-w-0">
                                <p className="text-sm text-charcoal">
                                  {it.name || it.productId || 'Item'}
                                  {it.variantLabel ? ` — ${it.variantLabel}` : ''}
                                </p>
                                <p className="text-xs text-charcoal/45">
                                  Qty {it.qty ?? '—'} × {money(it.unitPrice)}
                                </p>
                              </div>
                              <span className="text-sm text-charcoal shrink-0">{money(it.subtotal)}</span>
                            </div>
                          ))
                        )}
                      </div>

                      <span className="label-meta text-charcoal/35 mt-6 block">Payment</span>
                      <dl className="mt-2 space-y-3">
                        <DetailRow label="Subtotal">{money(o.subtotal)}</DetailRow>
                        <DetailRow label="Shipping">{o.shipping === 0 ? 'Free' : money(o.shipping)}</DetailRow>
                        <DetailRow label="Total">{money(total)}</DetailRow>
                        <DetailRow label="Method">{paymentMethodLabel(o.paymentMethod)}</DetailRow>
                      </dl>

                      <span className="label-meta text-charcoal/35 mt-6 block">Manage status</span>
                      <dl className="mt-2 space-y-3">
                        <DetailRow label="Order status">
                          <StatusSelect
                            value={orderStatus}
                            options={ORDER_STATUSES}
                            saving={savingOrderStatus}
                            disabled={savingOrderStatus}
                            onChange={(v) => updateField(o, 'orderStatus', v)}
                          />
                        </DetailRow>
                        <DetailRow label="Payment status">
                          <StatusSelect
                            value={o.paymentStatus}
                            options={PAYMENT_STATUSES}
                            saving={savingPaymentStatus}
                            disabled={savingPaymentStatus}
                            onChange={(v) => updateField(o, 'paymentStatus', v)}
                          />
                        </DetailRow>
                      </dl>

                      {updateErrors[o.id] && (
                        <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                          {updateErrors[o.id]}
                        </p>
                      )}
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