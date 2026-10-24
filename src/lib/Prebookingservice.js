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

    try {
      await setDoc(doc(db, PRE_BOOKINGS_COLLECTION, preBookingDocId(user.uid, product.id)), {
        ...body,
        uid: user.uid,
      });
    } catch (err) {
      // A denied write can also mean the request already exists (a second
      // write to the same id is an update, which customers cannot do), for
      // example when two tabs submit at once. Check before blaming anything
      // else, so the customer sees the right screen.
      if (err?.code === 'permission-denied') {
        let exists = false;
        try {
          exists = await hasMyPreBooking(user.uid, product.id);
        } catch {
          // Ignore: fall through to the original error.
        }
        if (exists) {
          throw Object.assign(new Error('Already registered'), { code: 'abixmart/already-registered' });
        }
      }
      throw err;
    }
  } else {
    await setDoc(guestRef || createGuestBookingRef(), body);
  }

  rememberLocally(product.id);
}

// Customer-facing wording only: no document ids, field names or rule text.
// The technical detail stays in the browser console (see PreOrderDialog).
export function describePreBookingError(err) {
  switch (err?.code) {
    case 'permission-denied':
      return 'We could not save your request. Pre-orders for this product may have just closed, or there is a problem on our side. Your details are fine. Please try again later, or contact Support.';
    case 'unavailable':
    case 'deadline-exceeded':
      return 'You seem to be offline. Please check your connection and try again.';
    case 'resource-exhausted':
      return 'We are receiving a lot of requests right now. Please wait a moment and try again.';
    case 'abixmart/invalid':
      return 'Some of your details need a second look. Please check the form and try again.';
    default:
      return 'Something went wrong while saving your request. Please try again.';
  }
}