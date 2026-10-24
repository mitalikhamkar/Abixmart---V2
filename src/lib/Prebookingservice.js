// src/lib/preBookingService.js
//
// Customer-side writes for pre-order interest requests (collection
// `preBookings`; see firestore.rules).
//
//   Signed-in customer: document id  {uid}_{productId}  with a `uid` field.
//     That id allows one request per product, and the customer can read it
//     back to show "already registered".
//   Guest: a 20-character auto id and no uid. Guests can write but never
//     read, list or change anything.

import { collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  CONSENT_VERSION,
  PRE_BOOKINGS_COLLECTION,
  validatePreBooking,
} from '@/lib/preBookingConfig';

export const preBookingDocId = (uid, productId) => `${uid}_${productId}`;

// A convenience flag so a guest sees "you already registered from this
// device". It stores a date only, never personal details.
const seenKey = (productId) => `abixmart_preorder_${productId}`;

export function readLocalPreBookingDate(productId) {
  try {
    return window.localStorage.getItem(seenKey(productId));
  } catch {
    return null;
  }
}

function rememberLocally(productId) {
  try {
    window.localStorage.setItem(seenKey(productId), new Date().toISOString());
  } catch {
    // Storage can be unavailable (private mode). Non-fatal.
  }
}

export async function hasMyPreBooking(uid, productId) {
  const snap = await getDoc(doc(db, PRE_BOOKINGS_COLLECTION, preBookingDocId(uid, productId)));
  return snap.exists();
}

// A guest request id, created once per open form so a retry or a double
// click always targets the same document and can never create two.
export function createGuestBookingRef() {
  return doc(collection(db, PRE_BOOKINGS_COLLECTION));
}

export async function submitPreBooking({ product, user, values, guestRef }) {
  const { errors, clean } = validatePreBooking(values);
  if (Object.keys(errors).length > 0) {
    throw Object.assign(new Error('Invalid pre-order values'), { code: 'abixmart/invalid', errors });
  }

  const body = {
    productId: product.id,
    productName: product.name,
    fullName: clean.fullName,
    phone: clean.phone,
    quantity: clean.quantity,
    timing: clean.timing,
    consent: true,
    consentVersion: CONSENT_VERSION,
    status: 'new',
    createdAt: serverTimestamp(),
  };

  if (user) {
    // One request per signed-in customer per product.
    let alreadyRegistered = false;
    try {
      alreadyRegistered = await hasMyPreBooking(user.uid, product.id);
    } catch {
      // If the check itself fails, the create below is still protected by
      // the rules: a second create on the same id is rejected.
    }
    if (alreadyRegistered) {
      throw Object.assign(new Error('Already registered'), { code: 'abixmart/already-registered' });
    }

    await setDoc(doc(db, PRE_BOOKINGS_COLLECTION, preBookingDocId(user.uid, product.id)), {
      ...body,
      uid: user.uid,
    });
  } else {
    await setDoc(guestRef || createGuestBookingRef(), body);
  }

  rememberLocally(product.id);
}

export function describePreBookingError(err) {
  if (err?.code === 'permission-denied') {
    return 'We could not save your request. This product may not be open for pre-orders right now, or you may already be registered. Please refresh the page and try again.';
  }
  if (err?.code === 'unavailable' || err?.code === 'deadline-exceeded') {
    return 'You seem to be offline. Please check your connection and try again.';
  }
  return 'Something went wrong while saving your request. Please try again.';
}