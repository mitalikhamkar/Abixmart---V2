import React from 'react';
import { Users2 } from 'lucide-react';
import { EmptyState } from '@/admin/components/StateViews';

export default function Community() {
  return (
    <div className="space-y-6">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Community</h1>
      </div>
      <EmptyState
        icon={Users2}
        title="No community metrics yet"
        body="Channel-level engagement for WhatsApp, Instagram, Telegram, and Facebook will appear here as those integrations are added."
      />
    </div>
  );
}