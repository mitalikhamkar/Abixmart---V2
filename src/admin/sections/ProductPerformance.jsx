import React from 'react';
import { TrendingUp } from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';
import { EmptyState } from '@/admin/components/StateViews';

export default function ProductPerformance() {
  return (
    <div className="adm-page">
      <PageHeader title="Product Performance" />
      <EmptyState
        icon={TrendingUp}
        title="No sales data yet"
        body="Best sellers, units sold, and revenue by product will appear here once orders start coming in."
      />
    </div>
  );
}