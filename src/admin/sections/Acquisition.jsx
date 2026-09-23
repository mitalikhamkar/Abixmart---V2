import React from 'react';
import { Radar } from 'lucide-react';
import { EmptyState } from '@/admin/components/StateViews';

export default function Acquisition() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Acquisition</h1>
      </div>
      <EmptyState
        icon={Radar}
        title="No acquisition data yet"
        body="A breakdown by source will appear here once inquiries and customers start carrying acquisition-source information."
      />
    </div>
  );
}