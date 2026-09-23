import React from 'react';
import { BarChart3 } from 'lucide-react';
import { EmptyState } from '@/admin/components/StateViews';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Analytics</h1>
      </div>
      <EmptyState
        icon={BarChart3}
        title="Analytics will populate as orders come in"
        body="Revenue, conversion, and average order value will appear here once checkout is live and orders start accumulating in Firestore."
      />
    </div>
  );
}