import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, X, ShoppingBag } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import { useShop } from '@/lib/ShopContext';
import { useAuth } from '@/lib/AuthContext';
import { useCatalog } from '@/lib/CatalogContext';
import { ABIX } from '@/components/abix/brandColors';

export default function Wishlist() {
  const { user } = useAuth();
  const { wishlist, toggleWishlist, addToCart } = useShop();
  const { products, loading: catalogLoading } = useCatalog();

  const items = wishlist.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  return (
    <PageTransition>
      <section className="relative pt-24 lg:pt-28 pb-20 lg:pb-28 overflow-hidden" style={{ backgroundColor: ABIX.obsidian }}>
        <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10">
          <Eyebrow light>Your Wishlist</Eyebrow>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl leading-tight tracking-tight" style={{ color: ABIX.ivory }}>
            Saved for later.
          </h1>

          {!user ? (
            // Per the brief: show a sign-in state rather than presenting
            // a local-only list as if it were the real, Firebase-backed
            // wishlist a signed-in user would see.
            <div className="mt-16 text-center">
              <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: ABIX.espresso }}>
                <Heart size={22} style={{ color: ABIX.ivory45 }} />
              </div>
              <p className="font-display text-2xl" style={{ color: ABIX.ivory }}>Sign in to see your wishlist</p>
              <p className="mt-2 text-sm max-w-xs mx-auto" style={{ color: ABIX.ivory45 }}>
                Your saved products are kept with your account.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex h-12 px-7 items-center rounded-full text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors"
                style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
              >
                Log in
              </Link>
            </div>
          ) : catalogLoading ? (
            <p className="mt-16 text-center text-sm" style={{ color: ABIX.ivory45 }}>Loading your wishlist…</p>
          ) : items.length === 0 ? (
            <div className="mt-16 text-center">
              <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: ABIX.espresso }}>
                <Heart size={22} style={{ color: ABIX.ivory45 }} />
              </div>
              <p className="font-display text-2xl" style={{ color: ABIX.ivory }}>Nothing saved yet</p>
              <p className="mt-2 text-sm" style={{ color: ABIX.ivory45 }}>Tap the heart on any product to save it here.</p>
              <Link
                to="/shop"
                className="mt-6 inline-flex h-12 px-7 items-center rounded-full text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors"
                style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
              >
                Explore the shop
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((product) => {
                const isAvailable = product.status === 'available';
                return (
                  <div
                    key={product.id}
                    className="relative border rounded-xl overflow-hidden"
                    style={{ borderColor: ABIX.ivory12, backgroundColor: `${ABIX.espresso}40` }}
                  >
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Remove from wishlist"
                      className="absolute top-3 right-3 z-10 h-8 w-8 inline-flex items-center justify-center rounded-full transition-colors"
                      style={{ backgroundColor: `${ABIX.obsidian}CC`, color: ABIX.ivory }}
                    >
                      <X size={14} />
                    </button>

                    <Link to={`/shop/${product.slug}`} className="block relative aspect-square p-6" style={{ background: `linear-gradient(160deg, ${ABIX.espresso} 0%, ${ABIX.obsidian} 100%)` }}>
                      {product.shopImage && (
                        <img src={product.shopImage} alt={product.name} className="h-full w-full object-contain" />
                      )}
                    </Link>

                    <div className="p-5">
                      <h3 className="font-display text-lg leading-tight" style={{ color: ABIX.ivory }}>{product.name}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        {isAvailable ? (
                          <span className="font-price text-lg" style={{ color: ABIX.ivory }}>{product.currency}{product.price}</span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>Coming Soon</span>
                        )}
                      </div>

                      {isAvailable && (
                        <button
                          onClick={() => addToCart(product.id, 1)}
                          className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-full text-[10px] font-semibold tracking-luxe-sm uppercase transition-colors"
                          style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
                        >
                          <ShoppingBag size={13} /> Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}