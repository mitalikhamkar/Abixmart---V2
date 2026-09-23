import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="label-meta text-charcoal/40">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-charcoal/10 bg-charcoal/[0.02] rounded-md">
      <Icon size={28} className="text-charcoal/25" />
      <p className="mt-4 font-display text-lg text-charcoal">{title}</p>
      {body && <p className="mt-1.5 text-sm text-charcoal/50 max-w-sm">{body}</p>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong loading this data.' }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 border border-red-300/50 bg-red-50 rounded-md">
      <AlertTriangle size={28} className="text-red-500" />
      <p className="mt-4 text-red-700 text-sm max-w-sm">{message}</p>
    </div>
  );
}