// src/pages/Shop.jsx
import React, { useEffect, useState } from 'react';
import PageTransition from '@/components/abix/PageTransition';
import CollectionHero from '@/components/abix/CollectionHero';
import FeaturedShilajit from '@/components/abix/FeaturedShilajit';
import ShopCollectionCard from '@/components/abix/ShopCollectionCard';
import BrandStrip from '@/components/abix/BrandStrip';
import Eyebrow from '@/components/abix/Eyebrow';
import { products, availableProducts } from '@/data/products';
import { useAuth } from '@/lib/AuthContext';
import { checkNotifySubscribed, subscribeToNotify } from '@/lib/notifyUtils';
import { Check, X } from 'lucide-react';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

export default function Shop() {
  const { user } = useAuth();
  const featured = availableProducts()[0];
  const otherProducts = products.filter((p) => !featured || p.id !== featured.id);
  const [returnBanner, setReturnBanner] = useState(null);

  // Resumes a "Notify Me" click that was interrupted by a login redirect.
  // See ShopCollectionCard.jsx for where the pending product ID is stored.
  useEffect(() => {
    const pendingId = sessionStorage.getItem(PENDING_NOTIFY_KEY);
    if (!pendingId || !user) return;

    (async () => {
      const product = products.find((p) => p.id === pendingId);
      sessionStorage.removeItem(PENDING_NOTIFY_KEY);
      if (!product) return;
      try {
        const already = await checkNotifySubscribed(user.uid, product.id);
        if (!already) {
          await subscribeToNotify(user.uid, user.email, product.id, product.name);
        }
        setReturnBanner(product.name);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Pending notify resume failed:', err?.code, err?.message);
      }
    })();
  }, [user]);

  return (
    <PageTransition>
      {returnBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#211E1F] text-ivory border border-[#BE8A4B]/30 px-5 py-3.5 flex items-center gap-3 shadow-lg">
          <Check size={16} className="text-[#D3A467] shrink-0" />
          <span className="text-sm">
            You're on the list for <strong>{returnBanner}</strong>.
          </span>
          <button onClick={() => setReturnBanner(null)} className="text-ivory/40 hover:text-ivory ml-2">
            <X size={14} />
          </button>
        </div>
      )}

      <CollectionHero products={products} />
      <FeaturedShilajit product={featured} />

      <section className="bg-[#1E1C1F] py-16 lg:py-24 border-t border-[#F2ECE2]/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="max-w-2xl mb-10 lg:mb-14">
            <Eyebrow light>More From The Ritual</Eyebrow>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl text-ivory leading-tight">Coming Soon</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {otherProducts.map((p, i) => (
              <ShopCollectionCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      <BrandStrip />
    </PageTransition>
  );
}