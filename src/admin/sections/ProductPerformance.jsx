import React, { useMemo, useState } from 'react';
import { Package, ShoppingBag, TrendingUp, Boxes } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import StatCard from '@/admin/components/StatCard';
import { LoadingState, ErrorState } from '@/admin/components/StateViews';
import { ChartCard, BarList, TimeBars } from '@/admin/components/Charts';
import {
  buildSeries,
  calculateProductPerformance,
  calculateNotifyInterest,
  flattenOrderItems,
  isBooked,
  formatINR,
  formatINRCompact,
} from '@/admin/utils/metrics';

const PERIODS = {
  day: 'Daily · last 30 days',
  week: 'Weekly · last 12 weeks',
  month: 'Monthly · last 12 months',
};

const packLabel = (v) => `${v} pack${v === 1 ? '' : 's'}`;
const jarLabel = (v) => `${v} jar${v === 1 ? '' : 's'}`;

export default function ProductPerformance() {
  const { data: orders, loading, error } = useAdminCollection('orders');
  const { data: notifications, loading: notifyLoading, error: notifyError } = useAdminCollection('productNotifications');
  // G4: the Firestore catalog supplies product names and statuses. If it
  // cannot be read, the calculators fall back to the static list.
  const { data: catalogDocs, loading: catalogLoading, error: catalogError } = useAdminCollection('products');
  const [period, setPeriod] = useState('day');
  const [productFilter, setProductFilter] = useState('all');

  const catalogProducts = useMemo(
    () => (catalogError || !catalogDocs ? undefined : catalogDocs),
    [catalogDocs, catalogError]
  );

  const performance = useMemo(() => calculateProductPerformance(orders, catalogProducts), [orders, catalogProducts]);
  const bookedItems = useMemo(() => flattenOrderItems(orders.filter(isBooked)), [orders]);
  const filteredItems = useMemo(
    () => (productFilter === 'all' ? bookedItems : bookedItems.filter((i) => i.productId === productFilter)),
    [bookedItems, productFilter]
  );

  const revenueSeries = useMemo(
    () => buildSeries(filteredItems, { period, getDate: (i) => i.createdAt, getValue: (i) => i.subtotal ?? 0 }),
    [filteredItems, period]
  );
  const jarsSeries = useMemo(
    () => buildSeries(filteredItems, { period, getDate: (i) => i.createdAt, getValue: (i) => i.jars ?? 0 }),
    [filteredItems, period]
  );
  const interest = useMemo(() => calculateNotifyInterest(notifications, catalogProducts), [notifications, catalogProducts]);

  const productsWithSales = performance.products.filter((p) => p.packs > 0);
  const { totals } = performance;

  return (
    <div className="adm-page">
      <PageHeader
        title="Product Performance"
        description="Calculated from the items stored on each order. Cancelled orders are excluded."
      >
        {productsWithSales.length > 1 && (
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="adm-select"
            aria-label="Product"
          >
            <option value="all">All products</option>
            {productsWithSales.map((p) => (
              <option key={p.productId} value={p.productId}>{p.name}</option>
            ))}
          </select>
        )}
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="adm-select" aria-label="Time period">
          {Object.entries(PERIODS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </PageHeader>

      {loading || catalogLoading ? (
        <LoadingState label="Calculating product performance…" />
      ) : error ? (
        <ErrorState message="Could not load orders. Please refresh." />
      ) : (
        <>
          <div className="adm-stats">
            <StatCard label="Orders with Items" value={totals.orders} icon={Package} hint="Booked orders" />
            <StatCard label="Packs Ordered" value={totals.packs} icon={Boxes} hint="Packages (item qty)" />
            <StatCard
              label="Jars Sold"
              value={totals.jars}
              icon={ShoppingBag}
              hint={performance.unknownJarItems > 0 ? `Excludes ${performance.unknownJarItems} item(s) with unknown package size` : 'Packs × jars per package'}
            />
            <StatCard label="Item Revenue" value={formatINR(totals.revenue)} icon={TrendingUp} hint="Sum of stored item subtotals" />
          </div>

          <div>
            <h2 className="adm-h2 font-display" style={{ marginBottom: '1rem' }}>By product</h2>
            <div className="adm-panel adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Orders</th>
                    <th>Packs</th>
                    <th>Jars</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.products.map((p) => (
                    <tr key={p.productId}>
                      <td className="is-strong">
                        {p.name}
                        {!p.inCatalog && <span className="adm-row-meta"> · not in current catalog</span>}
                      </td>
                      <td>{p.orders}</td>
                      <td>{p.packs}</td>
                      <td>{p.jarsComplete ? p.jars : `${p.jars}*`}</td>
                      <td className="is-strong">{formatINR(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="adm-chart-caption">
              Packs are packages ordered; jars = packs × jars per package. Revenue uses the subtotal saved on each order, not current prices.
              {performance.unknownJarItems > 0 && ' * Jar count excludes older items whose package size is unknown.'}
              {performance.unpricedItems > 0 && ` ${performance.unpricedItems} item(s) have no stored subtotal and count as ₹0.`}
            </p>
          </div>

          <div className="adm-chartgrid adm-chartgrid--2">
            <ChartCard title="Revenue over time" hint="Stored item subtotals by order date.">
              <TimeBars series={revenueSeries} name="Item revenue" valueFormat={formatINRCompact} />
            </ChartCard>
            <ChartCard title="Jars sold over time" hint="Jars by order date, where the package size is known.">
              <TimeBars series={jarsSeries} name="Jars sold" valueFormat={jarLabel} />
            </ChartCard>
          </div>

          <div className="adm-chartgrid adm-chartgrid--2">
            <ChartCard title="Variant mix" hint="Packs ordered per variant.">
              <BarList
                items={performance.variants.map((v) => ({
                  key: v.key,
                  label: v.label,
                  value: v.packs,
                  sub: `${v.productName} · ${jarLabel(v.jars)} · ${formatINR(v.revenue)}`,
                }))}
                valueFormat={packLabel}
                gold
                empty="No ordered items yet."
              />
            </ChartCard>

            <ChartCard
              title="Coming-soon interest"
              hint="Notify-me signups per product — one customer per product."
              aside={notifyLoading || notifyError ? null : `${interest.total} signup${interest.total === 1 ? '' : 's'}`}
            >
              {notifyLoading ? (
                <p className="adm-chart-empty">Loading signups…</p>
              ) : notifyError ? (
                <p className="adm-chart-empty">Could not read notify-me signups.</p>
              ) : (
                <>
                  <BarList items={interest.rows} showShare={false} valueFormat={(v) => `${v}`} empty="No notify-me signups yet." />
                  {interest.unmatched > 0 && (
                    <p className="adm-chart-caption">{interest.unmatched} signup(s) are for products that are not currently marked coming soon.</p>
                  )}
                </>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}