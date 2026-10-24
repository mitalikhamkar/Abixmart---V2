// tests/firestore.prebookings.fix.rules.test.mjs
//
// Emulator tests for the preBookings rules. Run from the project root
// (Java must be on PATH):
//   npx firebase emulators:exec --only firestore --project demo-abixmart-rules "node --test tests/firestore.prebookings.fix.rules.test.mjs"
//
// The "demo-" project id keeps everything inside the local emulator.

import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-abixmart-rules';
const PRODUCT = 'dayaveda';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'admins', 'admin1'), { createdAt: Timestamp.now() });
    await setDoc(doc(db, 'products', PRODUCT), { status: 'coming_soon', name: 'Dayaveda' });
    await setDoc(doc(db, 'products', 'shilajit-resin'), { status: 'available', name: 'Himalayan Shilajit' });
    await setDoc(doc(db, 'products', 'draft-one'), { status: 'draft', name: 'Draft One' });
  });
});

const asUser = (uid) => env.authenticatedContext(uid).firestore();
const asAdmin = () => asUser('admin1');
const anon = () => env.unauthenticatedContext().firestore();

// Mirrors submitPreBooking() in src/lib/preBookingService.js.
const body = (over = {}) => ({
  productId: PRODUCT,
  productName: 'Dayaveda',
  fullName: 'Test User',
  phone: '+919876543210',
  quantity: 2,
  timing: 'within-1-month',
  consent: true,
  consentVersion: '2026-10',
  status: 'new',
  createdAt: serverTimestamp(),
  ...over,
});

const customerRef = (db, uid, productId = PRODUCT) => doc(db, 'preBookings', `${uid}_${productId}`);
const guestRef = (db) => doc(collection(db, 'preBookings'));
const customerWrite = (uid, over = {}) =>
  setDoc(customerRef(asUser(uid), uid, over.productId ?? PRODUCT), body({ uid, ...over }));

async function adminRead(fn) {
  let result;
  await env.withSecurityRulesDisabled(async (ctx) => {
    result = await fn(ctx.firestore());
  });
  return result;
}

async function seedCustomer(uid, over = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(customerRef(ctx.firestore(), uid), { ...body({ uid, ...over }), createdAt: Timestamp.now() });
  });
}

describe('signed-in customer', () => {
  it('can register interest, and the saved document is correct', async () => {
    await assertSucceeds(customerWrite('alice'));
    const saved = await adminRead(async (db) => (await getDoc(customerRef(db, 'alice'))).data());
    assert.equal(saved.uid, 'alice');
    assert.equal(saved.productId, PRODUCT);
    assert.equal(saved.status, 'new');
    assert.equal(saved.consent, true);
    assert.equal(saved.quantity, 2);
  });

  it('works for a uid that contains underscores', async () => {
    await assertSucceeds(customerWrite('user_one'));
  });

  it('cannot register twice for the same product', async () => {
    await assertSucceeds(customerWrite('alice'));
    await assertFails(customerWrite('alice'));
  });

  it('can register for a different coming-soon product', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'products', 'orthoveda'), { status: 'coming_soon', name: 'Orthoveda' });
    });
    await assertSucceeds(customerWrite('alice'));
    await assertSucceeds(customerWrite('alice', { productId: 'orthoveda', productName: 'Orthoveda' }));
  });

  it('is rejected under the wrong document id or a mismatched uid field', async () => {
    const db = asUser('alice');
    await assertFails(setDoc(doc(db, 'preBookings', `bob_${PRODUCT}`), body({ uid: 'alice' })));
    await assertFails(setDoc(doc(db, 'preBookings', 'random-id'), body({ uid: 'alice' })));
    await assertFails(setDoc(customerRef(db, 'alice'), body({ uid: 'bob' })));
    await assertFails(setDoc(customerRef(db, 'alice'), body())); // uid field missing
  });

  it('cannot use the guest path while signed in', async () => {
    await assertFails(setDoc(guestRef(asUser('alice')), body()));
  });

  it('can read their own request, and a missing own request returns "not found"', async () => {
    await seedCustomer('alice');
    await assertSucceeds(getDoc(customerRef(asUser('alice'), 'alice')));
    const missing = await assertSucceeds(getDoc(customerRef(asUser('bob'), 'bob')));
    assert.equal(missing.exists(), false);
  });

  it('cannot read another customer\'s request, or probe their id', async () => {
    await seedCustomer('alice');
    await assertFails(getDoc(customerRef(asUser('bob'), 'alice')));
    await assertFails(getDoc(doc(asUser('bob'), 'preBookings', 'alice_orthoveda'))); // missing, not bob's prefix
  });

  it('underscore uids: "user" cannot read "user_one"\'s request', async () => {
    await seedCustomer('user_one');
    await assertFails(getDoc(customerRef(asUser('user'), 'user_one')));
    await assertSucceeds(getDoc(customerRef(asUser('user_one'), 'user_one')));
  });

  it('cannot list, update or delete', async () => {
    await seedCustomer('alice');
    await assertFails(getDocs(collection(asUser('alice'), 'preBookings')));
    await assertFails(updateDoc(customerRef(asUser('alice'), 'alice'), { quantity: 5 }));
    await assertFails(updateDoc(customerRef(asUser('alice'), 'alice'), { status: 'resolved' }));
    await assertFails(deleteDoc(customerRef(asUser('alice'), 'alice')));
  });
});

