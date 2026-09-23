import React from 'react';
import { TrendingUp } from 'lucide-react';
import { EmptyState } from '@/admin/components/StateViews';

export default function ProductPerformance() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Product Performance</h1>
      </div>
      <EmptyState
        icon={TrendingUp}
        title="No sales data yet"
        body="Best sellers, units sold, and revenue by product will appear here once orders start coming in."
      />
    </div>
  );
}