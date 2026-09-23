import React from 'react';
import { Package } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import StatusBadge from '@/admin/components/StatusBadge';
import { formatDate } from '@/admin/utils/format';

// Foundation for order management. Reads from Firestore `orders/{orderId}`.
// Checkout/payment integration isn't implemented yet — this displays real
// orders the moment they exist, with no fake data in the meantime.
export default function Orders() {
  const { data: orders, loading, error } = useAdminCollection('orders', { orderByField: 'createdAt', direction: 'desc' });

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
        <EmptyState icon={Package} title="No orders yet" body="Orders will appear here once checkout is live and customers begin purchasing." />
      ) : (
        <div className="border border-charcoal/10 bg-ivory rounded-md divide-y divide-charcoal/8 overflow-hidden">
          {orders.map((o) => (
            <div key={o.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-charcoal font-medium">Order #{o.id.slice(0, 8)}</p>
                <p className="text-sm text-charcoal/50">{o.customerName || o.email || '—'}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-price text-charcoal">{o.amount ? `₹${o.amount}` : '—'}</span>
                <span className="text-xs text-charcoal/40">{formatDate(o.createdAt)}</span>
                <StatusBadge status={o.status || 'pending'} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}