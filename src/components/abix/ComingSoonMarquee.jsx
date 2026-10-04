// src/components/abix/ComingSoonMarquee.jsx
import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCatalog } from '@/lib/CatalogContext';
import { useProductNotify } from '@/hooks/useProductNotify';
import { ABIX } from './brandColors';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

// Card is intentionally its own component so each one's notify hook
// state is independent — same interaction pattern as the existing
// ComingSoonMiniCard, just sized for the marquee track.
function MarqueeCard({ product }) {
  const navigate = useNavigate();
  const { status, subscribe, isLoggedIn } = useProductNotify(product.id, product.name);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      sessionStorage.setItem(PENDING_NOTIFY_KEY, product.id);
      navigate('/login');
      return;
    }
    subscribe();
  };

  const subscribed = status === 'subscribed' || status === 'already-subscribed';

  return (
    <div
      className="group relative shrink-0 w-[78vw] sm:w-[46vw] md:w-[30vw] lg:w-[300px] overflow-hidden rounded-xl border transition-[border-color,transform] duration-500"
      style={{ borderColor: ABIX.ivory12 }}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        {product.shopImage && (
          <img
            src={product.shopImage}
            alt={product.name}
            draggable={false}
            className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.05]"
          />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${ABIX.obsidian}CC 0%, transparent 55%)` }} />

        {/* Subtle emphasis on hover — border brightens slightly, no jump */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 1px ${ABIX.gold25}` }}
        />
      </div>

      <div className="p-4">
        <h4 className="font-display text-lg leading-tight truncate" style={{ color: ABIX.ivory }}>{product.name}</h4>
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
            {subscribed ? <Check size={14} /> : <Bell size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// NEW — shared continuous product reel, reused wherever "Coming Soon"
// appears (Home, Shop, About). Pulls from the Firestore-backed
// catalog (status === 'coming_soon'), so a product set to Coming Soon
// in Admin is automatically picked up here with no changes to this
// file or any page using it.
//
// Seamless loop: the product sequence is rendered TWICE back to back
// in one flex track, and the CSS animation translates the track by
// exactly -50% (the width of one full sequence) then resets to 0% —
// since the second copy is pixel-identical to the first, that reset is
// invisible. Duration scales with item count so the perceived speed
// stays constant regardless of how many coming-soon products exist.
export default function ComingSoonMarquee() {
  const { comingSoonProducts: comingSoon, loading } = useCatalog();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handleChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  if (loading || comingSoon.length === 0) return null;

  // ~7s per card feels calm/editorial rather than ticker-like.
  const durationSeconds = comingSoon.length * 7;

  if (reduceMotion) {
    // Reduced motion: a normal horizontally scrollable row, single
    // sequence, no animation — fully usable, no motion forced.
    return (
      <div className="overflow-x-auto no-scrollbar" style={{ overflowY: 'hidden' }}>
        <div className="flex gap-5 lg:gap-6 px-6 lg:px-10 pb-2">
          {comingSoon.map((p) => (
            <MarqueeCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <style>{`
        @keyframes abixComingSoonMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="flex gap-5 lg:gap-6 w-max group/marquee [animation-play-state:running] group-hover/marquee:[animation-play-state:paused]"
        style={{
          animation: `abixComingSoonMarquee ${durationSeconds}s linear infinite`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.animationPlayState = 'paused'; }}
        onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'running'; }}
      >
        {[...comingSoon, ...comingSoon].map((p, i) => (
          <MarqueeCard key={`${p.id}-${i}`} product={p} />
        ))}
      </div>
    </div>
  );
}