import React from 'react';
import { Activity } from 'lucide-react';
import { EmptyState } from '@/admin/components/StateViews';

export default function CustomerActivity() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Customer Activity</h1>
      </div>
      <EmptyState
        icon={Activity}
        title="No activity tracked yet"
        body="Once login, browsing, cart, and purchase events are logged to Firestore, a timeline will appear here."
      />
    </div>
  );
}