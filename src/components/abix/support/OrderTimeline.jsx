// src/components/abix/support/OrderTimeline.jsx
//
// Order progress from GENUINE order data only: the step states come from the
// order's real orderStatus (via statusToDetailIndex), and the facts shown
// (order ID, date placed, items, total, payment) are fields on the order record.
// No step timestamps are shown, because the order record has none.
import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { FOREST } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

const PAYMENT_LABEL = { COD: 'Cash on Delivery' };

function placedDate(order) {
  const d = order?.createdAt?.toDate ? order.createdAt.toDate() : null;
  return d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null;
}

export default function OrderTimeline({ order, detailIndex, steps }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(false);
    let id2 = 0;
    const id1 = window.requestAnimationFrame(() => {
      id2 = window.requestAnimationFrame(() => setOn(true));
    });
    return () => {
      window.cancelAnimationFrame(id1);
      window.cancelAnimationFrame(id2);
    };
  }, [order?.id]);

  const placed = placedDate(order);
  const itemCount = (order.items || []).reduce((n, it) => n + (Number(it.qty) || 0), 0);
  const facts = [
    placed && { label: 'Placed', value: placed },
    itemCount > 0 && { label: 'Items', value: String(itemCount) },
    Number.isFinite(Number(order.total)) && { label: 'Total', value: `₹${order.total}` },
    order.paymentMethod && { label: 'Payment', value: PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod },
  ].filter(Boolean);

  const cancelled = order.orderStatus === 'cancelled';
  const current = steps[detailIndex];

  return (
    <div className="border p-6 sm:p-8" style={{ borderColor: ABIX.ivory12, background: `${FOREST.deepest}CC` }}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <span className="font-display text-xl sm:text-2xl break-all" style={{ color: ABIX.ivory }}>
          Order {order.orderId}
        </span>
        <span
          className="label-meta px-2.5 py-1 rounded-full border"
          style={{ color: cancelled ? '#C98473' : ABIX.goldLight, borderColor: cancelled ? '#C98473' : ABIX.gold25 }}
        >
          {cancelled ? 'Cancelled' : current?.label}
        </span>
      </div>

      {facts.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
          {facts.map((f) => (
            <div key={f.label} className="min-w-0 border-t pt-3" style={{ borderColor: ABIX.ivory12 }}>
              <dt className="label-meta" style={{ color: ABIX.ivory45 }}>{f.label}</dt>
              <dd className="mt-1 text-sm" style={{ color: ABIX.ivory }}>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {cancelled ? (
        <p className="mt-7 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
          This order has been cancelled, so there is no delivery progress to show. If that is not what you expected, please
          write to us below.
        </p>
      ) : (
        <ol className="mt-8">
          {steps.map((s, i) => {
            const done = i <= detailIndex;
            const isCurrent = i === detailIndex;
            return (
              <li key={s.key} className="grid grid-cols-[auto_1fr] gap-4 list-none">
                <div className="flex flex-col items-center">
                  <span className="relative inline-flex h-7 w-7 items-center justify-center">
                    {isCurrent && on && (
                      <span aria-hidden="true" className="abix-pulse absolute inset-0 rounded-full" style={{ border: `1px solid ${ABIX.gold}` }} />
                    )}
                    <span
                      className="relative h-7 w-7 rounded-full inline-flex items-center justify-center text-[10px] transition-colors duration-500"
                      style={{
                        background: done && on ? ABIX.gold : 'transparent',
                        color: done && on ? FOREST.deepest : ABIX.ivory45,
                        border: done && on ? `1px solid ${ABIX.gold}` : `1px solid ${ABIX.ivory25}`,
                        transitionDelay: `${i * 140}ms`,
                      }}
                    >
                      {done ? <Check size={13} /> : i + 1}
                    </span>
                  </span>
                  {i < steps.length - 1 && (
                    <span className="relative w-px flex-1 my-1 overflow-hidden" style={{ background: ABIX.ivory12 }}>
                      <span
                        className="absolute inset-x-0 top-0"
                        style={{
                          height: i < detailIndex && on ? '100%' : '0%',
                          background: ABIX.gold,
                          transition: 'height 0.6s cubic-bezier(0.16,1,0.3,1)',
                          transitionDelay: `${i * 140 + 120}ms`,
                        }}
                      />
                    </span>
                  )}
                </div>
                <div className="pb-6 min-w-0">
                  <h4 className="font-display text-lg" style={{ color: done ? ABIX.ivory : ABIX.ivory45 }}>{s.label}</h4>
                  <p className="text-sm leading-relaxed" style={{ color: done ? ABIX.ivory70 : ABIX.ivory25 }}>{s.desc}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}