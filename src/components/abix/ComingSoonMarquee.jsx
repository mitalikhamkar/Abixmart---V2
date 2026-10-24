// src/components/abix/ComingSoonMarquee.jsx
import React, { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCatalog } from '@/lib/CatalogContext';
import { useUpcoming } from '@/lib/upcomingContext';
import { useProductNotify } from '@/hooks/useProductNotify';
import { ABIX } from './brandColors';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

// Card is intentionally its own component so each one's notify hook
// state is independent — same interaction pattern as the existing
// ComingSoonMiniCard, just sized for the marquee track.
//
// CHANGED: the image and name now open the shared product-information view,
// and a "Pre-order" action sits beside the Notify Me bell. The Notify Me
// behaviour is unchanged. `decorative` marks the duplicate copy that makes
// the loop seamless, so keyboard and screen-reader users meet each product
// once.
function MarqueeCard({ product, decorative = false }) {
  const navigate = useNavigate();
  const { openView, openPreOrder } = useUpcoming();
  const { status, subscribe, isLoggedIn } = useProductNotify(product.id, product.name);
  const tab = decorative ? -1 : undefined;

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
      aria-hidden={decorative ? 'true' : undefined}
    >
      <button
        type="button"
        onClick={() => openView(product)}
        tabIndex={tab}
        aria-label={`View ${product.name}`}
        className="block w-full text-left"
      >
        <span className="relative block aspect-[4/5] overflow-hidden">
          {product.shopImage && (
            <img
              src={product.shopImage}
              alt={product.name}
              draggable={false}
              className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-[1.05]"
            />
          )}
          <span className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${ABIX.obsidian}CC 0%, transparent 55%)` }} />

          {/* Subtle emphasis on hover — border brightens slightly, no jump */}
          <span
            className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
            style={{ boxShadow: `inset 0 0 0 1px ${ABIX.gold25}` }}
          />
        </span>

        <span className="block px-4 pt-4">
          <span className="block font-display text-lg leading-tight truncate" style={{ color: ABIX.ivory }}>{product.name}</span>
        </span>
      </button>

      <div className="px-4 pb-4 pt-1.5 flex items-center justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
          Coming Soon
        </span>
        <span className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => openPreOrder(product)}
            tabIndex={tab}
            className="text-[9px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline"
            style={{ color: ABIX.goldLight }}
          >
            Pre-order
          </button>
          <button
            onClick={handleClick}
            tabIndex={tab}
            disabled={status === 'submitting'}
            aria-label={subscribed ? 'On the notify list' : 'Notify me'}
            className="shrink-0 transition-colors"
            style={{ color: subscribed ? ABIX.gold : ABIX.ivory45 }}
          >
            {subscribed ? <Check size={14} /> : <Bell size={14} />}
          </button>
        </span>
      </div>
    </div>
  );
}

// NEW — shared continuous product reel, reused wherever "Coming Soon"
// appears (Shop, About). Pulls from the Firestore-backed
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
          <MarqueeCard key={`${p.id}-${i}`} product={p} decorative={i >= comingSoon.length} />
        ))}
      </div>
    </div>
  );
}