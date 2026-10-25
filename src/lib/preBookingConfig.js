// src/lib/preBookingConfig.js
//
// Pure module (no React, no Firebase): shared by the customer pre-order
// form, the Firestore service and the admin Pre-orders screen.
//
// A pre-order here is an EXPRESSION OF INTEREST only. It is not an order,
// a reservation or a payment.

export const PRE_BOOKINGS_COLLECTION = 'preBookings';

// Bump this when the consent wording in PreOrderDialog.jsx changes, so every
// stored request records which wording the customer agreed to.
export const CONSENT_VERSION = '2026-10';

export const QUANTITY_MIN = 1;
export const QUANTITY_MAX = 20;

// The values are stored in Firestore and checked by firestore.rules. Change
// both together.
export const TIMING_OPTIONS = [
  { value: 'as-soon-as-available', label: 'As soon as it is available' },
  { value: 'within-1-month', label: 'Within a month of it becoming available' },
  { value: 'within-3-months', label: 'Within 1 to 3 months of it becoming available' },
  { value: 'just-exploring', label: 'Later, I am just exploring' },
];

export const TIMING_LABELS = Object.fromEntries(TIMING_OPTIONS.map((o) => [o.value, o.label]));

export const PRE_BOOKING_STATUSES = ['new', 'contacted', 'resolved'];

export function normalizeName(raw) {
  return String(raw ?? '').replace(/\s+/g, ' ').trim();
}

// Keeps digits and one leading "+". "+91 98765-43210" -> "+919876543210".
export function normalizePhone(raw) {
  const trimmed = String(raw ?? '').trim();
  const digits = trimmed.replace(/\D/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

// Returns { errors, clean }. `errors` is empty when the values are valid;
// `clean` is the normalized data to store.
export function validatePreBooking(values = {}) {
  const errors = {};

  const fullName = normalizeName(values.fullName);
  if (fullName.length < 2) errors.fullName = 'Please enter your full name.';
  else if (fullName.length > 80) errors.fullName = 'Please keep your name to 80 characters or fewer.';

  const phone = normalizePhone(values.phone);
  if (!/^\+?[0-9]{7,15}$/.test(phone)) {
    errors.phone = 'Enter a valid phone number: 7 to 15 digits, with your country code if it is not an Indian number.';
  }

  const quantity = Number(values.quantity);
  if (!Number.isInteger(quantity) || quantity < QUANTITY_MIN || quantity > QUANTITY_MAX) {
    errors.quantity = `Choose a quantity from ${QUANTITY_MIN} to ${QUANTITY_MAX}.`;
  }

  if (!TIMING_LABELS[values.timing]) {
    errors.timing = 'Please choose when you expect to buy.';
  }

  if (values.consent !== true) {
    errors.consent = 'Please tick the box to confirm you agree.';
  }

  return { errors, clean: { fullName, phone, quantity, timing: values.timing } };
}