import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit as fsLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ORDER_ID_PREFIX = 'ABX';
// No 0/O/1/I — avoids characters that are easy to misread or mistype
// when a customer is copying an order ID off a screen.
const ORDER_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Permanent, customer-facing order ID: ABX-YYYYMMDD-XXXXX.
// Generated exactly once, at order creation, and stored on the order
// document forever — never regenerated on read or on refresh.
//
// NOTE: there is intentionally no uniqueness pre-check against
// Firestore here. Under this project's security rules (orders are
// only readable via a query that includes `uid == request.auth.uid`),
// a client-side query like `where('orderId', '==', candidate)` with no
// uid filter cannot be proven safe by Firestore and is rejected
// outright. The 5-character suffix is drawn from a 32-character set
// (33,554,432 combinations per calendar day), which is more than
// enough entropy for this volume — a collision is not a realistic
// concern here.
export function generateOrderId(date = new Date()) {
  const datePart = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += ORDER_ID_CHARS[Math.floor(Math.random() * ORDER_ID_CHARS.length)];
  }
  return `${ORDER_ID_PREFIX}-${datePart}-${suffix}`;
}

// A stable, DISPLAY-ONLY label for legacy orders placed before the
// orderId field existed. Derived purely from the Firestore document
// ID, so it's identical every time the same order loads — never
// random, and never written back to Firestore from the client (the
// client can't — see scripts/backfillOrderIds.js for the real fix).
// These orders cannot be looked up on the Support tracking page until
// they've been backfilled with a real orderId by that script.
export function getDisplayOrderId(order) {
  if (order?.orderId) return order.orderId;
  const shortId = (order?.id || '').slice(-6).toUpperCase();
  return shortId ? `ABX-LEGACY-${shortId}` : 'ABX-LEGACY';
}

// Creates one orders/{firestoreDocId} document. The Firestore document
// ID stays internal/auto-generated as before; `orderId` is the new,
// separate, permanent customer-facing ID. Returns `orderId` (not the
// doc ID) so every caller — checkout confirmation, Profile → Orders,
// Support tracking — shows and searches on the same value.
export async function createOrder({ uid, customer, shippingAddress, items, subtotal, shipping, total, paymentMethod }) {
  const orderId = generateOrderId();
  await addDoc(collection(db, 'orders'), {
    orderId,
    uid,
    customer,
    shippingAddress,
    items,
    subtotal,
    shipping,
    total,
    paymentMethod,
    paymentStatus: 'pending',
    orderStatus: 'placed',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return orderId;
}

// All orders belonging to one customer. Filters by `uid` only (no
// `orderBy`) and sorts client-side by createdAt — this is the query
// shape Firestore's automatic indexes support without you needing to
// create a composite index in the console.
export async function getOrdersForUser(uid) {
  if (!uid) return [];
  const q = query(collection(db, 'orders'), where('uid', '==', uid));
  const snap = await getDocs(q);
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  orders.sort((a, b) => {
    const at = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bt = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bt - at;
  });
  return orders;
}

// Looks up exactly one order by its customer-facing orderId, scoped to
// the authenticated uid. Both filters are required: not just for
// correctness, but because Firestore's security rules only allow a
// query that is provably restricted to the requester's own documents,
// which means the `uid == request.auth.uid` filter must be present in
// the query itself, not just checked afterward in JS.
export async function getOrderForTracking(orderId, uid) {
  if (!orderId || !uid) return null;
  const trimmed = orderId.trim();
  if (!trimmed) return null;
  const q = query(
    collection(db, 'orders'),
    where('orderId', '==', trimmed),
    where('uid', '==', uid),
    fsLimit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

// Maps orderStatus onto the existing 3-stage Support-page stepper
// (Order / In Transit / Delivered). Returns a stage INDEX (0, 1, 2) —
// never invents progress beyond what orderStatus actually says.
export function statusToStage(orderStatus) {
  if (orderStatus === 'delivered') return 2;
  if (orderStatus === 'shipped' || orderStatus === 'out_for_delivery') return 1;
  return 0; // placed, confirmed, processing, or anything unrecognized
}

// Maps orderStatus onto the existing detailed 5-step list
// (placed / packed / shipped / out_for_delivery / delivered).
export function statusToDetailIndex(orderStatus) {
  switch (orderStatus) {
    case 'delivered':
      return 4;
    case 'out_for_delivery':
      return 3;
    case 'shipped':
      return 2;
    case 'packed':
      return 1;
    case 'placed':
    case 'confirmed':
    case 'processing':
    default:
      return 0;
  }
}