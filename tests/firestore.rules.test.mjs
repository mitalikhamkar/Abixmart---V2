// tests/firestore.rules.test.mjs
//
// Firestore Emulator tests for the reviews area of firestore.rules.
//
// Run from the project root (needs Java on PATH for the emulator):
//   npm install --save-dev @firebase/rules-unit-testing
//   npx firebase emulators:exec --only firestore --project demo-abixmart-rules "node --test tests/firestore.rules.test.mjs"
//
// Nothing here touches your real Firebase project: the "demo-" project id
// keeps everything inside the local emulator.

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
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';


const PRODUCT = 'shilajit-resin';
const PROJECT_ID = 'demo-abixmart-rules';
const RULES_PATH = 'firestore.rules';
let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync(RULES_PATH, 'utf8'),
    },
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
    await setDoc(doc(db, 'products', PRODUCT), { status: 'available' });
    await setDoc(doc(db, 'products', 'orthoveda'), { status: 'coming_soon' });
  });
});

// ── helpers ─────────────────────────────────────────────────────────

const asUser = (uid) => env.authenticatedContext(uid).firestore();
const asAdmin = () => asUser('admin1');
const anon = () => env.unauthenticatedContext().firestore();

const ownerDocId = (uid, productId = PRODUCT) => `${uid}_${productId}`;

// Mirrors the new-review path of submitReview() in src/lib/reviewService.js:
// ONE batch containing the public review and the private owner record.
async function submitNew(db, uid, over = {}) {
  const { productId = PRODUCT, rating = 5, text = 'A genuinely lovely product.', displayName = 'Test U.' } = over;
  const reviewRef = doc(collection(db, 'reviews'));
  const ownerRef = doc(db, 'reviewOwners', ownerDocId(uid, productId));
  const batch = writeBatch(db);
  batch.set(reviewRef, {
    productId,
    displayName,
    rating,
    text,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(ownerRef, { uid, productId, reviewId: reviewRef.id, createdAt: serverTimestamp() });
  await batch.commit();
  return reviewRef.id;
}

// Mirrors the edit path of submitReview(): a plain update, no owner write.
// The write always carries featured: false, so editing a featured review
// clears the flag (the rules reject any edit that would leave it true).
const editReview = (db, id, over = {}) =>
  updateDoc(doc(db, 'reviews', id), {
    rating: 3,
    text: 'Edited review text here.',
    displayName: 'Test U.',
    status: 'pending',
    featured: false,
    updatedAt: serverTimestamp(),
    ...over,
  });

// Mirrors moderate() in src/admin/sections/Reviews.jsx (review + audit in one batch).
async function moderate(db, adminUid, id, changes, action) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'reviews', id), {
    ...changes,
    updatedAt: serverTimestamp(),
    moderatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'reviewModeration', id), {
    reviewId: id,
    lastAction: action,
    moderatedBy: adminUid,
    moderatedAt: serverTimestamp(),
  });
  await batch.commit();
}

// Direct review update, for testing individual field rules.
const rawModerate = (db, id, fields) => updateDoc(doc(db, 'reviews', id), fields);

async function seedReview(id, ownerUid, data = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const productId = data.productId ?? PRODUCT;
    await setDoc(doc(db, 'reviews', id), {
      productId,
      displayName: 'Seed S.',
      rating: 4,
      text: 'Seeded review text here.',
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...data,
    });
    if (ownerUid) {
      await setDoc(doc(db, 'reviewOwners', ownerDocId(ownerUid, productId)), {
        uid: ownerUid,
        productId,
        reviewId: id,
        createdAt: Timestamp.now(),
      });
    }
  });
}

// withSecurityRulesDisabled() resolves to undefined (it does not return the
// callback's value), so the result is captured in a closure and returned here.
async function adminRead(fn) {
  let result;
  await env.withSecurityRulesDisabled(async (ctx) => {
    result = await fn(ctx.firestore());
  });
  return result;
}

