import React, { useMemo, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import { formatDate, initials } from '@/admin/utils/format';

function KvList({ rows, wide }) {
  return (
    <dl className="adm-kv" style={{ marginTop: '0.4rem' }}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd style={wide ? { textAlign: 'right' } : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

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
    <div className="adm-page">
      <PageHeader title="Customers">
        <div className="adm-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="adm-input"
          />
        </div>
      </PageHeader>

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
          <div className="adm-panel adm-table-wrap adm-show-md">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined</th>
                  <th>Verified</th>
                  <th>Provider</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} onClick={() => setSelected(u)} className="is-click">
                    <td className="is-strong">{u.fullName || '—'}</td>
                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{formatDate(u.createdAt)}</td>
                    <td>
                      <span className={`adm-flag ${u.emailVerified ? 'is-on' : ''}`}>
                        {u.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{u.provider || 'password'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="adm-stack adm-show-sm">
            {filtered.map((u) => (
              <button key={u.id} onClick={() => setSelected(u)} className="adm-panel adm-mcard">
                <div className="adm-avatar font-display">{initials(u.fullName || u.email)}</div>
                <div className="min-w-0" style={{ flex: 1 }}>
                  <p className="adm-row-title">{u.fullName || 'Unnamed'}</p>
                  <p className="adm-row-sub">{u.email}</p>
                </div>
                <span className={`adm-flag ${u.emailVerified ? 'is-on' : ''}`} style={{ flexShrink: 0 }}>
                  {u.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="adm-modal-backdrop" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} className="adm-modal">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="adm-avatar adm-avatar--lg font-display">
                {initials(selected.fullName || selected.email)}
              </div>
              <div className="min-w-0">
                <p className="font-display adm-row-title" style={{ fontSize: '1.125rem' }}>{selected.fullName || 'Unnamed'}</p>
                <p className="adm-row-sub">{selected.email}</p>
              </div>
            </div>

            <span className="adm-label" style={{ display: 'block', marginTop: '1.5rem' }}>Account</span>
            <KvList
              rows={[
                ['Phone', selected.phone || '—'],
                ['Alternate Phone', selected.alternatePhone || '—'],
                ['Joined', formatDate(selected.createdAt)],
                ['Last login', formatDate(selected.lastLoginAt)],
                ['Email verified', selected.emailVerified ? 'Yes' : 'No'],
                ['Sign-in provider', selected.provider || 'password'],
              ]}
            />

            {/* Reflects the same users/{uid} doc customers edit via
                Account > Edit Profile. No second data source. */}
            <span className="adm-label" style={{ display: 'block', marginTop: '1.5rem' }}>Address</span>
            <KvList
              wide
              rows={[
                ['Address', selected.address || '—'],
                ['City', selected.city || '—'],
                ['State', selected.state || '—'],
                ['Pincode', selected.pincode || '—'],
                ['Country', selected.country || '—'],
              ]}
            />

            <button onClick={() => setSelected(null)} className="adm-btn adm-btn--block" style={{ marginTop: '1.5rem' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}