import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';
import { featuredProduct } from '@/data/products';

const steps = ['Product', 'Quantity', 'Details', 'Address', 'Payment', 'Confirm'];

export default function CheckoutModal() {
  const { checkoutOpen, checkoutPrefill, closeCheckout } = useShop();
  const [step, setStep] = useState(0);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: '', phone: '', address: '', payment: 'UPI' });
  const [placed, setPlaced] = useState(false);

  // reset / hydrate when opened
  useEffect(() => {
    if (checkoutOpen) {
      setStep(0);
      setPlaced(false);
      setQty(checkoutPrefill?.jars || 1);
      setForm({ name: '', phone: '', address: '', payment: 'UPI' });
    }
  }, [checkoutOpen, checkoutPrefill]);

  if (!checkoutOpen) return null;

  const unit = featuredProduct.price;
  const total = unit * qty;
  const productLabel = checkoutPrefill?.name || `${featuredProduct.name} — ${featuredProduct.subtitle}`;

  const next = () => setStep((s) => Math.min(steps.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const canNext = () => {
    if (step === 2) return form.name.trim() && form.phone.trim().length >= 10;
    if (step === 3) return form.address.trim().length > 5;
    return true;
  };

  const placeOrder = () => {
    setPlaced(true);
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
          {/* header */}
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

          {/* progress */}
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
            {placed ? (
              <Confirmation form={form} total={total} qty={qty} productLabel={productLabel} onClose={closeCheckout} />
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
                      <h3 className="font-display text-2xl text-greendark">Your product</h3>
                      <div className="mt-5 flex items-center gap-4 p-4 bg-sand">
                        <div className="h-16 w-16 bg-greendark/10 flex items-center justify-center font-display text-2xl text-greendark/40">A</div>
                        <div className="flex-1">
                          <p className="font-display text-lg text-greendark leading-tight">{productLabel}</p>
                          <p className="text-sm text-foreground/55">{featuredProduct.size} · Pure Resin</p>
                        </div>
                        <span className="font-price text-xl text-greendark">₹{unit}</span>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">How many?</h3>
                      <p className="mt-2 text-foreground/55 text-sm">Choose the quantity for your ritual.</p>
                      <div className="mt-7 flex items-center justify-center gap-6">
                        <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-12 inline-flex items-center justify-center border border-greendark/25 text-greendark hover:bg-sand transition-colors">
                          <Minus size={18} />
                        </button>
                        <span className="font-price text-5xl text-greendark w-16 text-center">{qty}</span>
                        <button onClick={() => setQty((q) => q + 1)} className="h-12 w-12 inline-flex items-center justify-center border border-greendark/25 text-greendark hover:bg-sand transition-colors">
                          <Plus size={18} />
                        </button>
                      </div>
                      <p className="mt-6 text-center font-price text-2xl text-greendark">Total ₹{unit * qty}</p>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Your details</h3>
                      <p className="mt-2 text-foreground/55 text-sm">No account needed. Just your name and phone.</p>
                      <div className="mt-6 space-y-4">
                        <Field label="Full name">
                          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" className="express-input" />
                        </Field>
                        <Field label="Phone number">
                          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} inputMode="numeric" placeholder="10-digit mobile" className="express-input" />
                        </Field>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Delivery address</h3>
                      <Field label="Full address">
                        <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House no, street, area, city, pincode" rows={4} className="express-input resize-none" />
                      </Field>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Payment method</h3>
                      <p className="mt-2 text-foreground/55 text-sm">Payment gateway integration is coming soon. This is a prototype.</p>
                      <div className="mt-6 space-y-3">
                        {['UPI', 'Card', 'Cash on Delivery'].map((m) => (
                          <button
                            key={m}
                            onClick={() => setForm({ ...form, payment: m })}
                            className={`w-full flex items-center justify-between p-4 border transition-colors ${form.payment === m ? 'border-greendark bg-sand' : 'border-greendark/20 hover:border-greendark/40'}`}
                          >
                            <span className="font-display text-lg text-greendark">{m}</span>
                            <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${form.payment === m ? 'border-greendark' : 'border-greendark/30'}`}>
                              {form.payment === m && <span className="h-2.5 w-2.5 rounded-full bg-greendark" />}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    <div>
                      <h3 className="font-display text-2xl text-greendark">Confirm your order</h3>
                      <div className="mt-5 space-y-3 text-sm">
                        <Row label="Product" value={productLabel} />
                        <Row label="Quantity" value={`${qty} jar${qty > 1 ? 's' : ''}`} />
                        <Row label="Name" value={form.name} />
                        <Row label="Phone" value={form.phone} />
                        <Row label="Address" value={form.address} />
                        <Row label="Payment" value={form.payment} />
                        <div className="border-t border-greendark/15 pt-3 flex items-center justify-between">
                          <span className="font-display text-lg text-greendark">Total</span>
                          <span className="font-price text-2xl text-greendark">₹{total}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}

            {/* footer actions */}
            {!placed && (
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
                    className="group w-full h-14 inline-flex items-center justify-center bg-greendark text-ivory text-[12px] font-semibold tracking-luxe-sm uppercase hover:bg-gold hover:text-greendark transition-colors duration-300"
                  >
                    Place order · ₹{total}
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

function Confirmation({ form, total, qty, productLabel, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6"
    >
      <div className="mx-auto h-20 w-20 rounded-full bg-greendark flex items-center justify-center mb-7">
        <Check size={36} className="text-gold" />
      </div>
      <h3 className="font-display text-3xl text-greendark">Thank you, {form.name.split(' ')[0] || 'friend'}.</h3>
      <p className="mt-3 text-foreground/60 max-w-xs mx-auto">
        Your order for {qty} jar{qty > 1 ? 's' : ''} of ABIXMART Shilajit is confirmed. We'll text updates to {form.phone}.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-sand text-greendark text-sm">
        Order total <span className="font-price text-lg">₹{total}</span>
      </div>
      <p className="mt-5 text-xs text-foreground/40">A confirmation has been queued for the next phase.</p>
      <button onClick={onClose} className="mt-8 h-12 px-8 border border-greendark text-greendark text-[11px] font-semibold tracking-luxe-sm uppercase hover:bg-greendark hover:text-ivory transition-colors">
        Back to ABIXMART
      </button>
    </motion.div>
  );
}