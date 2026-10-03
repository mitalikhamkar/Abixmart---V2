import React, { useMemo, useState } from 'react';
import { Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import StatCard from '@/admin/components/StatCard';
import { LoadingState, ErrorState } from '@/admin/components/StateViews';
import { ChartCard, BarList, TimeBars } from '@/admin/components/Charts';
import {
  buildSeries,
  calculateRevenue,
  calculateAverageOrderValue,
  calculateOrderStatusDistribution,
  calculatePaymentStatusDistribution,
  calculatePaymentMethodDistribution,
  calculateGeoDistribution,
  calculateSignupMethodDistribution,
  calculateRepeatCustomerRate,
  calculateOrderSize,
  isBooked,
  orderTotal,
  formatINR,
  formatINRCompact,
  formatNumber,
  formatPercent,
} from '@/admin/utils/metrics';

const PERIODS = {
  day: 'Daily · last 30 days',
  week: 'Weekly · last 12 weeks',
  month: 'Monthly · last 12 months',
};

export default function Analytics() {
  const { data: orders, loading: ordersLoading, error: ordersError } = useAdminCollection('orders');
  const { data: users, loading: usersLoading, error: usersError } = useAdminCollection('users');
  const [period, setPeriod] = useState('day');

  const revenue = useMemo(() => calculateRevenue(orders), [orders]);
  const aov = useMemo(() => calculateAverageOrderValue(orders), [orders]);
  const repeat = useMemo(() => calculateRepeatCustomerRate(orders), [orders]);
  const size = useMemo(() => calculateOrderSize(orders), [orders]);

  const ordersSeries = useMemo(
    () => buildSeries(orders, { period, getDate: (o) => o.createdAt }),
    [orders, period]
  );
  const revenueSeries = useMemo(
    () =>
      buildSeries(orders.filter(isBooked), {
        period,
        getDate: (o) => o.createdAt,
        getValue: (o) => orderTotal(o) ?? 0,
      }),
    [orders, period]
  );
  const customersSeries = useMemo(
    () => buildSeries(users, { period, getDate: (u) => u.createdAt }),
    [users, period]
  );

  const statusDist = useMemo(() => calculateOrderStatusDistribution(orders), [orders]);
  const paymentStatusDist = useMemo(() => calculatePaymentStatusDistribution(orders), [orders]);
  const paymentMethodDist = useMemo(() => calculatePaymentMethodDistribution(orders), [orders]);
  const stateDist = useMemo(() => calculateGeoDistribution(orders, 'state'), [orders]);
  const cityDist = useMemo(() => calculateGeoDistribution(orders, 'city'), [orders]);
  const signupDist = useMemo(() => calculateSignupMethodDistribution(users), [users]);

  const loading = ordersLoading || usersLoading;
  const error = ordersError || usersError;

  return (
    <div className="adm-page">
      <PageHeader
        title="Analytics"
        description="Calculated live from the orders and customers stored in Firestore."
      >
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="adm-select" aria-label="Time period">
          {Object.entries(PERIODS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </PageHeader>

      {loading ? (
        <LoadingState label="Calculating analytics…" />
      ) : error ? (
        <ErrorState message="Could not load analytics data. Please refresh." />
      ) : (
        <>
          <div className="adm-stats">
            <StatCard label="Total Orders" value={revenue.totalOrders} icon={Package} hint="All orders placed" />
            <StatCard
              label="Booked Revenue"
              value={formatINR(revenue.bookedRevenue)}
              icon={TrendingUp}
              hint={`${revenue.bookedCount} orders · excl. ${revenue.cancelledCount} cancelled`}
            />
            <StatCard
              label="Collected Revenue"
              value={formatINR(revenue.collectedRevenue)}
              icon={ShoppingBag}
              hint={`${revenue.collectedCount} orders marked paid`}
            />
            <StatCard label="Avg. Order Value" value={formatINR(aov)} icon={TrendingUp} hint="Per booked order" />
            <StatCard
              label="Total Customers"
              value={users.length}
              icon={Users}
              hint={`${repeat.customersWithOrders} have ordered`}
            />
          </div>

          <div className="adm-stats">
            <StatCard
              label="Refunded Orders"
              value={revenue.refundedCount}
              hint={`${formatINR(revenue.refundedValue)} order value · partial refunds not tracked`}
            />
            <StatCard
              label="Repeat Customers"
              value={formatPercent(repeat.repeatRate)}
              hint={`${repeat.repeatCustomers} of ${repeat.customersWithOrders} ordering customers`}
            />
            <StatCard label="Orders / Customer" value={formatNumber(repeat.ordersPerCustomer)} hint="Booked orders, ordering customers" />
            <StatCard label="Packs / Order" value={formatNumber(size.avgPacks)} hint="Bundles per booked order" />
            <StatCard
              label="Jars / Order"
              value={formatNumber(size.avgJars)}
              hint={`From ${size.ordersWithKnownJars} orders with known bundle sizes`}
            />
          </div>

          <div className="adm-chartgrid adm-chartgrid--2">
            <ChartCard title="Orders placed" hint="All orders by date placed, including later-cancelled ones.">
              <TimeBars series={ordersSeries} name="Orders placed" valueFormat={(v) => `${v} order${v === 1 ? '' : 's'}`} />
            </ChartCard>
            <ChartCard title="Booked revenue" hint="Order totals, excluding cancelled orders.">
              <TimeBars series={revenueSeries} name="Booked revenue" valueFormat={formatINRCompact} />
            </ChartCard>
          </div>

          <ChartCard title="New customers" hint="Registrations by date (customers.createdAt).">
            <TimeBars series={customersSeries} name="New customers" valueFormat={(v) => `${v} customer${v === 1 ? '' : 's'}`} />
          </ChartCard>

          <div className="adm-chartgrid adm-chartgrid--auto">
            <ChartCard title="Order status" hint="All orders.">
              <BarList items={statusDist} empty="No orders yet." />
            </ChartCard>
            <ChartCard title="Payment status" hint="Set manually by an admin. Not verified against a gateway.">
              <BarList items={paymentStatusDist} empty="No orders yet." />
            </ChartCard>
            <ChartCard title="Payment method" hint="Method chosen at checkout. Online payment is not integrated yet.">
              <BarList items={paymentMethodDist} empty="No orders yet." />
            </ChartCard>
            <ChartCard title="Orders per customer" hint="Booked orders, by ordering customer.">
              <BarList items={repeat.buckets} empty="No orders yet." />
            </ChartCard>
            <ChartCard title="Orders by state" hint="Booked orders · top 8.">
              <BarList items={stateDist} limit={8} empty="No orders yet." />
            </ChartCard>
            <ChartCard title="Orders by city" hint="Booked orders · top 8.">
              <BarList items={cityDist} limit={8} empty="No orders yet." />
            </ChartCard>
            <ChartCard title="Sign-up method" hint="How customers created their account.">
              <BarList items={signupDist} empty="No customers yet." />
            </ChartCard>
          </div>

          <div className="adm-note">
            <span className="adm-label adm-label--gold">Definitions</span>
            <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
              <strong style={{ color: 'var(--adm-text)', fontWeight: 500 }}>Booked</strong> = every order that is not cancelled.{' '}
              <strong style={{ color: 'var(--adm-text)', fontWeight: 500 }}>Collected</strong> = orders an admin has marked paid; payments are not
              verified automatically. <strong style={{ color: 'var(--adm-text)', fontWeight: 500 }}>Refunded</strong> shows the full order value of
              orders marked refunded, since refund amounts are not stored. Existing orders may include test orders placed during development.
              {revenue.unpricedOrders > 0 && ` ${revenue.unpricedOrders} order(s) have no stored total and count as ₹0.`}
            </p>
            <p className="adm-subtitle" style={{ marginTop: '0.75rem' }}>
              Not available because the data is not collected: website traffic, visitors, sessions, page views, conversion rate, cart abandonment,
              delivery time, profit or margin, inventory, and discount or promo performance.
            </p>
          </div>
        </>
      )}
    </div>
  );
}