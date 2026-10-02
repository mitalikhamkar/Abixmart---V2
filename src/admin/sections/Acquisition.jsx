import React from 'react';
import { Radar } from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';
import { EmptyState } from '@/admin/components/StateViews';

export default function Acquisition() {
  return (
    <div className="adm-page">
      <PageHeader title="Acquisition" />
      <EmptyState
        icon={Radar}
        title="No acquisition data yet"
        body="A breakdown by source will appear here once inquiries and customers start carrying acquisition-source information."
      />
    </div>
  );
}