describe('guest', () => {
  it('can register interest with an auto id', async () => {
    const ref = guestRef(anon());
    await assertSucceeds(setDoc(ref, body()));
    const saved = await adminRead(async (db) => (await getDoc(doc(db, 'preBookings', ref.id))).data());
    assert.equal(saved.uid, undefined);
    assert.equal(saved.status, 'new');
  });

  it('cannot read, list, update or delete', async () => {
    const ref = guestRef(anon());
    await assertSucceeds(setDoc(ref, body()));
    await assertFails(getDoc(ref));
    await assertFails(getDocs(collection(anon(), 'preBookings')));
    await assertFails(updateDoc(ref, { quantity: 9 }));
    await assertFails(deleteDoc(ref));
  });

  it('cannot add a uid, pick their own id, or reuse a customer-style id', async () => {
    await assertFails(setDoc(guestRef(anon()), body({ uid: 'alice' })));
    await assertFails(setDoc(doc(anon(), 'preBookings', 'custom'), body()));
    await assertFails(setDoc(doc(anon(), 'preBookings', `alice_${PRODUCT}`), body()));
  });

  it('retrying the same guest document (double click) cannot create a second request', async () => {
    const ref = guestRef(anon());
    await assertSucceeds(setDoc(ref, body()));
    await assertFails(setDoc(ref, body()));
  });
});

describe('request validation (guest and customer share it)', () => {
  const bad = async (over) => {
    await assertFails(setDoc(guestRef(anon()), body(over)));
    await assertFails(setDoc(customerRef(asUser('alice'), 'alice'), body({ uid: 'alice', ...over })));
  };

  it('rejects products that are not coming soon, or do not exist', async () => {
    await bad({ productId: 'shilajit-resin', productName: 'Himalayan Shilajit' });
    await bad({ productId: 'draft-one', productName: 'Draft One' });
    await bad({ productId: 'no-such-product', productName: 'Nothing' });
  });

  it('rejects a productName that does not match the product', async () => {
    await bad({ productName: 'Something Else' });
  });

  it('rejects invalid name, phone, quantity and timing', async () => {
    await bad({ fullName: 'A' });
    await bad({ fullName: 'x'.repeat(81) });
    await bad({ phone: '12345' });
    await bad({ phone: 'abcdefghij' });
    await bad({ phone: '+1234567890123456' });
    await bad({ quantity: 0 });
    await bad({ quantity: 21 });
    await bad({ quantity: 1.5 });
    await bad({ quantity: '2' });
    await bad({ timing: 'whenever' });
  });

  it('rejects missing or false consent and a wrong status', async () => {
    await bad({ consent: false });
    await bad({ consent: 'yes' });
    await bad({ status: 'contacted' });
    await bad({ consentVersion: '' });
  });

  it('rejects client timestamps, missing fields and extra fields', async () => {
    await bad({ createdAt: Timestamp.now() });
    await bad({ extra: 'nope' });
    const { fullName, ...missing } = body();
    await assertFails(setDoc(guestRef(anon()), missing));
  });
});

describe('admin', () => {
  beforeEach(async () => {
    await seedCustomer('alice');
  });

  it('can read and list requests', async () => {
    await assertSucceeds(getDoc(customerRef(asAdmin(), 'alice')));
    const snap = await assertSucceeds(getDocs(collection(asAdmin(), 'preBookings')));
    assert.equal(snap.size, 1);
  });

  it('can change the status, and nothing else', async () => {
    const ref = customerRef(asAdmin(), 'alice');
    await assertSucceeds(updateDoc(ref, { status: 'contacted', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(ref, { status: 'resolved' }));
    await assertFails(updateDoc(ref, { status: 'bogus' }));
    await assertFails(updateDoc(ref, { phone: '+911111111111' }));
    await assertFails(updateDoc(ref, { fullName: 'Someone Else' }));
    await assertFails(updateDoc(ref, { status: 'new', updatedAt: Timestamp.now() }));
  });

  it('can delete a request', async () => {
    await assertSucceeds(deleteDoc(customerRef(asAdmin(), 'alice')));
  });

  it('a customer is not an admin', async () => {
    await assertFails(getDocs(collection(asUser('alice'), 'preBookings')));
  });
});

describe('unrelated rules still behave (smoke)', () => {
  it('products: customers still see only available / coming-soon', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'products', PRODUCT)));
    await assertFails(getDoc(doc(anon(), 'products', 'draft-one')));
  });

  it('inquiries: anyone can create, only admins read', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'inquiries', 'i1'), { message: 'hello' }));
    await assertFails(getDoc(doc(anon(), 'inquiries', 'i1')));
  });
});