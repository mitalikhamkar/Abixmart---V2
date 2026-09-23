import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';

export default function CartDrawer() {
  const { cartOpen, closeCart, cartItems, cartTotal, updateQty, removeFromCart, openCheckout } = useShop();

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-greendark/40 backdrop-blur-sm"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-ivory flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-greendark/10">
              <span className="font-display text-2xl text-greendark">Your ritual</span>
              <button onClick={closeCart} className="text-greendark/60 hover:text-greendark transition-colors">
                <X size={22} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-sand flex items-center justify-center mb-5">
                  <ShoppingBag size={24} className="text-greendark/40" />
                </div>
                <p className="font-display text-2xl text-greendark">Your cart is empty</p>
                <p className="mt-2 text-sm text-foreground/55">Begin your ritual with a jar of Himalayan Shilajit.</p>
                <Link
                  to="/shop"
                  onClick={closeCart}
                  className="mt-6 h-12 px-7 inline-flex items-center bg-greendark text-ivory text-[11px] font-semibold tracking-luxe-sm uppercase hover:bg-gold hover:text-greendark transition-colors"
                >
                  Explore the shop
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  {cartItems.map(({ id, qty, product }) => (
                    <div key={id} className="flex gap-4">
                      <Link to={`/shop/${product.slug}`} onClick={closeCart} className="shrink-0">
                        <div className="h-24 w-20 bg-sand overflow-hidden">
                          {product.image && <img src={product.image} alt={product.name} className="h-full w-full object-cover" />}
                        </div>
                      </Link>
                      <div className="flex-1 flex flex-col">
                        <Link to={`/shop/${product.slug}`} onClick={closeCart}>
                          <h4 className="font-display text-lg text-greendark leading-tight">{product.name}</h4>
                          <p className="text-xs text-foreground/50">{product.subtitle}</p>
                        </Link>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="inline-flex items-center border border-greendark/20">
                            <button onClick={() => updateQty(id, qty - 1)} className="h-9 w-9 inline-flex items-center justify-center text-greendark hover:bg-sand transition-colors">
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-price text-base text-greendark">{qty}</span>
                            <button onClick={() => updateQty(id, qty + 1)} className="h-9 w-9 inline-flex items-center justify-center text-greendark hover:bg-sand transition-colors">
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="font-price text-lg text-greendark">{product.currency}{product.price * qty}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(id)} className="text-xs text-foreground/40 hover:text-destructive transition-colors self-start">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="px-6 py-5 border-t border-greendark/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/55">Total</span>
                    <span className="font-price text-2xl text-greendark">₹{cartTotal}</span>
                  </div>
                  <button
                    onClick={() => openCheckout()}
                    className="group w-full h-14 inline-flex items-center justify-center bg-greendark text-ivory text-[12px] font-semibold tracking-luxe-sm uppercase hover:bg-gold hover:text-greendark transition-colors duration-300"
                  >
                    Express checkout
                    <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}