// ── valid submission ────────────────────────────────────────────────

describe('customer submission (atomic batch)', () => {
  it('creates a pending review and the owner record together', async () => {
    const id = await assertSucceeds(submitNew(asUser('alice'), 'alice'));
    const { review, owner } = await adminRead(async (db) => ({
      review: (await getDoc(doc(db, 'reviews', id))).data(),
      owner: (await getDoc(doc(db, 'reviewOwners', ownerDocId('alice')))).data(),
    }));
    assert.equal(review.status, 'pending');
    assert.equal(review.uid, undefined, 'public review must not contain a uid');
    assert.equal(owner.uid, 'alice');
    assert.equal(owner.reviewId, id);
  });

  it('works for a uid that contains underscores', async () => {
    await assertSucceeds(submitNew(asUser('user_one'), 'user_one'));
  });

  it('is rejected when signed out', async () => {
    await assertFails(submitNew(anon(), 'alice'));
  });

  it('is rejected for a coming-soon or unknown product', async () => {
    await assertFails(submitNew(asUser('alice'), 'alice', { productId: 'orthoveda' }));
    await assertFails(submitNew(asUser('alice'), 'alice', { productId: 'no-such-product' }));
  });

  it('rejects invalid ratings and text', async () => {
    await assertFails(submitNew(asUser('alice'), 'alice', { rating: 0 }));
    await assertFails(submitNew(asUser('alice'), 'alice', { rating: 6 }));
    await assertFails(submitNew(asUser('alice'), 'alice', { rating: 4.5 }));
    await assertFails(submitNew(asUser('alice'), 'alice', { text: 'too short' }));
    await assertFails(submitNew(asUser('alice'), 'alice', { text: 'x'.repeat(1001) }));
  });

  it('rejects a review written without its owner record', async () => {
    const db = asUser('alice');
    await assertFails(
      setDoc(doc(collection(db, 'reviews')), {
        productId: PRODUCT,
        displayName: 'Test U.',
        rating: 5,
        text: 'A genuinely lovely product.',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    );
  });

  it('rejects an owner record written without a review', async () => {
    const db = asUser('alice');
    await assertFails(
      setDoc(doc(db, 'reviewOwners', ownerDocId('alice')), {
        uid: 'alice',
        productId: PRODUCT,
        reviewId: 'does-not-exist',
        createdAt: serverTimestamp(),
      })
    );
  });

  it('rejects status other than pending, a uid field, and featured on create', async () => {
    for (const extra of [{ status: 'approved' }, { uid: 'alice' }, { featured: true }]) {
      const db = asUser('alice');
      const reviewRef = doc(collection(db, 'reviews'));
      const batch = writeBatch(db);
      batch.set(reviewRef, {
        productId: PRODUCT,
        displayName: 'Test U.',
        rating: 5,
        text: 'A genuinely lovely product.',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...extra,
      });
      batch.set(doc(db, 'reviewOwners', ownerDocId('alice')), {
        uid: 'alice',
        productId: PRODUCT,
        reviewId: reviewRef.id,
        createdAt: serverTimestamp(),
      });
      await assertFails(batch.commit());
    }
  });

  it('enforces one review per customer per product', async () => {
    await assertSucceeds(submitNew(asUser('alice'), 'alice'));
    await assertFails(submitNew(asUser('alice'), 'alice'));
  });
});

// ── ownership claims ────────────────────────────────────────────────

describe('one customer cannot claim or edit another customer\'s review', () => {
  beforeEach(async () => {
    await seedReview('rev-alice', 'alice', { status: 'approved' });
  });

  it('cannot create an owner record that points at an existing review', async () => {
    const db = asUser('bob');
    await assertFails(
      setDoc(doc(db, 'reviewOwners', ownerDocId('bob')), {
        uid: 'bob',
        productId: PRODUCT,
        reviewId: 'rev-alice',
        createdAt: serverTimestamp(),
      })
    );
  });

  it('cannot do it inside a batch that also creates a different new review', async () => {
    const db = asUser('bob');
    const newRef = doc(collection(db, 'reviews'));
    const batch = writeBatch(db);
    batch.set(newRef, {
      productId: PRODUCT,
      displayName: 'Bob B.',
      rating: 5,
      text: 'Bob writes a real review.',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'reviewOwners', ownerDocId('bob')), {
      uid: 'bob',
      productId: PRODUCT,
      reviewId: 'rev-alice',
      createdAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });

  it('cannot create an owner record under alice\'s id', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore(), 'reviewOwners', ownerDocId('alice')));
    });
    const db = asUser('bob');
    await assertFails(
      setDoc(doc(db, 'reviewOwners', ownerDocId('alice')), {
        uid: 'bob',
        productId: PRODUCT,
        reviewId: 'rev-alice',
        createdAt: serverTimestamp(),
      })
    );
  });

  it('cannot edit alice\'s review', async () => {
    await assertFails(editReview(asUser('bob'), 'rev-alice'));
  });

  it('cannot read alice\'s pending review or her owner record, or delete either', async () => {
    await seedReview('rev-alice-2', 'alice', { productId: 'other', status: 'pending' });
    await assertFails(getDoc(doc(asUser('bob'), 'reviews', 'rev-alice-2')));
    await assertFails(getDoc(doc(asUser('bob'), 'reviewOwners', ownerDocId('alice'))));
    await assertFails(deleteDoc(doc(asUser('bob'), 'reviewOwners', ownerDocId('alice'))));
    await assertFails(deleteDoc(doc(asUser('bob'), 'reviews', 'rev-alice')));
  });

  it('cannot read a missing owner record under another customer\'s id', async () => {
    await assertFails(getDoc(doc(asUser('bob'), 'reviewOwners', ownerDocId('carol'))));
  });

  it('underscore uids: "user" cannot read or edit "user_one"\'s review', async () => {
    await seedReview('rev-u1', 'user_one', { status: 'pending' });
    await assertFails(getDoc(doc(asUser('user'), 'reviewOwners', ownerDocId('user_one'))));
    await assertFails(getDoc(doc(asUser('user'), 'reviews', 'rev-u1')));
    await assertFails(editReview(asUser('user'), 'rev-u1'));
    await assertSucceeds(getDoc(doc(asUser('user_one'), 'reviewOwners', ownerDocId('user_one'))));
    await assertSucceeds(editReview(asUser('user_one'), 'rev-u1'));
  });
});

