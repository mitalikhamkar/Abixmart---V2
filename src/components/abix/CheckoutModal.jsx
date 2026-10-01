import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowLeft, Loader2, Pencil } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';
import { useAuth } from '@/lib/AuthContext';
import { createOrder } from '@/lib/orderUtils';
import { ABIX } from '@/components/abix/brandColors';

// CHANGED — theme rebuild: this modal previously used the old light
// Tailwind palette (bg-ivory / text-greendark / bg-sand), which is why
// labels and inputs were unreadable against the (also light) modal
// background. It now uses the same ABIX color tokens + inline-style
// pattern as Cart.jsx / Wishlist.jsx / ProductDetail.jsx, so it's
// visually part of the same dark botanical site instead of a
// leftover light template.
//
// CHANGED — "Details" and "Address" are merged into one "Delivery"
// step that recognizes saved Profile information (name/phone/address)
// and shows it for review instead of asking the user to retype it.
//
// CHANGED (this task) — customers with a saved address now get an
// explicit choice: "Use your saved address" or "Use a different
// address". After an order is placed, the delivery address is saved to
// the existing profile document (via updateUserProfile) so it shows in
// Profile → Addresses and is offered on the next checkout.
//
// CHANGED — Order confirmation renders a snapshot of the order that was
// just placed (taken BEFORE clearCart() runs).
//
// No Firebase/order-creation/payment logic changed: createOrder(),
// its argument shape, and cartItems/cartTotal all come from the same
// places they did before.
const steps = ['Items', 'Delivery', 'Payment', 'Confirm'];

const INK = ABIX.obsidian;
const CARD = ABIX.espresso;
const IVORY = ABIX.ivory;
const MUTED = ABIX.ivory45;
const BORDER = ABIX.ivory12;
const BORDER_STRONG = ABIX.ivory25;
const GOLD = ABIX.gold;
const GOLD_LIGHT = ABIX.goldLight || ABIX.gold;

const inputStyle = {
  width: '100%',
  height: '48px',
  padding: '0 14px',
  borderRadius: '8px',
  border: `1px solid ${BORDER_STRONG}`,
  backgroundColor: `${INK}`,
  color: IVORY,
  fontSize: '14px',
  outline: 'none',
};

const textareaStyle = { ...inputStyle, height: 'auto', padding: '12px 14px', lineHeight: 1.5 };

function hasSavedDeliveryInfo(profile) {
  return Boolean(
    profile?.fullName && profile?.phone && profile?.address && profile?.city && profile?.state && profile?.pincode
  );
}

// The account has ONE saved address (the profile document fields).
// When a customer uses a different address, it replaces the saved one
// after the order if this is true. Set to false to only auto-save the
// FIRST address and never overwrite it from checkout.
const SAVE_NEW_ADDRESS_AS_DEFAULT = true;

