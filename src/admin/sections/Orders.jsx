import React, { useMemo, useState } from 'react';
import { Package, ChevronDown } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import StatusBadge from '@/admin/components/StatusBadge';
import { formatDateTime } from '@/admin/utils/format';
import { getDisplayOrderId } from '@/lib/orderUtils';

// Reads Firestore `orders/{docId}` using the real schema written by
// createOrder() in src/lib/orderUtils.js:
//   orderId, uid, customer{fullName,email,phone}, shippingAddress{...},
//   items[], subtotal, shipping, total, paymentMethod, paymentStatus,
//   orderStatus, createdAt, updatedAt.
// Obsolete fields (customerName, amount, status) are used only as an
// explicit backward-compatibility fallback.

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

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-charcoal/8 pb-2">
      <dt className="label-meta text-charcoal/45 shrink-0">{label}</dt>
      <dd className="text-sm text-charcoal text-right min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function Orders() {
  // Sorted client-side so orders missing `createdAt` are never silently
  // dropped (Firestore orderBy excludes docs without the field).
  const { data: rawOrders, loading, error } = useAdminCollection('orders');
  const [expandedId, setExpandedId] = useState(null);

  const orders = useMemo(
    () => [...rawOrders].sort((a, b) => millis(b.createdAt) - millis(a.createdAt)),
    [rawOrders]
  );

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
            const customerName = o.customer?.fullName || o.customerName || '—';
            const customerEmail = o.customer?.email || o.email || '';
            const customerPhone = o.customer?.phone || '';
            const total = o.total ?? o.amount;
            const orderStatus = o.orderStatus || o.status;
            const open = expandedId === o.id;
            const addr = o.shippingAddress;
            const items = Array.isArray(o.items) ? o.items : [];

            return (
              <div key={o.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : o.id)}
                  className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:bg-charcoal/[0.02]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-charcoal font-medium lining-nums tabular-nums">{getDisplayOrderId(o)}</p>
                    <p className="text-sm text-charcoal/50 truncate">
                      {customerName}
                      {customerEmail ? ` • ${customerEmail}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    <span className="font-price text-charcoal">{money(total)}</span>
                    <span className="text-xs text-charcoal/40">{formatDateTime(o.createdAt)}</span>
                    {orderStatus ? <StatusBadge status={orderStatus} /> : <span className="text-xs text-charcoal/40">—</span>}
                    <ChevronDown
                      size={16}
                      className={`text-charcoal/40 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {open && (
                  <div className="px-4 sm:px-5 pb-5 grid gap-6 md:grid-cols-2">
                    <div>
                      <span className="label-meta text-charcoal/35 block">Customer</span>
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
                        <DetailRow label="Payment status">
                          {o.paymentStatus ? <StatusBadge status={o.paymentStatus} /> : '—'}
                        </DetailRow>
                        <DetailRow label="Order status">
                          {orderStatus ? <StatusBadge status={orderStatus} /> : '—'}
                        </DetailRow>
                        <DetailRow label="Placed">{formatDateTime(o.createdAt)}</DetailRow>
                        <DetailRow label="Updated">{formatDateTime(o.updatedAt)}</DetailRow>
                      </dl>
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