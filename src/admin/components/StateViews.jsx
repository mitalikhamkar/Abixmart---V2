import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="adm-loading">
      <span className="adm-spinner" />
      <p className="adm-label">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, body }) {
  return (
    <div className="adm-state adm-state--empty">
      <Icon size={28} className="adm-state-icon" />
      <p className="adm-state-title font-display">{title}</p>
      {body && <p className="adm-state-body">{body}</p>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong loading this data.' }) {
  return (
    <div className="adm-state adm-state--error">
      <AlertTriangle size={28} className="adm-state-icon" />
      <p className="adm-state-body">{message}</p>
    </div>
  );
}