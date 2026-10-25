// src/lib/cartPricing.js
//
// Pure cart pricing. No React, no Firebase, no project imports, so it can be
// unit-tested with `node --test`.
//
// MODEL
//   A cart line is "product + number of jars". The bundle variant and the
//   price are DERIVED from the jar count every time, so the selected variant,
//   the quantity and the price can never disagree, before or after a refresh.
//
//   - If the product has a variant whose `jars` equals the jar count, that
//     variant's price is the price of the whole line (a bundle price is NOT
//     multiplied by the jar count again).
//   - Otherwise the product's regular price is multiplied by the jar count.
//
//   Variants come from the product data (Firestore `products/{id}.variants`),
//   so nothing here is hardcoded to a product id, a price or a variant id.
//
// QUANTITIES ABOVE THE LARGEST BUNDLE
//   When no variant has exactly that many jars (4 or more today), no bundle is
//   selected and the line is the product's regular single-jar price x the jar
//   count (4 jars = 4 x 1099). There is no upper limit. Going back down to a
//   quantity that has a bundle selects that bundle again.

function finiteOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// Variants that can actually be bought: a whole number of jars and a price.
function pricedBundles(product) {
  const list = Array.isArray(product?.variants) ? product.variants : [];
  const out = [];
  for (const v of list) {
    const jars = finiteOrNull(v?.jars);
    const price = finiteOrNull(v?.price);
    if (jars !== null && Number.isInteger(jars) && jars >= 1 && price !== null) {
      out.push({ ...v, jars, price });
    }
  }
  return out;
}

// Kept so callers have one place to ask "is there a maximum?". There is none:
// above the largest bundle the regular price is simply multiplied.
export function bundleCeiling() {
  return Infinity;
}

// Whole number of jars, at least 1.
export function clampJars(product, jars) {
  let n = Math.floor(Number(jars));
  if (!Number.isFinite(n) || n < 1) n = 1;
  return Math.min(n, bundleCeiling(product));
}

// Everything the UI and checkout need for one cart line, or null when the
// product cannot be priced.
//   jars         jars in the line (what the customer sees as "quantity")
//   variantId    the matching bundle, or null for the regular price
//   packages     what checkout calls `qty` (1 for a bundle, jars otherwise)
//   unitPrice    price of one package; subtotal = unitPrice x packages
export function resolveLine(product, jars) {
  if (!product) return null;
  const n = clampJars(product, jars);

  const bundle = pricedBundles(product).find((b) => b.jars === n);
  if (bundle) {
    return {
      jars: n,
      variantId: bundle.id,
      variantLabel: bundle.name || bundle.label || null,
      packages: 1,
      unitPrice: bundle.price,
      subtotal: bundle.price,
      originalPrice: finiteOrNull(bundle.originalPrice),
      note: bundle.note || '',
      jarsPerPack: n,
    };
  }

  const base = finiteOrNull(product.price);
  if (base === null) return null;
  const mrp = finiteOrNull(product.mrp);
  return {
    jars: n,
    variantId: null,
    variantLabel: null,
    packages: n,
    unitPrice: base,
    subtotal: base * n,
    originalPrice: mrp === null ? null : mrp * n,
    note: '',
    jarsPerPack: 1,
  };
}

// "999.50", "999.67", "1099" (no decimals when the price is a whole number).
export function formatPerJar(subtotal, jars) {
  const n = jars > 0 ? Math.round((subtotal / jars) * 100) / 100 : subtotal;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}