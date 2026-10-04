// Product data model for Firestore `products/{productId}`.
//
// Pure module: no imports, no Firebase, no React. It is shared by the admin
// panel and by scripts/seedProducts.mjs (which loads this file's source
// directly), so keep it dependency-free.
//
// Document ID  = the existing product id (e.g. "shilajit-resin"). It is
//                referenced by carts and orders as `productId`, so it must
//                never change once created.
//
// Status (one field, no competing booleans):
//   available    = Published and purchasable (the literal the current code
//                  already uses)
//   coming_soon  = visible, not purchasable, Notify Me
//   draft        = hidden from customers
//   archived     = retired but kept, because past orders reference it
//
// Variants: `qty` in carts and orders means NUMBER OF PACKAGES. A
// "2 Jar Ritual" with qty 1 is 1 package = 2 jars (variant.jars).

export const PRODUCT_STATUSES = ['available', 'coming_soon', 'draft', 'archived'];

export const PRODUCT_STATUS_LABELS = {
  available: 'Available',
  coming_soon: 'Coming Soon',
  draft: 'Draft',
  archived: 'Archived',
};

export const isAvailable = (product) => product?.status === 'available';
export const isComingSoon = (product) => product?.status === 'coming_soon';
export const isVisibleToCustomers = (product) => isAvailable(product) || isComingSoon(product);

function asNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asText(value) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asList(value) {
  return Array.isArray(value) ? value : [];
}

// Static catalog entry (src/data/products.js) -> Firestore document body.
// Returns plain values only (no timestamps, no undefined — Firestore rejects
// undefined). The caller supplies the document ID and timestamps.
//
// `bundles` is the existing `ritualBundles` list. Like the current product
// page, bundles are attached to available products only.
export function buildProductDocument(product, bundles = [], sortOrder = 0) {
  const price = asNumber(product.price);
  const available = product.status === 'available';

  const variants = (available ? bundles : []).map((b) => ({
    id: b.id,
    label: b.name,
    description: asText(b.detail),
    jars: b.jars,
    price: b.price,
    mrp: asNumber(b.originalPrice),
    highlight: Boolean(b.highlight),
  }));

  // Product-level MRP = the original price of the bundle that matches the
  // product's base price (the single jar).
  const baseBundle = price === null ? null : bundles.find((b) => b.price === price);

  return {
    slug: product.slug,
    name: product.name,
    subtitle: asText(product.subtitle),
    category: product.category || null,
    status: product.status,
    sortOrder,
    price,
    mrp: available && baseBundle ? asNumber(baseBundle.originalPrice) : null,
    currency: product.currency || '₹',
    shortDesc: asText(product.shortDesc),
    description: asText(product.description),
    facts: asList(product.facts).map((f) => ({ label: f.label, value: f.value })),
    howToUse: asList(product.howToUse).slice(),
    note: asText(product.note),
    howToTakeRoute: asText(product.howToTakeRoute),
    // Bundled assets are not URLs, so nothing is stored here yet. Uploaded
    // image URLs will be saved here by the future Add/Edit Product UI.
    images: { primary: null, gallery: [] },
    variants,
  };
}

// Firestore variant -> the shape the current UI already uses for
// `ritualBundles` entries (name, detail, originalPrice, saving, note…).
export function normalizeVariant(variant = {}) {
  const price = asNumber(variant.price);
  const mrp = asNumber(variant.mrp);
  const saving = price !== null && mrp !== null && mrp > price ? mrp - price : 0;
  const jars = asNumber(variant.jars) ?? 1;
  return {
    id: variant.id,
    name: variant.label || variant.id,
    detail: asText(variant.description),
    jars,
    quantity: jars,
    originalPrice: mrp,
    price,
    saving,
    note: saving > 0 ? `Save ₹${saving.toLocaleString('en-IN')}` : '',
    highlight: Boolean(variant.highlight),
  };
}

// Firestore document ({ id, ...data }) -> one consistent product object with
// safe defaults. A document with no status is treated as a draft.
export function normalizeProduct(raw = {}) {
  const images = raw.images && typeof raw.images === 'object' ? raw.images : {};
  return {
    id: raw.id,
    slug: raw.slug || raw.id || null,
    name: raw.name || raw.id || 'Untitled product',
    subtitle: asText(raw.subtitle),
    category: raw.category || null,
    status: raw.status || 'draft',
    sortOrder: asNumber(raw.sortOrder) ?? 9999,
    price: asNumber(raw.price),
    mrp: asNumber(raw.mrp),
    currency: raw.currency || '₹',
    shortDesc: asText(raw.shortDesc),
    description: asText(raw.description),
    facts: asList(raw.facts),
    howToUse: asList(raw.howToUse),
    note: asText(raw.note),
    howToTakeRoute: asText(raw.howToTakeRoute),
    images: { primary: asText(images.primary), gallery: asList(images.gallery) },
    variants: asList(raw.variants).map(normalizeVariant),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}