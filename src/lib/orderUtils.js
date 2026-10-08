import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit as fsLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ORDER_ID_PREFIX = 'ABX';
// No 0/O/1/I — avoids characters that are easy to misread or mistype.
const ORDER_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

// Permanent, customer-facing order ID: ABX-YYYYMMDD-XXXXX.
// Generated exactly once, at order creation. (No Firestore uniqueness
// pre-check: the security rules would reject a query without a uid filter,
// and the 32^5 suffix space per day is ample.)
export function generateOrderId(date = new Date()) {
  const datePart = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += ORDER_ID_CHARS[Math.floor(Math.random() * ORDER_ID_CHARS.length)];
  }
  return `${ORDER_ID_PREFIX}-${datePart}-${suffix}`;
}

// Display-only label for legacy orders created before `orderId` existed.
export function getDisplayOrderId(order) {
  if (order?.orderId) return order.orderId;
  const shortId = (order?.id || '').slice(-6).toUpperCase();
  return shortId ? `ABX-LEGACY-${shortId}` : 'ABX-LEGACY';
}

// G4: thrown by createOrder() when the order cannot be placed because of the
// cart contents (not because of a network/Firestore failure). `userMessage`
// is safe to show to the customer.
export class OrderValidationError extends Error {
  constructor(code, userMessage) {
    super(userMessage);
    this.name = 'OrderValidationError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

// G4: checks every order item against the live Firestore `products/{id}`
// document and returns the items to store.
//   - product must exist and be `available` (customers cannot read draft or
//     archived documents at all; permission-denied is treated as unavailable)
//   - variant (if any) must exist on the product
//   - unitPrice must equal the current variant price (or base price when
//     there is no variant), and subtotal must equal unitPrice * qty
//   - `jarsPerPack` is added from the Firestore variant (1 if no variant), so
//     Product Performance can count jars for products that are not in the
//     static ritualBundles list
// Existing item fields are preserved unchanged.
async function verifyAndEnrichItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new OrderValidationError('empty-order', 'Your cart is empty.');
  }

  const cache = new Map();
  const loadProduct = (id) => {
    if (!cache.has(id)) {
      cache.set(
        id,
        getDoc(doc(db, 'products', id))
          .then((snap) => (snap.exists() ? snap.data() : null))
          .catch((err) => {
            if (err?.code === 'permission-denied') return null;
            throw err;
          })
      );
    }
    return cache.get(id);
  };

  const out = [];
  for (const it of items) {
    const label = it?.name || 'An item';
    const qty = Number(it?.qty);
    if (!it?.productId || !Number.isInteger(qty) || qty < 1) {
      throw new OrderValidationError('invalid-item', `${label} has an invalid quantity. Please review your cart.`);
    }

    const product = await loadProduct(it.productId);
    if (!product || product.status !== 'available') {
      throw new OrderValidationError('product-unavailable', `${label} is no longer available. Please review your cart.`);
    }

    let expectedPrice;
    let jarsPerPack = 1;
    if (it.variantId) {
      const variant = (Array.isArray(product.variants) ? product.variants : []).find((v) => v.id === it.variantId);
      if (!variant) {
        throw new OrderValidationError('variant-unavailable', `The selected option for ${label} is no longer offered. Please review your cart.`);
      }
      expectedPrice = Number(variant.price);
      const j = Number(variant.jars);
      jarsPerPack = Number.isFinite(j) && j > 0 ? j : 1;
    } else {
      expectedPrice = Number(product.price);
    }

    if (!Number.isFinite(expectedPrice)) {
      throw new OrderValidationError('no-price', `${label} has no price and cannot be ordered.`);
    }
    if (Number(it.unitPrice) !== expectedPrice) {
      throw new OrderValidationError('price-changed', `The price of ${label} has changed. Please review your cart.`);
    }
    if (Number(it.subtotal) !== expectedPrice * qty) {
      throw new OrderValidationError('invalid-item', `${label} has an invalid subtotal. Please review your cart.`);
    }

    out.push({
      ...it,
      productId: it.productId,
      variantId: it.variantId || null,
      variantLabel: it.variantLabel || null,
      name: it.name || product.name || it.productId,
      qty,
      unitPrice: expectedPrice,
      subtotal: expectedPrice * qty,
      jarsPerPack,
    });
  }
  return out;
}

// Creates one orders/{firestoreDocId} document and returns the customer-facing
// `orderId`. G4: items are verified against Firestore first (see above) and
// the order totals must add up; otherwise nothing is written.
export async function createOrder({ uid, customer, shippingAddress, items, subtotal, shipping, total, paymentMethod }) {
  const verifiedItems = await verifyAndEnrichItems(items);

  const itemsTotal = verifiedItems.reduce((sum, it) => sum + it.subtotal, 0);
  const shippingNum = Number(shipping);
  if (
    !Number.isFinite(shippingNum) ||
    shippingNum < 0 ||
    Number(subtotal) !== itemsTotal ||
    Number(total) !== itemsTotal + shippingNum
  ) {
    throw new OrderValidationError('total-mismatch', 'Your order total changed. Please review your cart.');
  }

  const orderId = generateOrderId();
  await addDoc(collection(db, 'orders'), {
    orderId,
    uid,
    customer,
    shippingAddress,
    items: verifiedItems,
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

// All orders belonging to one customer (uid filter only; sorted client-side).
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

// One order by customer-facing orderId, scoped to the authenticated uid.
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

export function statusToStage(orderStatus) {
  if (orderStatus === 'delivered') return 2;
  if (orderStatus === 'shipped' || orderStatus === 'out_for_delivery') return 1;
  return 0;
}

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