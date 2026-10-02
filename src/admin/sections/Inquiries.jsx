import React, { useMemo, useState } from 'react';
import { MessageSquare, Search, Phone, Mail, MessageCircle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '@/admin/lib/adminFirebase';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
import PageHeader from '@/admin/components/PageHeader';
import { LoadingState, ErrorState, EmptyState } from '@/admin/components/StateViews';
import StatusBadge from '@/admin/components/StatusBadge';
import { formatDateTime } from '@/admin/utils/format';

const STATUSES = ['new', 'contacted', 'resolved'];

function telHref(phone) {
  return `tel:${phone}`;
}

function mailHref(email) {
  return `mailto:${email}`;
}

function waHref(phone) {
  const digits = String(phone).replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}`;
}

export default function Inquiries() {
  const {
    data: inquiries,
    loading,
    error,
  } = useAdminCollection('inquiries', {
    orderByField: 'createdAt',
    direction: 'desc',
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const filtered = useMemo(() => {
    let list = inquiries;

    if (statusFilter !== 'all') {
      list = list.filter(
        (i) => (i.status || 'new').toLowerCase() === statusFilter
      );
    }

    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((i) =>
        [i.name, i.email, i.phone, i.productInterest].some((f) =>
          (f || '').toLowerCase().includes(q)
        )
      );
    }

    return list;
  }, [inquiries, search, statusFilter]);

  const handleStatusChange = async (id, status) => {
    setUpdatingId(id);

    try {
      await updateDoc(doc(db, 'inquiries', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        '[ABIXMART Admin] Failed to update inquiry status:',
        err?.code,
        err?.message
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="adm-page">
      <PageHeader title="Inquiries">
        <div className="adm-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries..."
            className="adm-input"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="adm-select"
        >
          <option value="all">All statuses</option>

          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </PageHeader>

      {loading ? (
        <LoadingState label="Loading inquiries..." />
      ) : error ? (
        <ErrorState message="Could not load inquiries. Please refresh." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No inquiries found"
          body="Inquiries submitted through the website will appear here."
        />
      ) : (
        <div className="adm-stack">
          {filtered.map((inq) => (
            <div key={inq.id} className="adm-panel adm-panel-pad">
              <div className="adm-inq">
                <div className="min-w-0" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <p className="adm-row-title" style={{ whiteSpace: 'normal' }}>
                      {inq.name || 'Unnamed'}
                    </p>

                    <StatusBadge status={inq.status || 'new'} />
                  </div>

                  <p className="adm-row-sub" style={{ whiteSpace: 'normal' }}>
                    {inq.email || 'No email'}{' '}
                    {inq.phone ? `| ${inq.phone}` : ''}
                  </p>

                  {inq.productInterest && (
                    <p className="adm-row-meta" style={{ marginTop: '0.3rem' }}>
                      Interested in: {inq.productInterest}
                    </p>
                  )}

                  {inq.message && (
                    <p className="adm-body-text">
                      {inq.message}
                    </p>
                  )}

                  <p className="adm-row-meta" style={{ marginTop: '0.7rem' }}>
                    {formatDateTime(inq.createdAt)}
                    {inq.source ? ` | via ${inq.source}` : ''}
                  </p>
                </div>

                <div className="adm-inq-side">
                  <div className="adm-iconrow">
                    {inq.phone && (
                      <a href={telHref(inq.phone)} className="adm-iconbtn" title="Call">
                        <Phone size={14} />
                      </a>
                    )}

                    {inq.email && (
                      <a href={mailHref(inq.email)} className="adm-iconbtn" title="Email">
                        <Mail size={14} />
                      </a>
                    )}

                    {inq.phone && (
                      <a
                        href={waHref(inq.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="adm-iconbtn"
                        title="WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </div>

                  <select
                    value={(inq.status || 'new').toLowerCase()}
                    disabled={updatingId === inq.id}
                    onChange={(e) =>
                      handleStatusChange(inq.id, e.target.value)
                    }
                    className="adm-select adm-select--sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}