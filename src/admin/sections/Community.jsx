import React from 'react';
import { Users2 } from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';
import { EmptyState } from '@/admin/components/StateViews';

export default function Community() {
  return (
    <div className="adm-page">
      <PageHeader title="Community" />
      <EmptyState
        icon={Users2}
        title="No community metrics yet"
        body="Channel-level engagement for WhatsApp, Instagram, Telegram, and Facebook will appear here as those integrations are added."
      />
    </div>
  );
}