export default function CheckoutModal() {
  const { checkoutOpen, closeCheckout, cartItems, cartTotal, clearCart } = useShop();
  const { user, profile, updateUserProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '', country: 'India',
    payment: 'COD',
  });
  // 'saved' shows the read-only saved-profile card; 'new' reveals the
  // editable address form (either because the user chose "Use a
  // different address", or because there's no usable saved info yet).
  const [addressMode, setAddressMode] = useState('saved');
  const [editingPhone, setEditingPhone] = useState(false);
  const [placed, setPlaced] = useState(false);
  // Snapshot of the whole order that was just created, so the
  // confirmation can show the real items/total even after the cart
  // has been cleared.
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');

  const savedInfoAvailable = hasSavedDeliveryInfo(profile);

  useEffect(() => {
    if (checkoutOpen) {
      setStep(0);
      setPlaced(false);
      setPlacedOrder(null);
      setOrderError('');
      setEditingPhone(false);
      setAddressMode(hasSavedDeliveryInfo(profile) ? 'saved' : 'new');
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
    if (step === 1) {
      return (
        form.fullName.trim() &&
        form.phone.trim().length === 10 &&
        emailValid &&
        form.address.trim().length > 5 &&
        form.city.trim() &&
        form.state.trim() &&
        /^\d{6}$/.test(form.pincode.trim()) &&
        form.country.trim()
      );
    }
    return true;
  };

  const useAnotherAddress = () => {
    setAddressMode('new');
    setForm((f) => ({ ...f, fullName: '', phone: '', address: '', city: '', state: '', pincode: '', country: 'India' }));
  };

  const useSavedAddress = () => {
    setAddressMode('saved');
    setEditingPhone(false);
    setForm((f) => ({
      ...f,
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      pincode: profile?.pincode || '',
      country: profile?.country || 'India',
    }));
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

      // Save the delivery address to the account. Best-effort: a failure
      // here must never block or undo an order that was already placed.
      const shouldSaveAddress =
        !savedInfoAvailable || (addressMode === 'new' && SAVE_NEW_ADDRESS_AS_DEFAULT);
      if (shouldSaveAddress && typeof updateUserProfile === 'function') {
        try {
          const addressUpdate = {
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            pincode: form.pincode.trim(),
            country: form.country.trim(),
          };
          // Recipient name/phone only fill gaps; they never overwrite the
          // account holder's own name/phone.
          if (!profile?.fullName) addressUpdate.fullName = form.fullName.trim();
          if (!profile?.phone) addressUpdate.phone = form.phone.trim();
          await updateUserProfile(addressUpdate);
        } catch (saveErr) {
          // eslint-disable-next-line no-console
          console.error('[ABIXMART] Could not save address to profile', saveErr?.code, saveErr?.message, saveErr);
        }
      }

      // Snapshot the order BEFORE the cart is cleared, so the
      // confirmation screen shows what was actually ordered. Cart is
      // still cleared only AFTER Firestore confirms the order — a
      // failed write above leaves it completely untouched.
      setPlacedOrder({
        orderId,
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        total,
        items,
        itemCount: items.reduce((n, it) => n + it.qty, 0),
      });
      clearCart();
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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
        style={{ backgroundColor: `${INK}CC`, backdropFilter: 'blur(6px)' }}
        onClick={closeCheckout}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
          style={{ backgroundColor: INK, border: `1px solid ${BORDER}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b"
            style={{ backgroundColor: INK, borderColor: BORDER }}
          >
            <div className="flex items-center gap-3">
              {step > 0 && !placed && (
                <button onClick={back} style={{ color: MUTED }} className="hover:opacity-80 transition-opacity">
                  <ArrowLeft size={20} />
                </button>
              )}
              <span className="font-display text-xl" style={{ color: IVORY }}>
                {placed ? 'Order placed' : 'Checkout'}
              </span>
            </div>
            <button onClick={closeCheckout} style={{ color: MUTED }} className="hover:opacity-80 transition-opacity">
              <X size={20} />
            </button>
          </div>

          {!placed && (
            <div className="px-6 pt-5">
              <div className="flex items-center gap-1.5">
                {steps.map((s, i) => (
                  <div key={s} className="flex-1">
                    <div
                      className="h-0.5 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: i <= step ? GOLD_LIGHT : BORDER_STRONG }}
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-luxe-sm" style={{ color: MUTED }}>
                Step {step + 1} of {steps.length} — {steps[step]}
              </p>
            </div>
          )}

          <div className="px-6 py-7">
            {!user && !placed ? (
              <div className="text-center py-6">
                <h3 className="font-display text-2xl" style={{ color: IVORY }}>Please sign in to check out</h3>
                <p className="mt-2 text-sm max-w-xs mx-auto" style={{ color: MUTED }}>
                  Your order needs an account so we can save it and keep you updated.
                </p>
                <Link
                  to="/login"
                  onClick={closeCheckout}
                  className="mt-6 inline-flex h-12 px-7 items-center rounded-full text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors"
                  style={{ backgroundColor: GOLD, color: INK }}
                >
                  Log in
                </Link>
              </div>
            ) : cartItems.length === 0 && !placed ? (
              <div className="text-center py-6">
                <h3 className="font-display text-2xl" style={{ color: IVORY }}>Your cart is empty</h3>
                <p className="mt-2 text-sm" style={{ color: MUTED }}>Add something to your ritual before checking out.</p>
                <Link
                  to="/shop"
                  onClick={closeCheckout}
                  className="mt-6 inline-flex h-12 px-7 items-center rounded-full text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors"
                  style={{ backgroundColor: GOLD, color: INK }}
                >
                  Explore the shop
                </Link>
              </div>
            ) : placed ? (
              <Confirmation order={placedOrder} onClose={closeCheckout} />
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
                      <h3 className="font-display text-2xl" style={{ color: IVORY }}>Order Summary</h3>
                      <div className="mt-5 space-y-3">
                        {/* FIXED: was reading product.image (a Base44
                            placeholder URL) — now uses product.shopImage,
                            the same real ABIXMART asset Cart.jsx uses. */}
                        {cartItems.map(({ id, variantId, variantLabel, qty, product, unitPrice, subtotal }) => (
                          <div
                            key={`${id}:${variantId || ''}`}
                            className="flex items-center gap-4 p-4 rounded-lg"
                            style={{ backgroundColor: `${CARD}66`, border: `1px solid ${BORDER}` }}
                          >
                            <div
                              className="h-14 w-14 shrink-0 rounded-md overflow-hidden flex items-center justify-center"
                              style={{ backgroundColor: CARD }}
                            >
                              {product.shopImage ? (
                                <img src={product.shopImage} alt={product.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="font-display text-xl" style={{ color: MUTED }}>{product.name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-display text-lg leading-tight truncate" style={{ color: IVORY }}>{product.name}</p>
                              <p className="text-sm" style={{ color: MUTED }}>
                                {variantLabel ? `${variantLabel} · ` : ''}₹{unitPrice} × {qty}
                              </p>
                            </div>
                            <span className="text-lg shrink-0" style={{ color: IVORY }}>{product.currency}{subtotal}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t pt-4" style={{ borderColor: BORDER }}>
                        <span className="text-sm" style={{ color: MUTED }}>Subtotal</span>
                        <span className="text-2xl" style={{ color: IVORY }}>₹{cartTotal}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm" style={{ color: MUTED }}>Shipping</span>
                        <span className="text-sm" style={{ color: IVORY }}>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: BORDER }}>
                        <span className="font-display text-lg" style={{ color: IVORY }}>Total</span>
                        <span className="text-2xl" style={{ color: IVORY }}>₹{total}</span>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <h3 className="font-display text-2xl" style={{ color: IVORY }}>Delivery Information</h3>

                      <div className="mt-5">
                        <label className="text-[11px] uppercase tracking-luxe-sm block mb-1.5" style={{ color: MUTED }}>Email</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="you@example.com"
                          style={inputStyle}
                        />
                      </div>

                      {/* Explicit choice shown whenever the customer already has a saved address. */}
                      {savedInfoAvailable && (
                        <div className="mt-5 space-y-3">
                          <AddressChoice
                            selected={addressMode === 'saved'}
                            title="Use your saved address"
                            actionLabel="Use saved address"
                            onSelect={addressMode === 'saved' ? undefined : useSavedAddress}
                          />
                          <AddressChoice
                            selected={addressMode === 'new'}
                            title="Use a different address"
                            actionLabel="Enter a new address"
                            onSelect={addressMode === 'new' ? undefined : useAnotherAddress}
                          />
                        </div>
                      )}

                      {addressMode === 'saved' && savedInfoAvailable ? (
                        <div className="mt-5 rounded-lg p-5" style={{ backgroundColor: `${CARD}66`, border: `1px solid ${BORDER}` }}>
                          <p className="text-[11px] uppercase tracking-luxe-sm" style={{ color: MUTED }}>Delivery details</p>
                          <p className="mt-2 text-base" style={{ color: IVORY }}>{form.fullName}</p>

                          <div className="mt-1.5 flex items-center gap-3">
                            {editingPhone ? (
                              <input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                                inputMode="numeric"
                                placeholder="10-digit mobile"
                                style={{ ...inputStyle, height: '40px', maxWidth: '200px' }}
                                autoFocus
                              />
                            ) : (
                              <span className="text-base" style={{ color: IVORY }}>+91 {form.phone}</span>
                            )}
                            <button
                              onClick={() => setEditingPhone((v) => !v)}
                              className="inline-flex items-center gap-1 text-xs underline underline-offset-4"
                              style={{ color: GOLD_LIGHT }}
                            >
                              <Pencil size={11} /> {editingPhone ? 'Done' : 'Change number'}
                            </button>
                          </div>

                          <p className="mt-4 text-[11px] uppercase tracking-luxe-sm" style={{ color: MUTED }}>Saved address</p>
                          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: IVORY }}>{form.address}</p>
                          <p className="text-sm" style={{ color: IVORY }}>{form.city}, {form.state} {form.pincode}</p>
                          <p className="text-sm" style={{ color: IVORY }}>{form.country}</p>
                        </div>
                      ) : (
                        <div className="mt-5 space-y-4">
                          <Field label="Full name">
                            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Your name" style={inputStyle} />
                          </Field>
                          <Field label="Phone number">
                            <input
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })}
                              inputMode="numeric"
                              placeholder="10-digit mobile"
                              style={inputStyle}
                            />
                          </Field>
                          <Field label="Address">
                            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House no, street, area" rows={3} style={textareaStyle} />
                          </Field>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="City">
                              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" style={inputStyle} />
                            </Field>
                            <Field label="State">
                              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" style={inputStyle} />
                            </Field>
                            <Field label="Pincode">
                              <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })} inputMode="numeric" placeholder="6-digit pincode" style={inputStyle} />
                            </Field>
                            <Field label="Country">
                              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" style={inputStyle} />
                            </Field>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h3 className="font-display text-2xl" style={{ color: IVORY }}>Payment method</h3>
                      <p className="mt-2 text-sm" style={{ color: MUTED }}>Payment gateway integration is coming soon. This is a prototype.</p>
                      <div className="mt-6 space-y-3">
                        {['COD', 'UPI', 'Card'].map((m) => (
                          <button
                            key={m}
                            onClick={() => setForm({ ...form, payment: m })}
                            className="w-full flex items-center justify-between p-4 rounded-lg transition-colors"
                            style={{
                              border: `1px solid ${form.payment === m ? GOLD_LIGHT : BORDER_STRONG}`,
                              backgroundColor: form.payment === m ? `${GOLD_LIGHT}14` : 'transparent',
                            }}
                          >
                            <span className="font-display text-lg" style={{ color: IVORY }}>{m === 'COD' ? 'Cash on Delivery' : m}</span>
                            <span
                              className="h-5 w-5 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: form.payment === m ? GOLD_LIGHT : BORDER_STRONG }}
                            >
                              {form.payment === m && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GOLD_LIGHT }} />}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h3 className="font-display text-2xl" style={{ color: IVORY }}>Confirm your order</h3>
                      <div className="mt-5 space-y-3 text-sm">
                        {/* FIXED: previously recomputed product.price × qty
                            here, which silently overrode the correct
                            ritual/package price. Now uses the same
                            variant-aware unitPrice/subtotal as every
                            other cart display. */}
                        {cartItems.map(({ id, variantId, variantLabel, qty, unitPrice, subtotal, product }) => (
                          <Row
                            key={`${id}:${variantId || ''}`}
                            label={`${product.name}${variantLabel ? ` — ${variantLabel}` : ''}`}
                            value={`Qty ${qty} · ₹${subtotal}`}
                          />
                        ))}
                        <Row label="Name" value={form.fullName} />
                        <Row label="Email" value={form.email} />
                        <Row label="Phone" value={form.phone} />
                        <Row label="Address" value={`${form.address}, ${form.city}, ${form.state} ${form.pincode}, ${form.country}`} />
                        <Row label="Payment" value={form.payment === 'COD' ? 'Cash on Delivery' : form.payment} />
                        <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: BORDER }}>
                          <span className="font-display text-lg" style={{ color: IVORY }}>Total</span>
                          <span className="text-2xl" style={{ color: IVORY }}>₹{total}</span>
                        </div>
                      </div>
                      {orderError && <p className="mt-4 text-sm" style={{ color: '#F3A6A6' }}>{orderError}</p>}
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
                    className="group w-full h-14 inline-flex items-center justify-center rounded-full text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors disabled:opacity-40"
                    style={{ backgroundColor: GOLD, color: INK }}
                  >
                    Continue
                    <span className="ml-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </button>
                ) : (
                  <button
                    onClick={placeOrder}
                    disabled={submitting}
                    className="group w-full h-14 inline-flex items-center justify-center gap-2 rounded-full text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors disabled:opacity-60"
                    style={{ backgroundColor: GOLD, color: INK }}
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
                <p className="mt-4 text-center text-xs" style={{ color: MUTED }}>
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
      <span className="text-[11px] uppercase tracking-luxe-sm" style={{ color: MUTED }}>{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="shrink-0" style={{ color: MUTED }}>{label}</span>
      <span className="text-right" style={{ color: IVORY }}>{value}</span>
    </div>
  );
}

// Radio-style option used for the saved / different address choice.
// Same look as the payment-method options in step 2.
function AddressChoice({ selected, title, actionLabel, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center justify-between p-4 rounded-lg text-left transition-colors"
      style={{
        border: `1px solid ${selected ? GOLD_LIGHT : BORDER_STRONG}`,
        backgroundColor: selected ? `${GOLD_LIGHT}14` : 'transparent',
      }}
    >
      <span>
        <span className="block font-display text-lg" style={{ color: IVORY }}>{title}</span>
        <span className="block mt-0.5 text-[11px] uppercase tracking-luxe-sm" style={{ color: MUTED }}>
          {selected ? 'Selected' : actionLabel}
        </span>
      </span>
      <span
        className="h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: selected ? GOLD_LIGHT : BORDER_STRONG }}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GOLD_LIGHT }} />}
      </span>
    </button>
  );
}

// Renders the snapshot of the order that was just placed
// (items, total, reference, contact) instead of the live — now empty —
// cart. No texting/"next phase" claims: nothing in the project sends
// SMS or WhatsApp confirmations.
function Confirmation({ order, onClose }) {
  if (!order) return null;
  const { orderId, fullName, phone, total, items, itemCount } = order;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
      <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-7" style={{ backgroundColor: CARD }}>
        <Check size={36} style={{ color: GOLD_LIGHT }} />
      </div>
      <h3 className="font-display text-3xl" style={{ color: IVORY }}>
        Thank you, {(fullName || '').split(' ')[0] || 'friend'}.
      </h3>
      <p className="mt-3 max-w-xs mx-auto" style={{ color: MUTED }}>
        Your order for {itemCount} item{itemCount === 1 ? '' : 's'} has been placed.
      </p>

      <div className="mt-5 mx-auto max-w-xs space-y-1.5 text-sm">
        {items.map((it, i) => (
          <div key={i} className="flex justify-between gap-4">
            <span className="text-left" style={{ color: IVORY }}>
              {it.name}{it.variantLabel ? ` — ${it.variantLabel}` : ''} × {it.qty}
            </span>
            <span className="shrink-0" style={{ color: MUTED }}>₹{it.subtotal}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm" style={{ backgroundColor: CARD, color: IVORY }}>
        Order total <span className="text-lg">₹{total}</span>
      </div>

      {orderId && (
        <p className="mt-4 text-xs lining-nums tabular-nums" style={{ color: MUTED }}>
          Order reference: <span className="select-all" style={{ color: IVORY }}>{orderId}</span>
        </p>
      )}
      {phone && (
        <p className="mt-1.5 text-xs" style={{ color: MUTED }}>
          Contact number on this order: {phone}
        </p>
      )}
      <p className="mt-5 text-xs max-w-xs mx-auto" style={{ color: MUTED }}>
        You can follow this order any time from Profile → Orders.
      </p>

      <button
        onClick={onClose}
        className="mt-8 h-12 px-8 rounded-full text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors"
        style={{ border: `1px solid ${BORDER_STRONG}`, color: IVORY }}
      >
        Back to ABIXMART
      </button>
    </motion.div>
  );
}