import React, { useMemo } from 'react';
import { Users, MessageSquare, Sparkles, ShoppingBag, Package } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import { formatDateTime } from '@/admin/utils/format';

export default function Overview() {
  const { data: users, loading: usersLoading, error: usersError } = useAdminCollection('users', { orderByField: 'createdAt', direction: 'desc' });
  const { data: inquiries, loading: inqLoading, error: inqError } = useAdminCollection('inquiries', { orderByField: 'createdAt', direction: 'desc' });
  const { data: products, loading: productsLoading } = useAdminCollection('products');
  const { data: orders, loading: ordersLoading } = useAdminCollection('orders');

  const newInquiries = useMemo(
    () => inquiries.filter((i) => (i.status || 'new').toLowerCase() === 'new'),
    [inquiries]
  );
  const recentInquiries = inquiries.slice(0, 6);
  const loading = usersLoading || inqLoading || productsLoading || ordersLoading;

  return (
    <div className="space-y-8">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Overview</h1>
      </div>

      {loading ? (
        <LoadingState label="Loading dashboard…" />
      ) : usersError || inqError ? (
        <ErrorState message="Could not load overview data. Please refresh." />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatCard label="Total Customers" value={users.length} icon={Users} />
            <StatCard label="Total Inquiries" value={inquiries.length} icon={MessageSquare} />
            <StatCard label="New Inquiries" value={newInquiries.length} icon={Sparkles} />
            <StatCard label="Total Products" value={products.length} icon={ShoppingBag} />
            <StatCard label="Total Orders" value={orders.length} icon={Package} />
          </div>

          <div>
            <h2 className="font-display text-xl text-charcoal mb-4">Recent Inquiries</h2>
            {recentInquiries.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No inquiries yet"
                body="Inquiries submitted through the website will appear here."
              />
            ) : (
              <div className="border border-charcoal/10 bg-ivory rounded-md divide-y divide-charcoal/8 overflow-hidden">
                {recentInquiries.map((inq) => (
                  <div key={inq.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-charcoal font-medium truncate">{inq.name || 'Unnamed'}</p>
                      <p className="text-sm text-charcoal/50 truncate">
                        {inq.email || '—'} {inq.phone ? `• ${inq.phone}` : ''}
                      </p>
                      {inq.productInterest && (
                        <p className="text-xs text-charcoal/40 mt-0.5">Interested in: {inq.productInterest}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-charcoal/40">{formatDateTime(inq.createdAt)}</span>
                      <StatusBadge status={inq.status || 'new'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}