// ── customer editing ────────────────────────────────────────────────

describe('customer editing', () => {
  it('edits a pending review without touching the owner record', async () => {
    const id = await submitNew(asUser('alice'), 'alice');
    const before = await adminRead(async (db) => (await getDocs(collection(db, 'reviewOwners'))).size);
    await assertSucceeds(editReview(asUser('alice'), id));
    const after = await adminRead(async (db) => (await getDocs(collection(db, 'reviewOwners'))).size);
    assert.equal(before, 1);
    assert.equal(after, 1, 'an edit must not create a second owner record');
    const owner = await adminRead(async (db) => (await getDoc(doc(db, 'reviewOwners', ownerDocId('alice')))).data());
    assert.equal(owner.reviewId, id);
  });

  it('sends an approved review back to pending', async () => {
    await seedReview('r1', 'alice', { status: 'approved' });
    await assertSucceeds(editReview(asUser('alice'), 'r1'));
    const status = await adminRead(async (db) => (await getDoc(doc(db, 'reviews', 'r1'))).data().status);
    assert.equal(status, 'pending');
  });

  it('cannot edit rejected or hidden reviews', async () => {
    await seedReview('r-rej', 'alice', { status: 'rejected', productId: 'p-a' });
    await seedReview('r-hid', 'alice', { status: 'hidden', productId: 'p-b' });
    await assertFails(editReview(asUser('alice'), 'r-rej'));
    await assertFails(editReview(asUser('alice'), 'r-hid'));
  });

  it('cannot self-approve, self-feature, change product, or set a uid', async () => {
    await seedReview('r1', 'alice', { status: 'pending' });
    await assertFails(editReview(asUser('alice'), 'r1', { status: 'approved' }));
    await assertFails(editReview(asUser('alice'), 'r1', { featured: true }));
    await assertFails(editReview(asUser('alice'), 'r1', { productId: 'orthoveda' }));
    await assertFails(editReview(asUser('alice'), 'r1', { uid: 'alice' }));
    await assertFails(editReview(asUser('alice'), 'r1', { updatedAt: Timestamp.now() }));
  });

  it('cannot delete their own review; an admin can, then the stale owner record can be cleared', async () => {
    const id = await submitNew(asUser('alice'), 'alice');
    await assertFails(deleteDoc(doc(asUser('alice'), 'reviews', id)));
    // owner record cannot be cleared while the review still exists
    await assertFails(deleteDoc(doc(asUser('alice'), 'reviewOwners', ownerDocId('alice'))));
    await assertSucceeds(deleteDoc(doc(asAdmin(), 'reviews', id)));
    await assertSucceeds(deleteDoc(doc(asUser('alice'), 'reviewOwners', ownerDocId('alice'))));
    await assertSucceeds(submitNew(asUser('alice'), 'alice'));
  });
});

