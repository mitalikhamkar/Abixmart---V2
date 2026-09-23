import React, { useMemo, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import { formatDate, initials } from '@/admin/utils/format';

export default function Customers() {
  const { data: users, loading, error } = useAdminCollection('users', { orderByField: 'createdAt', direction: 'desc' });
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => [u.fullName, u.email, u.phone].some((f) => (f || '').toLowerCase().includes(q)));
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
          <h1 className="mt-2 font-display text-3xl text-charcoal">Customers</h1>
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full h-11 pl-9 pr-3 border border-charcoal/15 bg-ivory text-sm text-charcoal placeholder:text-charcoal/35 rounded-md focus:outline-none focus:border-resin"
          />
        </div>
      </div>

      {loading ? (
        <LoadingState label="Loading customers…" />
      ) : error ? (
        <ErrorState message="Could not load customers. Please refresh." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No matches' : 'No customers yet'}
          body={search ? 'Try a different search term.' : 'Registered customers will appear here.'}
        />
      ) : (
        <>
          <div className="hidden md:block border border-charcoal/10 bg-ivory rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal/10 text-left">
                  <th className="label-meta text-charcoal/40 font-normal px-5 py-3">Name</th>
                  <th className="label-meta text-charcoal/40 font-normal px-5 py-3">Email</th>
                  <th className="label-meta text-charcoal/40 font-normal px-5 py-3">Phone</th>
                  <th className="label-meta text-charcoal/40 font-normal px-5 py-3">Joined</th>
                  <th className="label-meta text-charcoal/40 font-normal px-5 py-3">Verified</th>
                  <th className="label-meta text-charcoal/40 font-normal px-5 py-3">Provider</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className="border-b border-charcoal/6 last:border-0 hover:bg-charcoal/[0.02] cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-charcoal font-medium">{u.fullName || '—'}</td>
                    <td className="px-5 py-3.5 text-charcoal/70 truncate max-w-[220px]">{u.email || '—'}</td>
                    <td className="px-5 py-3.5 text-charcoal/70">{u.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-charcoal/50">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`label-meta ${u.emailVerified ? 'text-green-600' : 'text-charcoal/35'}`}>
                        {u.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-charcoal/50 capitalize">{u.provider || 'password'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelected(u)}
                className="w-full text-left border border-charcoal/10 bg-ivory rounded-md p-4 flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-full bg-resin/15 text-resin font-display flex items-center justify-center shrink-0">
                  {initials(u.fullName || u.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-charcoal font-medium truncate">{u.fullName || 'Unnamed'}</p>
                  <p className="text-xs text-charcoal/50 truncate">{u.email}</p>
                </div>
                <span className={`label-meta shrink-0 ${u.emailVerified ? 'text-green-600' : 'text-charcoal/35'}`}>
                  {u.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-charcoal/50 px-4 py-6"
          onClick={() => setSelected(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-ivory rounded-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-resin/15 text-resin font-display text-lg flex items-center justify-center">
                {initials(selected.fullName || selected.email)}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg text-charcoal truncate">{selected.fullName || 'Unnamed'}</p>
                <p className="text-xs text-charcoal/50 truncate">{selected.email}</p>
              </div>
            </div>

            <span className="label-meta text-charcoal/35 mt-5 block">Account</span>
            <dl className="mt-2 space-y-3 text-sm">
              {[
                ['Phone', selected.phone || '—'],
                ['Alternate Phone', selected.alternatePhone || '—'],
                ['Joined', formatDate(selected.createdAt)],
                ['Last login', formatDate(selected.lastLoginAt)],
                ['Email verified', selected.emailVerified ? 'Yes' : 'No'],
                ['Sign-in provider', selected.provider || 'password'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-charcoal/8 pb-2.5">
                  <dt className="text-charcoal/45 label-meta">{label}</dt>
                  <dd className="text-charcoal">{value}</dd>
                </div>
              ))}
            </dl>

            {/* NEW — reflects the same users/{uid} doc customers edit via
                Account > Edit Profile. No second data source. */}
            <span className="label-meta text-charcoal/35 mt-6 block">Address</span>
            <dl className="mt-2 space-y-3 text-sm">
              {[
                ['Address', selected.address || '—'],
                ['City', selected.city || '—'],
                ['State', selected.state || '—'],
                ['Pincode', selected.pincode || '—'],
                ['Country', selected.country || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-charcoal/8 pb-2.5">
                  <dt className="text-charcoal/45 label-meta">{label}</dt>
                  <dd className="text-charcoal text-right">{value}</dd>
                </div>
              ))}
            </dl>

            <button onClick={() => setSelected(null)} className="btn-outline w-full mt-6">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}