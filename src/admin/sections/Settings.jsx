import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState } from '@/admin/components/StateViews';
import { useAdminAuth } from '@/admin/lib/AdminAuthContext';

export default function Settings() {
  const { user } = useAdminAuth();
  const { data: admins, loading, error } = useAdminCollection('admins');

  return (
    <div className="adm-page">
      <PageHeader title="Settings" />

      <div>
        <div className="adm-section-title">
          <ShieldCheck size={16} />
          <h2 className="adm-h2 font-display">Admin Accounts</h2>
        </div>
        <p className="adm-subtitle" style={{ marginTop: 0, marginBottom: '1rem' }}>
          Admin access is granted manually from the Firebase Console (Firestore → <code className="adm-code">admins</code> collection)
          as a deliberate security measure — no interface, including this one, can grant admin access to an account.
        </p>

        {loading ? (
          <LoadingState label="Loading admins…" />
        ) : error ? (
          <ErrorState message="Could not load admin accounts." />
        ) : (
          <div className="adm-list">
            {admins.map((a) => (
              <div key={a.id} className="adm-row" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="adm-row-main">
                  <p className="adm-row-title" style={{ fontSize: '0.875rem' }}>{a.email || a.id}</p>
                  <p className="adm-row-meta" style={{ textTransform: 'capitalize' }}>{a.role || 'admin'}</p>
                </div>
                {a.id === user?.uid && <span className="adm-label adm-label--gold" style={{ flexShrink: 0 }}>You</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="adm-h2 font-display" style={{ marginBottom: '0.75rem' }}>Store Configuration</h2>
        <p className="adm-subtitle" style={{ marginTop: 0 }}>
          Inquiry routing, notification preferences, and acquisition-source settings will live here as those systems come online.
        </p>
      </div>
    </div>
  );
}