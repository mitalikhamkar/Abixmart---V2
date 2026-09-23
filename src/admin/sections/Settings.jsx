import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import { LoadingState, ErrorState } from '@/admin/components/StateViews';
import { useAdminAuth } from '@/admin/lib/AdminAuthContext';

export default function Settings() {
  const { user } = useAdminAuth();
  const { data: admins, loading, error } = useAdminCollection('admins');

  return (
    <div className="space-y-8">
      <div>
        <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
        <h1 className="mt-2 font-display text-3xl text-charcoal">Settings</h1>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} className="text-resin" />
          <h2 className="font-display text-xl text-charcoal">Admin Accounts</h2>
        </div>
        <p className="text-sm text-charcoal/50 mb-4">
          Admin access is granted manually from the Firebase Console (Firestore → <code className="text-charcoal/70">admins</code> collection)
          as a deliberate security measure — no interface, including this one, can grant admin access to an account.
        </p>

        {loading ? (
          <LoadingState label="Loading admins…" />
        ) : error ? (
          <ErrorState message="Could not load admin accounts." />
        ) : (
          <div className="border border-charcoal/10 bg-ivory rounded-md divide-y divide-charcoal/8 overflow-hidden">
            {admins.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-charcoal text-sm truncate">{a.email || a.id}</p>
                  <p className="text-xs text-charcoal/40 capitalize">{a.role || 'admin'}</p>
                </div>
                {a.id === user?.uid && <span className="label-meta text-resin shrink-0">You</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-xl text-charcoal mb-3">Store Configuration</h2>
        <p className="text-sm text-charcoal/50">
          Inquiry routing, notification preferences, and acquisition-source settings will live here as those systems come online.
        </p>
      </div>
    </div>
  );
}