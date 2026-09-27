import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';
import { useAuth } from '@/lib/AuthContext';
import { createOrder } from '@/lib/orderUtils';

// CHANGED — Phase 2: driven by the real cart (cartItems/cartTotal)
// instead of the hardcoded featuredProduct. The old "Quantity" step is
// removed — quantities are per-product now, already editable in
// CartDrawer — replaced with an "Items" step listing everything in the
// cart. Email/City/State/Pincode/Country fields were added since the
// order structure requires them; all are prefilled from the signed-in
// user's existing profile fields where available.
const steps = ['Items', 'Details', 'Address', 'Payment', 'Confirm'];

export default function CheckoutModal() {
  const { checkoutOpen, closeCheckout, cartItems, cartTotal, clearCart } = useShop();
  const { user, profile } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '', country: 'India',
    payment: 'COD',
  });
  const [placed, setPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    if (checkoutOpen) {
      setStep(0);
      setPlaced(false);
      setPlacedOrderId(null);
      setOrderError('');
      setForm({
        fullName: profile?.fullName || '',
        email: user?.email || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        city: profile?.city || '',
        state: profile?.state || '',
        pincode: profile?.pincode || '',
        country: profile?.country || 'India',
        payment: 'COD',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutOpen]);

  if (!checkoutOpen) return null;

  const shipping = 0;
  const total = cartTotal + shipping;

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

  const canNext = () => {
    if (step === 0) return cartItems.length > 0;
    if (step === 1) return form.fullName.trim() && form.phone.trim().length >= 10 && emailValid;
    if (step === 2) {
      return (
        form.address.trim().length > 5 &&
        form.city.trim() &&
        form.state.trim() &&
        /^\d{6}$/.test(form.pincode.trim()) &&
        form.country.trim()
      );
    }
    return true;
  };

  // Guarded against double-click: `submitting` blocks a second call
  // from firing while the first is still awaiting Firestore.
  const placeOrder = async () => {
    if (submitting) return;
    if (!user) {
      setOrderError('Please log in to place your order.');
      return;
    }
    if (cartItems.length === 0) {
      setOrderError('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    setOrderError('');

        const items = cartItems.map(({ id, variantId, variantLabel, qty, unitPrice, subtotal, product }) => ({
      productId: id,
      variantId: variantId || null,
      variantLabel: variantLabel || null,
      name: product.name,
      qty,
      unitPrice,
      subtotal,
    }));

    try {
      const orderId = await createOrder({
        uid: user.uid,
        customer: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        shippingAddress: {
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          country: form.country.trim(),
        },
        items,
        subtotal: cartTotal,
        shipping,
        total,
        paymentMethod: form.payment,
      });

      // Cart is cleared only AFTER Firestore confirms the order — a
      // failed write below leaves it completely untouched.
      clearCart();
      setPlacedOrderId(orderId);
      setPlaced(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Failed to create order', err?.code, err?.message, err);
      setOrderError('Something went wrong placing your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-greendark/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
        onClick={closeCheckout}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-ivory max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-ivory z-10 flex items-center justify-between px-6 py-5 border-b border-greendark/10">
            <div className="flex items-center gap-3">
              {step > 0 && !placed && (
                <button onClick={back} className="text-greendark/60 hover:text-greendark transition-colors">
                  <ArrowLeft size={20} />
                </button>
              )}
              <span className="font-display text-xl text-greendark">
                {placed ? 'Order placed' : 'Express checkout'}
              </span>
            </div>
            <button onClick={closeCheckout} className="text-greendark/60 hover:text-greendark transition-colors">
              <X size={20} />
            </button>
          </div>

          {!placed && (
            <div className="px-6 pt-5">
              <div className="flex items-center gap-1.5">
                {steps.map((s, i) => (
                  <div key={s} className="flex-1">
                    <div className={`h-0.5 transition-colors duration-300 ${i <= step ? 'bg-greendark' : 'bg-greendark/15'}`} />
                  </div>
                ))}
              </div>
              <p className="mt-2 label-meta text-foreground/45">
                Step {step + 1} of {steps.length} — {steps[step]}
              </p>
            </div>
          )}

          <div className="px-6 py-7">
            {!user && !placed ? (
              <div className="text-center py-6">
                <h3 className="font-display text-2xl text-greendark">Please sign in to check out</h3>
                <p className="mt-2 text-foreground/55 text-sm max-w-xs mx-auto">
                  Your order needs an account so we can save it and keep you updated.
                </p>
                <Link
                  to="/login"
                  onClick={closeCheckout}
                  className="mt-6 inline-flex h-12 px-7 items-center bg-greendark text-ivory text-[11px] font-semibold tracking-luxe-sm uppercase hover:bg-gold hover:text-greendark transition-colors"
                >
                  Log in
                </Link>
              </div>
            ) : cartItems.length === 0 && !placed ? (
              <div className="text-center py-6">
                <h3 className="font-display text-2xl text-greendark">Your cart is empty</h3>
                <p className="mt-2 text-foreground/55 text-sm">Add something to your ritual before checking out.</p>
                <Link
                  to="/shop"
                  onClick={closeCheckout}
                  className="mt-6 inline-flex h-12 px-7 items-center bg-greendark text-ivory text-[11px] font-semibold tracking-luxe-sm uppercase hover:bg-gold hover:text-greendark transition-colors"
                >
                  Explore the shop
                </Link>
              </div>
            ) : placed ? (
              <Confirmation orderId={placedOrderId} form={form} total={total} cartItems={cartItems} onClose={closeCheckout} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3 }}
                >
                                    {step === 0 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Your items</h3>
                      <div className="mt-5 space-y-3">
                        {cartItems.map(({ id, variantId, variantLabel, qty, product, subtotal }) => (
                          <div key={`${id}:${variantId || ''}`} className="flex items-center gap-4 p-4 bg-sand">
                            <div className="h-14 w-14 shrink-0 bg-greendark/10 overflow-hidden flex items-center justify-center">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="font-display text-xl text-greendark/40">{product.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-display text-lg text-greendark leading-tight">{product.name}</p>
                              <p className="text-sm text-foreground/55">{variantLabel ? `${variantLabel} · ` : ''}Qty {qty}</p>
                            </div>
                            <span className="font-price text-lg text-greendark">{product.currency}{subtotal}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-greendark/15 pt-4">
                        <span className="text-sm text-foreground/55">Total</span>
                        <span className="font-price text-2xl text-greendark">₹{total}</span>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Your details</h3>
                      <div className="mt-6 space-y-4">
                        <Field label="Full name">
                          <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your name" className="express-input" />
                        </Field>
                        <Field label="Email">
                          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="express-input" />
                        </Field>
                        <Field label="Phone number">
                          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} inputMode="numeric" placeholder="10-digit mobile" className="express-input" />
                        </Field>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Delivery address</h3>
                      <div className="mt-6 space-y-4">
                        <Field label="Address">
                          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House no, street, area" rows={3} className="express-input resize-none" />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="City">
                            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" className="express-input" />
                          </Field>
                          <Field label="State">
                            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" className="express-input" />
                          </Field>
                          <Field label="Pincode">
                            <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })} inputMode="numeric" placeholder="6-digit pincode" className="express-input" />
                          </Field>
                          <Field label="Country">
                            <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" className="express-input" />
                          </Field>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Payment method</h3>
                      <p className="mt-2 text-foreground/55 text-sm">Payment gateway integration is coming soon. This is a prototype.</p>
                      <div className="mt-6 space-y-3">
                        {['COD', 'UPI', 'Card'].map((m) => (
                          <button
                            key={m}
                            onClick={() => setForm({ ...form, payment: m })}
                            className={`w-full flex items-center justify-between p-4 border transition-colors ${form.payment === m ? 'border-greendark bg-sand' : 'border-greendark/20 hover:border-greendark/40'}`}
                          >
                            <span className="font-display text-lg text-greendark">{m === 'COD' ? 'Cash on Delivery' : m}</span>
                            <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${form.payment === m ? 'border-greendark' : 'border-greendark/30'}`}>
                              {form.payment === m && <span className="h-2.5 w-2.5 rounded-full bg-greendark" />}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Confirm your order</h3>
                      <div className="mt-5 space-y-3 text-sm">
                        {cartItems.map(({ id, qty, product }) => (
                          <Row key={id} label={product.name} value={`Qty ${qty} · ₹${product.price * qty}`} />
                        ))}
                        <Row label="Name" value={form.fullName} />
                        <Row label="Email" value={form.email} />
                        <Row label="Phone" value={form.phone} />
                        <Row label="Address" value={`${form.address}, ${form.city}, ${form.state} ${form.pincode}, ${form.country}`} />
                        <Row label="Payment" value={form.payment === 'COD' ? 'Cash on Delivery' : form.payment} />
                        <div className="border-t border-greendark/15 pt-3 flex items-center justify-between">
                          <span className="font-display text-lg text-greendark">Total</span>
                          <span className="font-price text-2xl text-greendark">₹{total}</span>
                        </div>
                      </div>
                      {orderError && <p className="mt-4 text-sm text-destructive">{orderError}</p>}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {!placed && user && cartItems.length > 0 && (
              <div className="mt-8">
                {step < steps.length - 1 ? (
                  <button
                    onClick={next}
                    disabled={!canNext()}
                    className="group w-full h-14 inline-flex items-center justify-center bg-greendark text-ivory text-[12px] font-semibold tracking-luxe-sm uppercase disabled:opacity-40 hover:bg-gold hover:text-greendark transition-colors duration-300"
                  >
                    Continue
                    <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={submitting}
                    className="group w-full h-14 inline-flex items-center justify-center gap-2 bg-greendark text-ivory text-[12px] font-semibold tracking-luxe-sm uppercase disabled:opacity-60 hover:bg-gold hover:text-greendark transition-colors duration-300"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Placing order…
                      </>
                    ) : (
                      `Place order · ₹${total}`
                    )}
                  </button>
                )}
                <p className="mt-4 text-center text-xs text-foreground/40">
                  Prototype checkout — no real payment is processed.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label-meta text-foreground/45">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-foreground/50 shrink-0">{label}</span>
      <span className="text-greendark text-right">{value}</span>
    </div>
  );
}

function Confirmation({ orderId, form, total, cartItems, onClose }) {
  const itemCount = cartItems.reduce((n, c) => n + c.qty, 0);
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
      <div className="mx-auto h-20 w-20 rounded-full bg-greendark flex items-center justify-center mb-7">
        <Check size={36} className="text-gold" />
      </div>
      <h3 className="font-display text-3xl text-greendark">Thank you, {form.fullName.split(' ')[0] || 'friend'}.</h3>
      <p className="mt-3 text-foreground/60 max-w-xs mx-auto">
        Your order for {itemCount} item{itemCount > 1 ? 's' : ''} is confirmed. We'll text updates to {form.phone}.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-sand text-greendark text-sm">
        Order total <span className="font-price text-lg">₹{total}</span>
      </div>
      {orderId && <p className="mt-3 text-xs text-foreground/40">Order reference: {orderId}</p>}
      <p className="mt-5 text-xs text-foreground/40">A confirmation has been queued for the next phase.</p>
      <button onClick={onClose} className="mt-8 h-12 px-8 border border-greendark text-greendark text-[11px] font-semibold tracking-luxe-sm uppercase hover:bg-greendark hover:text-ivory transition-colors">
        Back to ABIXMART
      </button>
    </motion.div>
  );
}