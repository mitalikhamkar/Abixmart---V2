import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/admin/lib/AdminAuthContext';

export default function AdminGuard({ children }) {
  const { user, isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal">
        <p className="text-ivory/40 text-sm uppercase tracking-luxe-sm">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal px-6">
        <div className="max-w-sm text-center">
          <p className="label-meta text-gold-light">ABIXMART Admin</p>
          <h1 className="mt-3 font-display text-2xl text-ivory">Access Denied</h1>
          <p className="mt-3 text-ivory/60 text-sm leading-relaxed">
            This account does not have admin access. If you believe this is a mistake, contact another administrator.
          </p>
        </div>
      </div>
    );
  }

  return children;
}