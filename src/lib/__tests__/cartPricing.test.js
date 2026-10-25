import test from 'node:test';
import assert from 'node:assert/strict';
import { bundleCeiling, clampJars, resolveLine, formatPerJar } from '../cartPricing.js';

// Same shape as the normalized Firestore product (see productSchema.js).
const shilajit = {
  id: 'shilajit-resin',
  price: 1099,
  mrp: 1499,
  variants: [
    { id: 'single-jar', name: 'Single Jar', jars: 1, price: 1099, originalPrice: 1499, note: 'Save ₹400' },
    { id: '2-jar-ritual', name: '2 Jar Ritual', jars: 2, price: 1999, originalPrice: 2999, note: 'Save ₹1,000' },
    { id: '3-jar-ritual', name: '3 Jar Ritual', jars: 3, price: 2999, originalPrice: 4499, note: 'Save ₹1,500' },
  ],
};

test('1, 2 and 3 jars select the matching variant at its bundle price', () => {
  const one = resolveLine(shilajit, 1);
  const two = resolveLine(shilajit, 2);
  const three = resolveLine(shilajit, 3);

  assert.equal(one.variantId, 'single-jar');
  assert.equal(one.subtotal, 1099);
  assert.equal(two.variantId, '2-jar-ritual');
  assert.equal(two.subtotal, 1999);
  assert.equal(three.variantId, '3-jar-ritual');
  assert.equal(three.subtotal, 2999);
});

test('a bundle price is never multiplied by the jar count again', () => {
  const two = resolveLine(shilajit, 2);
  assert.equal(two.jars, 2);
  assert.equal(two.packages, 1); // checkout qty: one package
  assert.equal(two.unitPrice, 1999);
  assert.equal(two.subtotal, two.unitPrice * two.packages);
  assert.notEqual(two.subtotal, 1999 * 2);
  assert.notEqual(two.subtotal, 1099 * 2);
});

test('going 3 -> 2 -> 1 restores each bundle and its price', () => {
  assert.deepEqual(
    [3, 2, 1].map((n) => [resolveLine(shilajit, n).variantId, resolveLine(shilajit, n).subtotal]),
    [['3-jar-ritual', 2999], ['2-jar-ritual', 1999], ['single-jar', 1099]]
  );
});

test('above the largest bundle: no variant, regular single-jar price x quantity, no limit', () => {
  assert.equal(bundleCeiling(shilajit), Infinity);
  for (const [jars, total] of [[4, 4396], [5, 5495], [6, 6594], [10, 10990]]) {
    const r = resolveLine(shilajit, jars);
    assert.equal(r.jars, jars);
    assert.equal(r.variantId, null);
    assert.equal(r.variantLabel, null);
    assert.equal(r.packages, jars);
    assert.equal(r.unitPrice, 1099);
    assert.equal(r.subtotal, total);
  }
});

test('going 4 -> 3 -> 2 -> 1 restores each bundle and its price', () => {
  assert.deepEqual(
    [4, 3, 2, 1].map((n) => [resolveLine(shilajit, n).variantId, resolveLine(shilajit, n).subtotal]),
    [[null, 4396], ['3-jar-ritual', 2999], ['2-jar-ritual', 1999], ['single-jar', 1099]]
  );
});

test('invalid quantities become 1', () => {
  assert.equal(clampJars(shilajit, 0), 1);
  assert.equal(clampJars(shilajit, -2), 1);
  assert.equal(clampJars(shilajit, NaN), 1);
  assert.equal(clampJars(shilajit, '2'), 2);
  assert.equal(clampJars(shilajit, 99), 99);
  assert.equal(clampJars(shilajit, 2.9), 2);
});

test('variants come from product data, not from hardcoded ids or prices', () => {
  const other = {
    id: 'something-else',
    price: 500,
    variants: [
      { id: 'x1', name: 'One', jars: 1, price: 500 },
      { id: 'x4', name: 'Four', jars: 4, price: 1700 },
    ],
  };
    assert.equal(resolveLine(other, 4).variantId, 'x4');
  assert.equal(resolveLine(other, 4).subtotal, 1700);
  assert.equal(resolveLine(other, 5).subtotal, 2500); // above its largest bundle
  // no 2-jar bundle in this product's data: regular price x quantity
  const two = resolveLine(other, 2);
  assert.equal(two.variantId, null);
  assert.equal(two.packages, 2);
  assert.equal(two.subtotal, 1000);
});

test('a product with no bundles is regular price x quantity, with no ceiling', () => {
  const plain = { id: 'plain', price: 300, mrp: 400, variants: [] };
  assert.equal(bundleCeiling(plain), Infinity);
  const r = resolveLine(plain, 7);
  assert.equal(r.variantId, null);
  assert.equal(r.subtotal, 2100);
  assert.equal(r.originalPrice, 2800);
});

test('a product that cannot be priced resolves to null', () => {
  assert.equal(resolveLine({ id: 'x', price: null, variants: [] }, 1), null);
  assert.equal(resolveLine(null, 1), null);
});

test('variants without a price or a whole jar count are ignored', () => {
  const messy = {
    id: 'm',
    price: 100,
    variants: [{ id: 'a', jars: 2, price: null }, { id: 'b', jars: 1.5, price: 10 }],
  };
  assert.equal(bundleCeiling(messy), Infinity);
  assert.equal(resolveLine(messy, 2).subtotal, 200);
});

test('per-jar display matches the effective prices', () => {
  assert.equal(formatPerJar(1099, 1), '1099');
  assert.equal(formatPerJar(1999, 2), '999.50');
  assert.equal(formatPerJar(2999, 3), '999.67');
});

test('every line satisfies the order check in orderUtils.js (unitPrice = variant price, subtotal = unitPrice x qty)', () => {
  const plain = { id: 'plain', price: 300, variants: [] };
  const cases = [
    [shilajit, 1], [shilajit, 2], [shilajit, 3], [shilajit, 4],
    [plain, 1], [plain, 6],
  ];
  for (const [product, jars] of cases) {
    const r = resolveLine(product, jars);
    const variant = product.variants.find((v) => v.id === r.variantId);
    const expectedPrice = variant ? variant.price : product.price; // what orderUtils expects
    assert.equal(r.unitPrice, expectedPrice);
    assert.equal(r.subtotal, expectedPrice * r.packages);
    assert.ok(Number.isInteger(r.packages) && r.packages >= 1);
  }
});