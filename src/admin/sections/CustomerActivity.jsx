import React, { useMemo, useState } from 'react';
import { Users, Package, MessageSquare, Activity } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import StatCard from '@/admin/components/StatCard';
import StatusBadge from '@/admin/components/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import { formatDate, formatDateTime } from '@/admin/utils/format';
import { getDisplayOrderId } from '@/lib/orderUtils';
import {
  buildActivityFeed,
  calculateCustomerStats,
  countSince,
  signupMethodLabel,
  formatINR,
} from '@/admin/utils/metrics';

const FEED_LIMIT = 40;
const TYPE_LABELS = { registration: 'New customer', order: 'Order placed', inquiry: 'Inquiry' };
const FILTERS = [
  ['all', 'All activity'],
  ['registration', 'Registrations'],
  ['order', 'Orders'],
  ['inquiry', 'Inquiries'],
];

function FeedRow({ entry }) {
  const { type, doc: d, at } = entry;
  let title;
  let sub;
  let aside = null;

  if (type === 'registration') {
    title = d.fullName || d.email || 'New customer';
    sub = `Registered${d.provider ? ` with ${signupMethodLabel(d.provider)}` : ''}${d.email && d.fullName ? ` • ${d.email}` : ''}`;
  } else if (type === 'order') {
    title = getDisplayOrderId(d);
    sub = `${d.customer?.fullName || '—'} • ${formatINR(d.total)}${d.paymentMethod ? ` • ${d.paymentMethod}` : ''}`;
    aside = d.orderStatus ? <StatusBadge status={d.orderStatus} /> : null;
  } else {
    // Inquiries are not reliably linked to a customer account, so they are
    // shown as inquiries only.
    title = d.name || 'Unnamed';
    sub = `${d.email || 'No email'}${d.productInterest ? ` • about ${d.productInterest}` : ''}`;
    aside = <StatusBadge status={d.status || 'new'} />;
  }

  return (
    <div className="adm-row">
      <div className="adm-row-main">
        <span className="adm-label">{TYPE_LABELS[type]}</span>
        <p className="adm-row-title adm-mono" style={{ marginTop: '0.25rem' }}>{title}</p>
        <p className="adm-row-sub">{sub}</p>
      </div>
      <div className="adm-row-aside">
        <span className="adm-row-meta">{formatDateTime(new Date(at))}</span>
        {aside}
      </div>
    </div>
  );
}

export default function CustomerActivity() {
  const { data: users, loading: usersLoading, error: usersError } = useAdminCollection('users');
  const { data: orders, loading: ordersLoading, error: ordersError } = useAdminCollection('orders');
  const { data: inquiries, loading: inqLoading, error: inqError } = useAdminCollection('inquiries');
  const [filter, setFilter] = useState('all');

  const feed = useMemo(() => buildActivityFeed({ users, orders, inquiries }), [users, orders, inquiries]);
  const visible = useMemo(
    () => (filter === 'all' ? feed : feed.filter((e) => e.type === filter)).slice(0, FEED_LIMIT),
    [feed, filter]
  );
  const customerStats = useMemo(() => calculateCustomerStats(users, orders), [users, orders]);

  const counts = useMemo(() => {
    const created = (x) => x.createdAt;
    const lastSession = (u) => u.lastLoginAt;
    return {
      customers: [countSince(users, created, 30), countSince(users, created, 7)],
      orders: [countSince(orders, created, 30), countSince(orders, created, 7)],
      inquiries: [countSince(inquiries, created, 30), countSince(inquiries, created, 7)],
      sessions: [countSince(users, lastSession, 30), countSince(users, lastSession, 7)],
    };
  }, [users, orders, inquiries]);

  const loading = usersLoading || ordersLoading || inqLoading;
  const error = usersError || ordersError || inqError;

  return (
    <div className="adm-page">
      <PageHeader title="Customer Activity" description="Recent activity derived from customers, orders and inquiries.">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="adm-select" aria-label="Activity type">
          {FILTERS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </PageHeader>

      {loading ? (
        <LoadingState label="Loading activity…" />
      ) : error ? (
        <ErrorState message="Could not load activity data. Please refresh." />
      ) : (
        <>
          <div className="adm-note">
            <span className="adm-label adm-label--gold">Recent activity, not a full log</span>
            <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
              This view is built from timestamps already stored on customers, orders and inquiries. Page views, browsing, login history,
              and cart or wishlist events are not recorded anywhere, so they cannot appear here.
            </p>
          </div>

          <div className="adm-stats">
            <StatCard label="New Customers" value={counts.customers[0]} icon={Users} hint={`Last 30 days · ${counts.customers[1]} in last 7`} />
            <StatCard label="Orders Placed" value={counts.orders[0]} icon={Package} hint={`Last 30 days · ${counts.orders[1]} in last 7`} />
            <StatCard label="Inquiries" value={counts.inquiries[0]} icon={MessageSquare} hint={`Last 30 days · ${counts.inquiries[1]} in last 7`} />
            <StatCard
              label="Recent Sessions"
              value={counts.sessions[0]}
              icon={Activity}
              hint={`Customers last seen in 30 days · ${counts.sessions[1]} in last 7`}
            />
          </div>

          <div>
            <h2 className="adm-h2 font-display" style={{ marginBottom: '1rem' }}>Recent activity</h2>
            {visible.length === 0 ? (
              <EmptyState icon={Activity} title="No activity yet" body="Registrations, orders and inquiries will appear here as they happen." />
            ) : (
              <div className="adm-list">
                {visible.map((entry) => (
                  <FeedRow key={entry.key} entry={entry} />
                ))}
              </div>
            )}
            {feed.length > visible.length && filter === 'all' && (
              <p className="adm-chart-caption">Showing the latest {FEED_LIMIT} of {feed.length} items.</p>
            )}
          </div>

          <div>
            <h2 className="adm-h2 font-display" style={{ marginBottom: '1rem' }}>Top customers by order value</h2>
            {customerStats.rows.length === 0 ? (
              <EmptyState icon={Users} title="No customer orders yet" body="Customers who place an order will be ranked here." />
            ) : (
              <div className="adm-panel adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Orders</th>
                      <th>Order value</th>
                      <th>Last order</th>
                      <th>Last session</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerStats.rows.slice(0, 10).map(({ user, orders: n, value, lastOrderAt }) => (
                      <tr key={user.id}>
                        <td className="is-strong">
                          {user.fullName || user.email || '—'}
                          {user.fullName && user.email && <span className="adm-row-meta"> · {user.email}</span>}
                        </td>
                        <td>{n}</td>
                        <td className="is-strong">{formatINR(value)}</td>
                        <td>{formatDate(new Date(lastOrderAt))}</td>
                        <td>{formatDate(user.lastLoginAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="adm-chart-caption">
              Order value excludes cancelled orders. "Last session" is the most recent session start only, not a login history.
              {customerStats.unmatchedOrders > 0 && ` ${customerStats.unmatchedOrders} booked order(s) are not linked to an existing customer account.`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}