// ── featured flag and customer edits ────────────────────────────────

describe('customer edits never keep or set featured', () => {
  // Same payload as editReview(), but with NO featured key, for the cases
  // where the omission itself is what is being tested.
  const editWithoutFeatured = (db, id) =>
    updateDoc(doc(db, 'reviews', id), {
      rating: 3,
      text: 'Edited review text here.',
      displayName: 'Test U.',
      status: 'pending',
      updatedAt: serverTimestamp(),
    });

  const readReview = (id) => adminRead(async (db) => (await getDoc(doc(db, 'reviews', id))).data());

  const publicFeaturedList = () =>
    getDocs(
      query(collection(anon(), 'reviews'), where('status', '==', 'approved'), where('featured', '==', true))
    );

  it('editing a featured approved review sends it back to pending and clears featured', async () => {
    await seedReview('r-feat', 'alice', { status: 'approved', featured: true });
    await assertSucceeds(editReview(asUser('alice'), 'r-feat'));
    const review = await readReview('r-feat');
    assert.equal(review.status, 'pending');
    assert.equal(review.featured, false);
    assert.equal(review.text, 'Edited review text here.');
  });

  it('rejects an edit of a featured review that would leave featured set', async () => {
    await seedReview('r-feat', 'alice', { status: 'approved', featured: true });
    // featured omitted: the stored true would survive the edit
    await assertFails(editWithoutFeatured(asUser('alice'), 'r-feat'));
    // featured explicitly kept true
    await assertFails(editReview(asUser('alice'), 'r-feat', { featured: true }));
    // nothing changed by the failed attempts
    const untouched = await readReview('r-feat');
    assert.equal(untouched.status, 'approved');
    assert.equal(untouched.featured, true);
    // the compliant edit still works
    await assertSucceeds(editReview(asUser('alice'), 'r-feat'));
  });

  it('accepts only the boolean false for featured', async () => {
    await seedReview('r1', 'alice', { status: 'approved', featured: true });
    for (const bad of [null, 'false', 0, 1, 'true']) {
      await assertFails(editReview(asUser('alice'), 'r1', { featured: bad }));
    }
    await assertSucceeds(editReview(asUser('alice'), 'r1', { featured: false }));
  });

  it('an edited featured review leaves the public featured list and is not re-featured when re-approved', async () => {
    await seedReview('r-feat', 'alice', { status: 'approved', featured: true });
    const before = await assertSucceeds(publicFeaturedList());
    assert.deepEqual(before.docs.map((d) => d.id), ['r-feat']);

    await assertSucceeds(editReview(asUser('alice'), 'r-feat'));
    const whilePending = await assertSucceeds(publicFeaturedList());
    assert.equal(whilePending.size, 0, 'a pending review must not appear in the featured list');

    // An admin approving the edited text must not silently bring the flag back.
    await assertSucceeds(moderate(asAdmin(), 'admin1', 'r-feat', { status: 'approved' }, 'approved'));
    const afterApproval = await assertSucceeds(publicFeaturedList());
    assert.equal(afterApproval.size, 0, 'approval must not re-feature edited text');
    const review = await readReview('r-feat');
    assert.equal(review.status, 'approved');
    assert.equal(review.featured, false);

    // Featuring it again remains an explicit admin action.
    await assertSucceeds(moderate(asAdmin(), 'admin1', 'r-feat', { featured: true }, 'featured'));
    const refeatured = await assertSucceeds(publicFeaturedList());
    assert.deepEqual(refeatured.docs.map((d) => d.id), ['r-feat']);
  });

  it('clears a leftover featured flag on a pending review when its owner edits it', async () => {
    // Defensive: data written before this rule existed could be pending + featured.
    await seedReview('r-old', 'alice', { status: 'pending', featured: true });
    await assertFails(editWithoutFeatured(asUser('alice'), 'r-old'));
    await assertSucceeds(editReview(asUser('alice'), 'r-old'));
    const review = await readReview('r-old');
    assert.equal(review.status, 'pending');
    assert.equal(review.featured, false);
  });

  it('still allows an edit that omits featured when the review is not featured', async () => {
    await seedReview('r-plain', 'alice', { status: 'approved' });
    await assertSucceeds(editWithoutFeatured(asUser('alice'), 'r-plain'));
    const review = await readReview('r-plain');
    assert.equal(review.status, 'pending');
    assert.equal(review.featured, undefined);
  });

  it('another customer cannot clear or change featured on alice\'s review', async () => {
    await seedReview('r-feat', 'alice', { status: 'approved', featured: true });
    await assertFails(editReview(asUser('bob'), 'r-feat'));
    await assertFails(rawModerate(asUser('bob'), 'r-feat', { featured: false, updatedAt: serverTimestamp() }));
    const review = await readReview('r-feat');
    assert.equal(review.status, 'approved');
    assert.equal(review.featured, true);
  });
});

