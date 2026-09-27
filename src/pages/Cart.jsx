import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import { useShop } from '@/lib/ShopContext';
import { ABIX } from '@/components/abix/brandColors';

export default function Cart() {
  const { cartItems, cartTotal, updateQty, removeFromCart, openCheckout } = useShop();

  return (
    <PageTransition>
      <section className="relative pt-24 lg:pt-28 pb-20 lg:pb-28 overflow-hidden" style={{ backgroundColor: ABIX.obsidian }}>
        <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10">
          <Eyebrow light>Your Cart</Eyebrow>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl leading-tight tracking-tight" style={{ color: ABIX.ivory }}>
            Your ritual, so far.
          </h1>

          {cartItems.length === 0 ? (
            <div className="mt-16 text-center">
              <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: ABIX.espresso }}>
                <ShoppingBag size={24} style={{ color: ABIX.ivory45 }} />
              </div>
              <p className="font-display text-2xl" style={{ color: ABIX.ivory }}>Your cart is empty</p>
              <p className="mt-2 text-sm" style={{ color: ABIX.ivory45 }}>Begin your ritual with a jar of Himalayan Shilajit.</p>
              <Link
                to="/shop"
                className="mt-6 inline-flex h-12 px-7 items-center rounded-full text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors"
                style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
              >
                Explore the shop
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid lg:grid-cols-[1fr_320px] gap-10">
              <div className="space-y-4">
                {cartItems.map(({ id, variantId, variantLabel, qty, unitPrice, subtotal, product }) => (
                  <div
                    key={`${id}:${variantId || ''}`}
                    className="flex gap-4 p-4 border rounded-xl"
                    style={{ borderColor: ABIX.ivory12, backgroundColor: `${ABIX.espresso}40` }}
                  >
                    <Link to={`/shop/${product.slug}`} className="shrink-0">
                      <div className="h-24 w-20 rounded-lg overflow-hidden" style={{ backgroundColor: ABIX.espresso }}>
                        {product.shopImage && <img src={product.shopImage} alt={product.name} className="h-full w-full object-cover" />}
                      </div>
                    </Link>
                    <div className="flex-1 flex flex-col">
                      <Link to={`/shop/${product.slug}`}>
                        <h4 className="font-display text-lg leading-tight" style={{ color: ABIX.ivory }}>{product.name}</h4>
                        <p className="text-xs" style={{ color: ABIX.ivory45 }}>{variantLabel || product.subtitle}</p>
                        <p className="text-xs mt-0.5" style={{ color: ABIX.ivory45 }}>{product.currency}{unitPrice} each</p>
                      </Link>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="inline-flex items-center border rounded-full overflow-hidden" style={{ borderColor: ABIX.ivory25 }}>
                          <button onClick={() => updateQty(id, qty - 1, variantId)} className="h-9 w-9 inline-flex items-center justify-center transition-colors" style={{ color: ABIX.ivory }}>
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-price text-base" style={{ color: ABIX.ivory }}>{qty}</span>
                          <button onClick={() => updateQty(id, qty + 1, variantId)} className="h-9 w-9 inline-flex items-center justify-center transition-colors" style={{ color: ABIX.ivory }}>
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="font-price text-lg" style={{ color: ABIX.ivory }}>{product.currency}{subtotal}</span>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(id, variantId)} aria-label="Remove item" className="self-start transition-colors" style={{ color: ABIX.ivory45 }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="h-fit p-6 border rounded-xl" style={{ borderColor: ABIX.ivory12, backgroundColor: `${ABIX.espresso}40` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: ABIX.ivory70 }}>Subtotal</span>
                  <span className="font-price text-2xl" style={{ color: ABIX.ivory }}>₹{cartTotal}</span>
                </div>
                <button
                  onClick={() => openCheckout()}
                  className="mt-6 w-full h-14 inline-flex items-center justify-center rounded-full text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors"
                  style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
                >
                  Checkout
                </button>
                <Link to="/shop" className="mt-3 block text-center text-xs underline underline-offset-4" style={{ color: ABIX.ivory45 }}>
                  Continue shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageTransition>
  );
}