import { products, ritualBundles } from '@/data/products';

// Pure calculation helpers for the admin data pages. No Firestore access
// and no React in this file: everything takes plain arrays of documents
// (each with its Firestore `id`) and returns plain values.
//
// Definitions used across the admin:
//   booked order   = any order whose orderStatus is not "cancelled"
//   booked revenue = sum of stored `total` over booked orders
//   collected      = orders where paymentStatus === "paid"
//   refunded       = orders where paymentStatus === "refunded"
//   pack           = one unit of `item.qty` (a package); jars = packs × jars
//                    per package. G4: jars per package is read from the order
//                    item's `jarsPerPack` when present, otherwise (historical
//                    orders) from the static ritualBundles.

export const ORDER_STATUS_ORDER = [
  'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled',
];
export const PAYMENT_STATUS_ORDER = ['pending', 'paid', 'failed', 'refunded'];
export const PAYMENT_METHOD_LABELS = { COD: 'Cash on Delivery' };

/* ---------------------------------------------------------------- *
 * Formatting
 * ---------------------------------------------------------------- */

export function formatINR(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? `₹${Math.round(n).toLocaleString('en-IN')}` : '—';
}

export function formatINRCompact(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  if (n >= 10000000) return `₹${+(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${+(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${+(n / 1000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}

export function formatNumber(value, digits = 1) {
  const n = Number(value);
  if (value === null || value === undefined || !Number.isFinite(n)) return '—';
  return (+n.toFixed(digits)).toLocaleString('en-IN');
}

export function formatPercent(ratio) {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—';
  return `${+(ratio * 100).toFixed(1)}%`;
}

export function humanize(value) {
  return String(value).replace(/_/g, ' ');
}

export function signupMethodLabel(provider) {
  if (provider === 'google') return 'Google';
  if (provider === 'password') return 'Email & password';
  return String(provider);
}

/* ---------------------------------------------------------------- *
 * Dates / time series
 * ---------------------------------------------------------------- */

export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

const pad2 = (n) => String(n).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dayKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function monthKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
// Monday of the week containing `d` (local time), as a new Date.
function weekStart(d) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}
function keyFor(period, d) {
  if (period === 'month') return monthKey(d);
  if (period === 'week') return dayKey(weekStart(d));
  return dayKey(d);
}
function labelFor(period, d) {
  if (period === 'month') return `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const DEFAULT_WINDOW = { day: 30, week: 12, month: 12 };

// Builds a continuous series of the last `count` periods ending now.
export function buildSeries(items, { period = 'day', count, getDate, getValue = () => 1, now = new Date() }) {
  const n = count || DEFAULT_WINDOW[period] || 30;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slots = [];

  for (let i = n - 1; i >= 0; i--) {
    let start;
    if (period === 'month') {
      start = new Date(today.getFullYear(), today.getMonth() - i, 1);
    } else if (period === 'week') {
      start = weekStart(today);
      start.setDate(start.getDate() - i * 7);
    } else {
      start = new Date(today);
      start.setDate(start.getDate() - i);
    }
    slots.push({ key: keyFor(period, start), label: labelFor(period, start), value: 0, count: 0 });
  }

  const byKey = new Map(slots.map((s) => [s.key, s]));
  items.forEach((item) => {
    const ms = toMillis(getDate(item));
    if (!ms) return;
    const slot = byKey.get(keyFor(period, new Date(ms)));
    if (!slot) return;
    const v = Number(getValue(item));
    slot.value += Number.isFinite(v) ? v : 0;
    slot.count += 1;
  });

  return slots;
}

export function groupByDay(items, getDate, getValue, count = 30) {
  return buildSeries(items, { period: 'day', count, getDate, getValue });
}

export function groupByMonth(items, getDate, getValue, count = 12) {
  return buildSeries(items, { period: 'month', count, getDate, getValue });
}

export function countSince(items, getDate, days, now = Date.now()) {
  const cutoff = now - days * 86400000;
  return items.reduce((n, item) => (toMillis(getDate(item)) >= cutoff && toMillis(getDate(item)) > 0 ? n + 1 : n), 0);
}

/* ---------------------------------------------------------------- *
 * Generic grouping
 * ---------------------------------------------------------------- */

export function countBy(items, keyFn, { labelFn, order = [] } = {}) {
  const map = new Map();
  items.forEach((item) => {
    const raw = keyFn(item);
    const key = raw === undefined || raw === null || raw === '' ? '__none__' : raw;
    const existing = map.get(key);
    if (existing) {
      existing.value += 1;
    } else {
      map.set(key, {
        key,
        label: key === '__none__' ? 'Not recorded' : labelFn ? labelFn(key, item) : String(key),
        value: 1,
      });
    }
  });

  return [...map.values()].sort((a, b) => {
    const ai = order.indexOf(a.key);
    const bi = order.indexOf(b.key);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return b.value - a.value;
  });
}

/* ---------------------------------------------------------------- *
 * Orders
 * ---------------------------------------------------------------- */

export const isBooked = (order) => order?.orderStatus !== 'cancelled';

export function orderTotal(order) {
  const v = order?.total;
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function calculateRevenue(orders) {
  const result = {
    totalOrders: orders.length,
    bookedCount: 0,
    bookedRevenue: 0,
    cancelledCount: 0,
    collectedCount: 0,
    collectedRevenue: 0,
    refundedCount: 0,
    refundedValue: 0,
    unpricedOrders: 0,
  };

  orders.forEach((o) => {
    const total = orderTotal(o);
    if (total === null) result.unpricedOrders += 1;
    const amount = total ?? 0;

    if (o.orderStatus === 'cancelled') {
      result.cancelledCount += 1;
    } else {
      result.bookedCount += 1;
      result.bookedRevenue += amount;
    }
    if (o.paymentStatus === 'paid') {
      result.collectedCount += 1;
      result.collectedRevenue += amount;
    }
    if (o.paymentStatus === 'refunded') {
      result.refundedCount += 1;
      result.refundedValue += amount;
    }
  });

  return result;
}

export function calculateAverageOrderValue(orders) {
  let sum = 0;
  let n = 0;
  orders.forEach((o) => {
    if (!isBooked(o)) return;
    const total = orderTotal(o);
    if (total === null) return;
    sum += total;
    n += 1;
  });
  return n ? sum / n : null;
}

export function calculateOrderStatusDistribution(orders) {
  return countBy(orders, (o) => o.orderStatus, { order: ORDER_STATUS_ORDER, labelFn: humanize });
}

export function calculatePaymentStatusDistribution(orders) {
  return countBy(orders, (o) => o.paymentStatus, { order: PAYMENT_STATUS_ORDER, labelFn: humanize });
}

export function calculatePaymentMethodDistribution(orders) {
  return countBy(orders, (o) => o.paymentMethod, {
    labelFn: (key) => PAYMENT_METHOD_LABELS[key] || String(key),
  });
}

function titleCase(s) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function calculateGeoDistribution(orders, field) {
  const normalize = (o) => {
    const raw = o.shippingAddress?.[field];
    if (typeof raw !== 'string') return '';
    return raw.trim().replace(/\s+/g, ' ').toLowerCase();
  };
  return countBy(orders.filter(isBooked), normalize, { labelFn: (key) => titleCase(key) });
}

export function calculateSignupMethodDistribution(users) {
  return countBy(users, (u) => u.provider, { order: ['google', 'password'], labelFn: signupMethodLabel });
}

export function calculateRepeatCustomerRate(orders) {
  const perUid = new Map();
  let unattributed = 0;

  orders.filter(isBooked).forEach((o) => {
    if (!o.uid) {
      unattributed += 1;
      return;
    }
    perUid.set(o.uid, (perUid.get(o.uid) || 0) + 1);
  });

  let repeatCustomers = 0;
  let attributedOrders = 0;
  const buckets = { 1: 0, 2: 0, 3: 0 };
  perUid.forEach((n) => {
    attributedOrders += n;
    if (n >= 2) repeatCustomers += 1;
    buckets[Math.min(n, 3)] += 1;
  });

  const customersWithOrders = perUid.size;
  return {
    customersWithOrders,
    repeatCustomers,
    repeatRate: customersWithOrders ? repeatCustomers / customersWithOrders : null,
    ordersPerCustomer: customersWithOrders ? attributedOrders / customersWithOrders : null,
    unattributed,
    buckets: [
      { key: '1', label: '1 order', value: buckets[1] },
      { key: '2', label: '2 orders', value: buckets[2] },
      { key: '3', label: '3+ orders', value: buckets[3] },
    ],
  };
}

/* ---------------------------------------------------------------- *
 * Items / products
 * ---------------------------------------------------------------- */

function numOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// G4: jars = qty × jars-per-package.
//   1. Orders created after G4 carry `jarsPerPack` on the item (taken from
//      the Firestore variant), so any product/variant is counted correctly.
//   2. Historical orders have no such field: an item with no variant is one
//      jar per qty; a variant found in the static ritualBundles uses its
//      jar count; anything else returns null (unknown) instead of a guess.
export function jarsForItem(item) {
  const qty = numOrNull(item?.qty);
  if (qty === null) return null;

  const perPack = numOrNull(item?.jarsPerPack);
  if (perPack !== null && perPack > 0) return qty * perPack;

  if (!item.variantId) return qty;
  const bundle = ritualBundles.find((b) => b.id === item.variantId);
  return bundle ? qty * bundle.jars : null;
}

export function flattenOrderItems(orders) {
  const out = [];
  orders.forEach((o) => {
    (Array.isArray(o.items) ? o.items : []).forEach((it) => {
      out.push({
        orderKey: o.id,
        createdAt: o.createdAt,
        uid: o.uid,
        productId: it.productId || null,
        variantId: it.variantId || null,
        variantLabel: it.variantLabel || null,
        name: it.name || null,
        qty: numOrNull(it.qty) ?? 0,
        unitPrice: numOrNull(it.unitPrice),
        // Stored subtotal only — never recomputed from current prices.
        subtotal: numOrNull(it.subtotal),
        jars: jarsForItem(it),
      });
    });
  });
  return out;
}

export function calculateOrderSize(orders) {
  let ordersWithItems = 0;
  let packs = 0;
  let jars = 0;
  let ordersWithKnownJars = 0;

  orders.filter(isBooked).forEach((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    if (items.length === 0) return;
    ordersWithItems += 1;
    packs += items.reduce((s, it) => s + (numOrNull(it.qty) ?? 0), 0);

    let orderJars = 0;
    let known = true;
    items.forEach((it) => {
      const j = jarsForItem(it);
      if (j === null) known = false;
      else orderJars += j;
    });
    if (known) {
      jars += orderJars;
      ordersWithKnownJars += 1;
    }
  });

  return {
    ordersWithItems,
    ordersWithKnownJars,
    avgPacks: ordersWithItems ? packs / ordersWithItems : null,
    avgJars: ordersWithKnownJars ? jars / ordersWithKnownJars : null,
  };
}

// Per-product performance over booked orders.
// G4: `catalog` is the list of product documents ({ id, name, status }) to
// use for names and the "available" rows. Pass the Firestore `products`
// collection; it defaults to the static list so existing callers keep working.
export function calculateProductPerformance(orders, catalog = products) {
  const items = flattenOrderItems(orders.filter(isBooked));
  const rows = new Map();
  const variants = new Map();
  const orderKeys = new Set();
  const totals = { packs: 0, jars: 0, revenue: 0 };
  let unknownJarItems = 0;
  let unpricedItems = 0;

  const newRow = (productId, name, inCatalog) => ({
    productId, name, inCatalog, orderKeys: new Set(), packs: 0, jars: 0, jarsComplete: true, revenue: 0,
  });

  catalog.filter((p) => p.status === 'available').forEach((p) => rows.set(p.id, newRow(p.id, p.name, true)));

  items.forEach((it) => {
    const productId = it.productId || 'unknown';
    const catalogEntry = catalog.find((p) => p.id === productId);
    if (!rows.has(productId)) {
      rows.set(productId, newRow(productId, catalogEntry?.name || it.name || productId, Boolean(catalogEntry)));
    }
    const row = rows.get(productId);
    const productName = row.name;

    row.orderKeys.add(it.orderKey);
    orderKeys.add(it.orderKey);
    row.packs += it.qty;
    totals.packs += it.qty;

    if (it.jars === null) {
      row.jarsComplete = false;
      unknownJarItems += 1;
    } else {
      row.jars += it.jars;
      totals.jars += it.jars;
    }
    if (it.subtotal === null) {
      unpricedItems += 1;
    } else {
      row.revenue += it.subtotal;
      totals.revenue += it.subtotal;
    }

    const bundle = it.variantId ? ritualBundles.find((b) => b.id === it.variantId) : null;
    const vKey = `${productId}|${it.variantId || 'none'}`;
    if (!variants.has(vKey)) {
      variants.set(vKey, {
        key: vKey,
        productId,
        productName,
        label: it.variantLabel || bundle?.name || 'No variant',
        packs: 0,
        jars: 0,
        revenue: 0,
        orderKeys: new Set(),
      });
    }
    const v = variants.get(vKey);
    v.packs += it.qty;
    if (it.jars !== null) v.jars += it.jars;
    if (it.subtotal !== null) v.revenue += it.subtotal;
    v.orderKeys.add(it.orderKey);
  });

  return {
    products: [...rows.values()]
      .map((r) => ({
        productId: r.productId,
        name: r.name,
        inCatalog: r.inCatalog,
        orders: r.orderKeys.size,
        packs: r.packs,
        jars: r.jars,
        jarsComplete: r.jarsComplete,
        revenue: r.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.packs - a.packs),
    variants: [...variants.values()]
      .map((v) => ({
        key: v.key,
        productId: v.productId,
        productName: v.productName,
        label: v.label,
        packs: v.packs,
        jars: v.jars,
        revenue: v.revenue,
        orders: v.orderKeys.size,
      }))
      .sort((a, b) => b.packs - a.packs || b.revenue - a.revenue),
    totals: { orders: orderKeys.size, ...totals },
    unknownJarItems,
    unpricedItems,
  };
}

// Notify-me signups per coming-soon product.
// G4: `catalog` defaults to the static list; pass the Firestore `products`
// collection so Firestore-created coming-soon products are included.
export function calculateNotifyInterest(notifications, catalog = products) {
  const counts = new Map();
  notifications.forEach((n) => {
    if (n.productId) counts.set(n.productId, (counts.get(n.productId) || 0) + 1);
  });

  const rows = catalog
    .filter((p) => p.status === 'coming_soon')
    .map((p) => ({ key: p.id, label: p.name, value: counts.get(p.id) || 0 }))
    .sort((a, b) => b.value - a.value);

  const matched = rows.reduce((s, r) => s + r.value, 0);
  return { rows, total: notifications.length, unmatched: notifications.length - matched };
}

/* ---------------------------------------------------------------- *
 * Customers / activity
 * ---------------------------------------------------------------- */

export function buildActivityFeed({ users = [], orders = [], inquiries = [] }) {
  const feed = [];
  users.forEach((u) => {
    const at = toMillis(u.createdAt);
    if (at) feed.push({ key: `user:${u.id}`, type: 'registration', at, doc: u });
  });
  orders.forEach((o) => {
    const at = toMillis(o.createdAt);
    if (at) feed.push({ key: `order:${o.id}`, type: 'order', at, doc: o });
  });
  inquiries.forEach((i) => {
    const at = toMillis(i.createdAt);
    if (at) feed.push({ key: `inquiry:${i.id}`, type: 'inquiry', at, doc: i });
  });
  return feed.sort((a, b) => b.at - a.at);
}

export function calculateCustomerStats(users, orders) {
  const booked = orders.filter(isBooked);
  const stats = new Map();
  booked.forEach((o) => {
    if (!o.uid) return;
    const s = stats.get(o.uid) || { orders: 0, value: 0, lastOrderAt: 0 };
    s.orders += 1;
    s.value += orderTotal(o) ?? 0;
    const at = toMillis(o.createdAt);
    if (at > s.lastOrderAt) s.lastOrderAt = at;
    stats.set(o.uid, s);
  });

  const knownUids = new Set(users.map((u) => u.id));
  const rows = users
    .filter((u) => stats.has(u.id))
    .map((u) => ({ user: u, ...stats.get(u.id) }))
    .sort((a, b) => b.value - a.value || b.orders - a.orders);

  return {
    rows,
    unmatchedOrders: booked.filter((o) => !o.uid || !knownUids.has(o.uid)).length,
  };
}