// ── public reads ────────────────────────────────────────────────────

describe('public reads', () => {
  beforeEach(async () => {
    await seedReview('a1', null, { status: 'approved' });
    await seedReview('p1', null, { status: 'pending' });
    await seedReview('r1', null, { status: 'rejected' });
    await seedReview('h1', null, { status: 'hidden' });
  });

  it('lists approved reviews only, signed out', async () => {
    const snap = await assertSucceeds(
      getDocs(query(collection(anon(), 'reviews'), where('status', '==', 'approved')))
    );
    assert.deepEqual(snap.docs.map((d) => d.id), ['a1']);
  });

  it('can filter approved reviews by product', async () => {
    await assertSucceeds(
      getDocs(
        query(collection(anon(), 'reviews'), where('status', '==', 'approved'), where('productId', '==', PRODUCT))
      )
    );
  });

  it('refuses unfiltered lists and lists of pending/rejected/hidden', async () => {
    await assertFails(getDocs(collection(anon(), 'reviews')));
    for (const status of ['pending', 'rejected', 'hidden']) {
      await assertFails(getDocs(query(collection(anon(), 'reviews'), where('status', '==', status))));
    }
    await assertFails(getDocs(collection(asUser('alice'), 'reviews')));
  });

  it('reads an approved review but not pending, rejected or hidden ones', async () => {
    await assertSucceeds(getDoc(doc(anon(), 'reviews', 'a1')));
    for (const id of ['p1', 'r1', 'h1']) {
      await assertFails(getDoc(doc(anon(), 'reviews', id)));
    }
  });

  it('keeps owner records and the audit trail private', async () => {
    await assertFails(getDocs(collection(anon(), 'reviewOwners')));
    await assertFails(getDocs(collection(asUser('alice'), 'reviewOwners')));
    await assertFails(getDocs(collection(asUser('alice'), 'reviewModeration')));
    await assertFails(getDoc(doc(anon(), 'reviewModeration', 'a1')));
  });

  it('lets a customer read their own pending review and a missing own owner record', async () => {
    await seedReview('mine', 'alice', { status: 'pending', productId: 'p-mine' });
    await assertSucceeds(getDoc(doc(asUser('alice'), 'reviews', 'mine')));
    const missing = await assertSucceeds(getDoc(doc(asUser('alice'), 'reviewOwners', ownerDocId('alice', 'no-review-yet'))));
    assert.equal(missing.exists(), false);
  });
});

