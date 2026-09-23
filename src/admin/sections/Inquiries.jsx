import React, { useMemo, useState } from 'react';
import { MessageSquare, Search, Phone, Mail, MessageCircle } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb as db } from '@/admin/lib/adminFirebase';
import { useAdminCollection } from '@/admin/hooks/useAdminCollection';
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="label-meta text-charcoal/40">ABIXMART Admin</p>
          <h1 className="mt-2 font-display text-3xl text-charcoal">
            Inquiries
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/35"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inquiries..."
              className="w-full h-11 pl-9 pr-3 border border-charcoal/15 bg-ivory text-sm rounded-md focus:outline-none focus:border-resin"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-3 border border-charcoal/15 bg-ivory text-sm rounded-md focus:outline-none focus:border-resin capitalize"
          >
            <option value="all">All statuses</option>

            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

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
        <div className="space-y-3">
          {filtered.map((inq) => (
            <div
              key={inq.id}
              className="border border-charcoal/10 bg-ivory rounded-md p-4 sm:p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-charcoal font-medium">
                      {inq.name || 'Unnamed'}
                    </p>

                    <StatusBadge status={inq.status || 'new'} />
                  </div>

                  <p className="text-sm text-charcoal/55 mt-0.5">
                    {inq.email || 'No email'}{' '}
                    {inq.phone ? `| ${inq.phone}` : ''}
                  </p>

                  {inq.productInterest && (
                    <p className="text-xs text-charcoal/40 mt-1">
                      Interested in: {inq.productInterest}
                    </p>
                  )}

                  {inq.message && (
                    <p className="mt-2 text-sm text-charcoal/70 leading-relaxed">
                      {inq.message}
                    </p>
                  )}

                  <p className="text-xs text-charcoal/35 mt-2">
                    {formatDateTime(inq.createdAt)}
                    {inq.source ? ` | via ${inq.source}` : ''}
                  </p>
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0">
                  <div className="flex gap-2">
                    {inq.phone && (
                      <a
                        href={telHref(inq.phone)}
                        className="inline-flex items-center justify-center h-9 w-9 border border-charcoal/15 rounded-md text-charcoal/60 hover:text-resin hover:border-resin transition-colors"
                        title="Call"
                      >
                        <Phone size={14} />
                      </a>
                    )}

                    {inq.email && (
                      <a
                        href={mailHref(inq.email)}
                        className="inline-flex items-center justify-center h-9 w-9 border border-charcoal/15 rounded-md text-charcoal/60 hover:text-resin hover:border-resin transition-colors"
                        title="Email"
                      >
                        <Mail size={14} />
                      </a>
                    )}

                    {inq.phone && (
                      <a
                        href={waHref(inq.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center h-9 w-9 border border-charcoal/15 rounded-md text-charcoal/60 hover:text-resin hover:border-resin transition-colors"
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
                    className="h-9 px-2.5 border border-charcoal/15 bg-ivory text-xs rounded-md focus:outline-none focus:border-resin capitalize disabled:opacity-50"
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