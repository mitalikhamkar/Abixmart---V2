import React from 'react';
import { Activity } from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';
import { EmptyState } from '@/admin/components/StateViews';

export default function CustomerActivity() {
  return (
    <div className="adm-page">
      <PageHeader title="Customer Activity" />
      <EmptyState
        icon={Activity}
        title="No activity tracked yet"
        body="Once login, browsing, cart, and purchase events are logged to Firestore, a timeline will appear here."
      />
    </div>
  );
}