// ── admin moderation ────────────────────────────────────────────────

describe('admin moderation', () => {
  it('approves, rejects and hides, writing the audit record', async () => {
    await seedReview('r1', 'alice', { status: 'pending' });
    await assertSucceeds(moderate(asAdmin(), 'admin1', 'r1', { status: 'approved' }, 'approved'));
    await assertSucceeds(moderate(asAdmin(), 'admin1', 'r1', { status: 'hidden', featured: false }, 'hidden'));
    await assertSucceeds(moderate(asAdmin(), 'admin1', 'r1', { status: 'rejected', featured: false }, 'rejected'));
    const { review, audit } = await adminRead(async (db) => ({
      review: (await getDoc(doc(db, 'reviews', 'r1'))).data(),
      audit: (await getDoc(doc(db, 'reviewModeration', 'r1'))).data(),
    }));
    assert.equal(review.status, 'rejected');
    assert.equal(review.moderatedBy, undefined, 'moderatedBy must not be on the public review');
    assert.equal(audit.moderatedBy, 'admin1');
  });

  it('features and unfeatures an approved review', async () => {
    await seedReview('r1', 'alice', { status: 'approved' });
    await assertSucceeds(moderate(asAdmin(), 'admin1', 'r1', { featured: true }, 'featured'));
    await assertSucceeds(moderate(asAdmin(), 'admin1', 'r1', { featured: false }, 'unfeatured'));
  });

  it('cannot feature a pending, rejected or hidden review', async () => {
    await seedReview('r-p', 'alice', { status: 'pending', productId: 'p-a' });
    await seedReview('r-r', 'alice', { status: 'rejected', productId: 'p-b' });
    await seedReview('r-h', 'alice', { status: 'hidden', productId: 'p-c' });
    for (const id of ['r-p', 'r-r', 'r-h']) {
      await assertFails(rawModerate(asAdmin(), id, { featured: true, updatedAt: serverTimestamp(), moderatedAt: serverTimestamp() }));
    }
  });

  it('cannot reject or hide a featured review without clearing featured', async () => {
    await seedReview('r1', 'alice', { status: 'approved', featured: true });
    await assertFails(rawModerate(asAdmin(), 'r1', { status: 'rejected', updatedAt: serverTimestamp(), moderatedAt: serverTimestamp() }));
    await assertSucceeds(moderate(asAdmin(), 'admin1', 'r1', { status: 'rejected', featured: false }, 'rejected'));
  });

  it('cannot send a review back to pending or use an unknown status', async () => {
    await seedReview('r1', 'alice', { status: 'approved' });
    const ts = { updatedAt: serverTimestamp(), moderatedAt: serverTimestamp() };
    await assertFails(rawModerate(asAdmin(), 'r1', { status: 'pending', ...ts }));
    await assertFails(rawModerate(asAdmin(), 'r1', { status: 'published', ...ts }));
  });

  it('cannot change text, rating, productId, displayName, createdAt or moderatedBy', async () => {
    await seedReview('r1', 'alice', { status: 'approved' });
    const ts = { updatedAt: serverTimestamp(), moderatedAt: serverTimestamp() };
    await assertFails(rawModerate(asAdmin(), 'r1', { text: 'Admin rewrote this text.', ...ts }));
    await assertFails(rawModerate(asAdmin(), 'r1', { rating: 1, ...ts }));
    await assertFails(rawModerate(asAdmin(), 'r1', { productId: 'orthoveda', ...ts }));
    await assertFails(rawModerate(asAdmin(), 'r1', { displayName: 'Someone Else', ...ts }));
    await assertFails(rawModerate(asAdmin(), 'r1', { createdAt: serverTimestamp(), ...ts }));
    await assertFails(rawModerate(asAdmin(), 'r1', { moderatedBy: 'admin1', ...ts }));
    await assertFails(rawModerate(asAdmin(), 'r1', { uid: 'alice', ...ts }));
  });

  it('requires server timestamps and a boolean featured', async () => {
    await seedReview('r1', 'alice', { status: 'approved' });
    await assertFails(rawModerate(asAdmin(), 'r1', { featured: true, updatedAt: Timestamp.now(), moderatedAt: serverTimestamp() }));
    await assertFails(rawModerate(asAdmin(), 'r1', { featured: true, updatedAt: serverTimestamp(), moderatedAt: Timestamp.now() }));
    await assertFails(rawModerate(asAdmin(), 'r1', { featured: 'yes', updatedAt: serverTimestamp(), moderatedAt: serverTimestamp() }));
    await assertFails(rawModerate(asAdmin(), 'r1', { featured: true, updatedAt: serverTimestamp() })); // moderatedAt missing
  });

  it('non-admins cannot moderate, even the review\'s owner', async () => {
    await seedReview('r1', 'alice', { status: 'pending' });
    await assertFails(moderate(asUser('alice'), 'alice', 'r1', { status: 'approved' }, 'approved'));
    await assertFails(moderate(anon(), 'x', 'r1', { status: 'approved' }, 'approved'));
  });

  it('validates the audit record', async () => {
    await seedReview('r1', 'alice', { status: 'pending' });
    // another admin uid in moderatedBy
    await assertFails(moderate(asAdmin(), 'someone-else', 'r1', { status: 'approved' }, 'approved'));
    // unknown action
    await assertFails(moderate(asAdmin(), 'admin1', 'r1', { status: 'approved' }, 'whatever'));
    // customers cannot write audit records
    await assertFails(
      setDoc(doc(asUser('alice'), 'reviewModeration', 'r1'), {
        reviewId: 'r1',
        lastAction: 'approved',
        moderatedBy: 'alice',
        moderatedAt: serverTimestamp(),
      })
    );
  });

  it('admin can read every review and owner record', async () => {
    await seedReview('p1', 'alice', { status: 'pending' });
    await assertSucceeds(getDocs(collection(asAdmin(), 'reviews')));
    await assertSucceeds(getDocs(collection(asAdmin(), 'reviewOwners')));
  });
});

// ── unrelated rules still behave ────────────────────────────────────

describe('unrelated rules (smoke)', () => {
  it('inquiries: anyone can create, only admins read', async () => {
    await assertSucceeds(setDoc(doc(anon(), 'inquiries', 'i1'), { message: 'hello' }));
    await assertFails(getDoc(doc(anon(), 'inquiries', 'i1')));
    await assertSucceeds(getDoc(doc(asAdmin(), 'inquiries', 'i1')));
  });

  it('carts: only the owner can read or write', async () => {
    await assertSucceeds(setDoc(doc(asUser('alice'), 'carts', 'alice'), { items: [] }));
    await assertFails(getDoc(doc(asUser('bob'), 'carts', 'alice')));
  });

  it('products: customers see only available/coming-soon', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'products', 'draft-one'), { status: 'draft' });
    });
    await assertSucceeds(getDoc(doc(anon(), 'products', PRODUCT)));
    await assertFails(getDoc(doc(anon(), 'products', 'draft-one')));
  });
});
