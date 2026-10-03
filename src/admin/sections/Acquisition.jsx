import React, { useMemo } from 'react';
import { Users } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import StatCard from '@/admin/components/StatCard';
import { LoadingState, ErrorState } from '@/admin/components/StateViews';
import { ChartCard, BarList, TimeBars } from '@/admin/components/Charts';
import { buildSeries, calculateSignupMethodDistribution, formatPercent } from '@/admin/utils/metrics';

export default function Acquisition() {
  const { data: users, loading, error } = useAdminCollection('users');

  const methods = useMemo(() => calculateSignupMethodDistribution(users), [users]);
  const monthly = useMemo(
    () => buildSeries(users, { period: 'month', getDate: (u) => u.createdAt }),
    [users]
  );

  const count = (key) => methods.find((m) => m.key === key)?.value || 0;
  const share = (n) => (users.length ? formatPercent(n / users.length) : '—');

  return (
    <div className="adm-page">
      <PageHeader title="Acquisition" description="How customers sign up. Where they came from is not tracked yet." />

      {loading ? (
        <LoadingState label="Loading customers…" />
      ) : error ? (
        <ErrorState message="Could not load customers. Please refresh." />
      ) : (
        <>
          <div className="adm-stats">
            <StatCard label="Total Customers" value={users.length} icon={Users} />
            <StatCard label="Google Sign-ups" value={count('google')} hint={`${share(count('google'))} of customers`} />
            <StatCard label="Email Sign-ups" value={count('password')} hint={`${share(count('password'))} of customers`} />
          </div>

          <div className="adm-chartgrid adm-chartgrid--2">
            <ChartCard title="Sign-up method" hint="The way each account was created (customers.provider).">
              <BarList items={methods} empty="No customers yet." />
            </ChartCard>
            <ChartCard title="New customers by month" hint="Registrations over the last 12 months.">
              <TimeBars series={monthly} name="New customers by month" valueFormat={(v) => `${v} customer${v === 1 ? '' : 's'}`} />
            </ChartCard>
          </div>

          <div className="adm-note">
            <span className="adm-label adm-label--gold">Marketing acquisition is not tracked yet</span>
            <p className="adm-subtitle" style={{ marginTop: '0.5rem' }}>
              The website does not currently record where a visitor came from. That means there is no data for traffic source, referrer,
              campaign or UTM tags, social channel, customer acquisition cost, return on ad spend, or conversion rate, so none of these are shown.
              Sign-up method above describes how an account was created, not how the customer found ABIXMART.
            </p>
            <p className="adm-subtitle" style={{ marginTop: '0.75rem' }}>
              Real source reporting needs the customer site to capture the first visit's source and save it with each account. That has not been built.
            </p>
          </div>
        </>
      )}
    </div>
  );
}