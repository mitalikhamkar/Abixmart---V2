// src/components/abix/ComingSoonMiniCard.jsx
import React from 'react';
import { Bell, Check } from 'lucide-react';
import { useProductNotify } from '@/hooks/useProductNotify';
import { useNavigate } from 'react-router-dom';
import { ABIX } from './brandColors';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

// NEW — a deliberately small Coming Soon card for the Shop page, so
// this section reads as "what's next" rather than a second product
// showcase. ShopCollectionCard.jsx (the larger version) is untouched
// and still used elsewhere (ProductDetail.jsx's related products).
export default function ComingSoonMiniCard({ product }) {
  const navigate = useNavigate();
  const { status, subscribe, isLoggedIn } = useProductNotify(product.id, product.name);

  const handleClick = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem(PENDING_NOTIFY_KEY, product.id);
      navigate('/login');
      return;
    }
    subscribe();
  };

  const subscribed = status === 'subscribed' || status === 'already-subscribed';

    return (
    <div className="group relative overflow-hidden rounded-xl border" style={{ borderColor: ABIX.ivory12 }}>
      <div className="relative aspect-square overflow-hidden">
        {product.shopImage && (
          <img
            src={product.shopImage}
            alt={product.name}
            className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${ABIX.obsidian}CC 0%, transparent 55%)` }} />
      </div>

      <div className="p-3">
        <h4 className="font-display text-sm leading-tight truncate" style={{ color: ABIX.ivory }}>{product.name}</h4>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-[9px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
            Coming Soon
          </span>
          <button
            onClick={handleClick}
            disabled={status === 'submitting'}
            aria-label={subscribed ? 'On the notify list' : 'Notify me'}
            className="shrink-0 transition-colors"
            style={{ color: subscribed ? ABIX.gold : ABIX.ivory45 }}
          >
            {subscribed ? <Check size={13} /> : <Bell size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}