import React, { useMemo } from 'react';
import { Users, MessageSquare, Sparkles, ShoppingBag, Package } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import { formatDateTime } from '@/admin/utils/format';
import { products } from '@/data/products';

export default function Overview() {
  const { data: users, loading: usersLoading, error: usersError } = useAdminCollection('users', { orderByField: 'createdAt', direction: 'desc' });
  const { data: inquiries, loading: inqLoading, error: inqError } = useAdminCollection('inquiries', { orderByField: 'createdAt', direction: 'desc' });
  const { data: orders, loading: ordersLoading } = useAdminCollection('orders');
  // Total Products reflects the existing application catalog
  // (src/data/products.js) — the same source as Admin → Products — until
  // products are migrated to Firestore in a later phase.

  const newInquiries = useMemo(
    () => inquiries.filter((i) => (i.status || 'new').toLowerCase() === 'new'),
    [inquiries]
  );
  const recentInquiries = inquiries.slice(0, 6);
  const loading = usersLoading || inqLoading || ordersLoading;

  return (
    <div className="adm-page">
      <PageHeader title="Overview" />

      {loading ? (
        <LoadingState label="Loading dashboard…" />
      ) : usersError || inqError ? (
        <ErrorState message="Could not load overview data. Please refresh." />
      ) : (
        <>
          <div className="adm-stats">
            <StatCard label="Total Customers" value={users.length} icon={Users} />
            <StatCard label="Total Inquiries" value={inquiries.length} icon={MessageSquare} />
            <StatCard label="New Inquiries" value={newInquiries.length} icon={Sparkles} />
            <StatCard label="Total Products" value={products.length} icon={ShoppingBag} />
            <StatCard label="Total Orders" value={orders.length} icon={Package} />
          </div>

          <div>
            <h2 className="adm-h2 font-display" style={{ marginBottom: '1rem' }}>Recent Inquiries</h2>
            {recentInquiries.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No inquiries yet"
                body="Inquiries submitted through the website will appear here."
              />
            ) : (
              <div className="adm-list">
                {recentInquiries.map((inq) => (
                  <div key={inq.id} className="adm-row">
                    <div className="adm-row-main">
                      <p className="adm-row-title">{inq.name || 'Unnamed'}</p>
                      <p className="adm-row-sub">
                        {inq.email || '—'} {inq.phone ? `• ${inq.phone}` : ''}
                      </p>
                      {inq.productInterest && (
                        <p className="adm-row-meta" style={{ marginTop: '0.2rem' }}>Interested in: {inq.productInterest}</p>
                      )}
                    </div>
                    <div className="adm-row-aside">
                      <span className="adm-row-meta">{formatDateTime(inq.createdAt)}</span>
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