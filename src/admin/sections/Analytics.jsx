import React from 'react';
import { BarChart3 } from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';
import { EmptyState } from '@/admin/components/StateViews';

export default function Analytics() {
  return (
    <div className="adm-page">
      <PageHeader title="Analytics" />
      <EmptyState
        icon={BarChart3}
        title="Analytics will populate as orders come in"
        body="Revenue, conversion, and average order value will appear here once checkout is live and orders start accumulating in Firestore."
      />
    </div>
  );
}