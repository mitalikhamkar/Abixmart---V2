// src/components/abix/upcoming/PreOrderDialog.jsx
//
// "Pre-order" interest form for an upcoming product. This is an expression
// of interest only: no order, no reservation, no payment. The wording says
// so at the top, in the consent line and on the success screen.
//
// Writes go through src/lib/preBookingService.js (collection `preBookings`).

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Minus, Plus } from 'lucide-react';
import ModalShell from '@/components/abix/upcoming/ModalShell';
import { ABIX } from '@/components/abix/brandColors';
import { useAuth } from '@/lib/AuthContext';
import {
  QUANTITY_MAX,
  QUANTITY_MIN,
  TIMING_OPTIONS,
  validatePreBooking,
} from '@/lib/preBookingConfig';
import {
  createGuestBookingRef,
  describePreBookingError,
  hasMyPreBooking,
  readLocalPreBookingDate,
  submitPreBooking,
} from '@/lib/preBookingService';

const ERROR_COLOR = '#E8A18C';

function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-xs leading-relaxed" style={{ color: ERROR_COLOR }}>
      {children}
    </p>
  );
}

function formatLocalDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PreOrderDialog({ product, onClose }) {
  const { user, profile } = useAuth();
  const uid = user?.uid || null;
  const headingId = `preorder-title-${product.id}`;

  // 'checking' | 'form' | 'already' | 'success'
  const [phase, setPhase] = useState(uid ? 'checking' : 'form');
  const [values, setValues] = useState(() => ({
    fullName: profile?.fullName || user?.displayName || '',
    phone: profile?.phone || '',
    quantity: 1,
    timing: '',
    consent: false,
  }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [trap, setTrap] = useState('');
  const [previousDate] = useState(() => (user ? null : readLocalPreBookingDate(product.id)));

  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const qtyRef = useRef(null);
  const timingFirstRef = useRef(null);
  const consentRef = useRef(null);
  const submittingRef = useRef(false);
  const guestRefRef = useRef(null);

  // Profile data can arrive after the dialog opens; fill empty fields only.
  useEffect(() => {
    if (!profile) return;
    setValues((v) => ({
      ...v,
      fullName: v.fullName || profile.fullName || '',
      phone: v.phone || profile.phone || '',
    }));
  }, [profile]);

  // One request per signed-in customer per product.
  useEffect(() => {
    if (!uid) {
      setPhase((p) => (p === 'checking' ? 'form' : p));
      return undefined;
    }
    let cancelled = false;
    setPhase('checking');
    hasMyPreBooking(uid, product.id)
      .then((exists) => {
        if (!cancelled) setPhase(exists ? 'already' : 'form');
      })
      .catch(() => {
        if (!cancelled) setPhase('form');
      });
    return () => {
      cancelled = true;
    };
  }, [uid, product.id]);

  useEffect(() => {
    if (phase === 'form' && nameRef.current) nameRef.current.focus({ preventScroll: true });
  }, [phase]);

  const setField = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  };

  const stepQuantity = (delta) => {
    const current = Number(values.quantity);
    const base = Number.isInteger(current) ? current : QUANTITY_MIN;
    setField('quantity', Math.min(QUANTITY_MAX, Math.max(QUANTITY_MIN, base + delta)));
  };

  const focusFirstError = (found) => {
    const order = [
      ['fullName', nameRef],
      ['phone', phoneRef],
      ['quantity', qtyRef],
      ['timing', timingFirstRef],
      ['consent', consentRef],
    ];
    const hit = order.find(([key]) => found[key]);
    if (hit && hit[1].current) hit[1].current.focus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    setSubmitError('');

    // A filled hidden field means a bot: pretend success, save nothing.
    if (trap.trim() !== '') {
      setPhase('success');
      return;
    }

    const { errors: found } = validatePreBooking(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError(found);
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Created once per open form, so a retry or double click always
      // targets the same document and can never create two requests.
      if (!user && !guestRefRef.current) guestRefRef.current = createGuestBookingRef();
      await submitPreBooking({ product, user, values, guestRef: guestRefRef.current });
      setPhase('success');
    } catch (err) {
      if (err?.code === 'abixmart/already-registered') {
        setPhase('already');
      } else {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Pre-order request failed:', err?.code, err?.message);
        setSubmitError(describePreBookingError(err));
      }
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const inputBorder = (key) => (errors[key] ? ERROR_COLOR : undefined);

  return (
    <ModalShell labelledBy={headingId} onClose={onClose} closeDisabled={submitting} maxWidth="max-w-xl">
      <div className="p-6 sm:p-8">
        <div className="flex items-center gap-4 pr-10">
          {product.shopImage && (
            <img
              src={product.shopImage}
              alt=""
              className="h-16 w-16 shrink-0 object-cover border"
              style={{ borderColor: ABIX.ivory12 }}
            />
          )}
          <div className="min-w-0">
            <p className="label-meta" style={{ color: ABIX.goldLight }}>Pre-order interest · Coming Soon</p>
            <h2 id={headingId} className="mt-1 font-display text-3xl leading-tight" style={{ color: ABIX.ivory }}>
              {product.name}
            </h2>
          </div>
        </div>

        {phase === 'checking' && (
          <p className="mt-8 text-sm" role="status" style={{ color: ABIX.ivory70 }}>
            Checking your details…
          </p>
        )}

        {phase === 'already' && (
          <div className="mt-8" role="status">
            <p className="font-display text-2xl leading-snug" style={{ color: ABIX.ivory }}>
              You have already registered your interest in {product.name}.
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
              Each customer can register once per product while it is coming soon. To change your details,
              please contact us through{' '}
              <Link to="/support#contact" className="underline underline-offset-4" style={{ color: ABIX.goldLight }}>
                Support
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center h-12 px-8 border text-[11px] font-semibold tracking-luxe-sm uppercase"
              style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
            >
              Close
            </button>
          </div>
        )}

        {phase === 'success' && (
          <div className="mt-8" role="status" aria-live="polite">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: ABIX.gold15, color: ABIX.gold }}
            >
              <Check size={18} />
            </span>
            <p className="mt-4 font-display text-3xl leading-snug" style={{ color: ABIX.ivory }}>
              Thank you. Your interest is recorded.
            </p>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
              We have noted your interest in {product.name}. This is not an order or a reservation, and
              no payment has been taken. {product.name} is not available to buy yet.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center justify-center h-12 px-8 text-[11px] font-semibold tracking-luxe-sm uppercase"
              style={{ background: ABIX.gold, color: ABIX.obsidian }}
            >
              Done
            </button>
          </div>
        )}

        {phase === 'form' && (
          <form onSubmit={handleSubmit} noValidate className="mt-6">
            <div
              className="border px-4 py-3 text-sm leading-relaxed"
              style={{ borderColor: ABIX.gold25, background: ABIX.gold15, color: ABIX.ivory70 }}
            >
              <strong style={{ color: ABIX.goldLight }}>Expression of interest only.</strong> This is not a
              confirmed order, a reservation or a payment. Nothing is charged and nothing is reserved for you.
            </div>

            {previousDate && formatLocalDate(previousDate) && (
              <p className="mt-4 text-xs leading-relaxed" role="status" style={{ color: ABIX.ivory45 }}>
                You registered interest in this product from this device on {formatLocalDate(previousDate)}.
                Submitting again adds another request.
              </p>
            )}

            <div className="mt-6 space-y-6">
              <div>
                <label htmlFor="po-name" className="label-meta" style={{ color: ABIX.ivory45 }}>Full name</label>
                <input
                  id="po-name"
                  ref={nameRef}
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  maxLength={80}
                  value={values.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  aria-invalid={errors.fullName ? 'true' : undefined}
                  aria-describedby={errors.fullName ? 'po-name-error' : undefined}
                  className="express-input-inverse"
                  style={{ borderColor: inputBorder('fullName') }}
                />
                <FieldError id="po-name-error">{errors.fullName}</FieldError>
              </div>

              <div>
                <label htmlFor="po-phone" className="label-meta" style={{ color: ABIX.ivory45 }}>Phone number</label>
                <input
                  id="po-phone"
                  ref={phoneRef}
                  type="tel"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={24}
                  value={values.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  aria-invalid={errors.phone ? 'true' : undefined}
                  aria-describedby={errors.phone ? 'po-phone-error' : 'po-phone-hint'}
                  className="express-input-inverse"
                  style={{ borderColor: inputBorder('phone') }}
                />
                {errors.phone ? (
                  <FieldError id="po-phone-error">{errors.phone}</FieldError>
                ) : (
                  <p id="po-phone-hint" className="mt-1.5 text-xs" style={{ color: ABIX.ivory45 }}>
                    Include your country code if it is not an Indian number.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="po-qty" className="label-meta" style={{ color: ABIX.ivory45 }}>Desired quantity</label>
                <div
                  className="mt-2 inline-flex items-center border h-12"
                  style={{ borderColor: errors.quantity ? ERROR_COLOR : ABIX.ivory25 }}
                >
                  <button
                    type="button"
                    onClick={() => stepQuantity(-1)}
                    aria-label="Decrease quantity"
                    className="h-full w-11 inline-flex items-center justify-center"
                    style={{ color: ABIX.ivory }}
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    id="po-qty"
                    ref={qtyRef}
                    type="number"
                    name="quantity"
                    inputMode="numeric"
                    min={QUANTITY_MIN}
                    max={QUANTITY_MAX}
                    value={values.quantity}
                    onChange={(e) => setField('quantity', e.target.value)}
                    aria-invalid={errors.quantity ? 'true' : undefined}
                    aria-describedby={errors.quantity ? 'po-qty-error' : 'po-qty-hint'}
                    className="w-14 bg-transparent text-center font-price text-lg focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    style={{ color: ABIX.ivory }}
                  />
                  <button
                    type="button"
                    onClick={() => stepQuantity(1)}
                    aria-label="Increase quantity"
                    className="h-full w-11 inline-flex items-center justify-center"
                    style={{ color: ABIX.ivory }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {errors.quantity ? (
                  <FieldError id="po-qty-error">{errors.quantity}</FieldError>
                ) : (
                  <p id="po-qty-hint" className="mt-1.5 text-xs" style={{ color: ABIX.ivory45 }}>
                    From {QUANTITY_MIN} to {QUANTITY_MAX}. This does not reserve any stock.
                  </p>
                )}
              </div>

              <fieldset
                aria-describedby={errors.timing ? 'po-timing-error' : undefined}
                aria-invalid={errors.timing ? 'true' : undefined}
              >
                <legend className="label-meta" style={{ color: ABIX.ivory45 }}>Expected purchase timing</legend>
                <div className="mt-3 space-y-2">
                  {TIMING_OPTIONS.map((option, i) => {
                    const selected = values.timing === option.value;
                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 border px-4 py-3 cursor-pointer transition-colors"
                        style={{
                          borderColor: selected ? ABIX.gold : errors.timing ? ERROR_COLOR : ABIX.ivory25,
                          background: selected ? ABIX.gold15 : 'transparent',
                          color: ABIX.ivory,
                        }}
                      >
                        <input
                          ref={i === 0 ? timingFirstRef : undefined}
                          type="radio"
                          name="timing"
                          value={option.value}
                          checked={selected}
                          onChange={() => setField('timing', option.value)}
                          className="h-4 w-4 shrink-0"
                          style={{ accentColor: ABIX.gold }}
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
                <FieldError id="po-timing-error">{errors.timing}</FieldError>
              </fieldset>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    ref={consentRef}
                    type="checkbox"
                    name="consent"
                    checked={values.consent}
                    onChange={(e) => setField('consent', e.target.checked)}
                    aria-invalid={errors.consent ? 'true' : undefined}
                    aria-describedby={errors.consent ? 'po-consent-error' : undefined}
                    className="mt-1 h-4 w-4 shrink-0"
                    style={{ accentColor: ABIX.gold }}
                  />
                  <span className="text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
                    I agree that ABIXMART may store my name, phone number and request details to record my
                    interest in {product.name}, and may contact me on this number about it. I can ask for my
                    details to be removed at any time by contacting{' '}
                    <Link
                      to="/support#contact"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-4"
                      style={{ color: ABIX.goldLight }}
                    >
                      Support
                    </Link>
                    .
                  </span>
                </label>
                <FieldError id="po-consent-error">{errors.consent}</FieldError>
              </div>
            </div>

            {/* Honeypot: invisible to people, tempting to bots. */}
            <input
              type="text"
              name="abx_contact_fax"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
            />

            {submitError && (
              <p
                className="mt-6 border px-4 py-3 text-sm leading-relaxed"
                role="alert"
                style={{ borderColor: ERROR_COLOR, color: ERROR_COLOR }}
              >
                {submitError}
              </p>
            )}

            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="inline-flex items-center justify-center h-12 px-6 text-[11px] font-semibold tracking-luxe-sm uppercase disabled:opacity-40"
                style={{ color: ABIX.ivory70 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center h-12 px-8 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300 disabled:opacity-60"
                style={{ background: ABIX.gold, color: ABIX.obsidian }}
              >
                {submitting ? 'Saving…' : 'Register interest'}
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed" style={{ color: ABIX.ivory45 }}>
              {user
                ? 'Your details are visible only to the ABIXMART team.'
                : 'No account is needed. Your details are visible only to the ABIXMART team.'}
            </p>
          </form>
        )}
      </div>
    </ModalShell>
  );
}