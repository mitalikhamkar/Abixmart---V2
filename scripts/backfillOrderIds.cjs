/**
 * ONE-TIME MIGRATION — run manually, once, from a trusted machine.
 *
 * Backfills a permanent `orderId` (ABX-YYYYMMDD-XXXXX) onto any
 * `orders/*` documents created before this field existed.
 *
 * FIX (vs. the earlier version of this script): newer firebase-admin
 * releases (v11.6+, and especially v12+) restructured the package
 * around modular subpath exports — `firebase-admin/app` and
 * `firebase-admin/firestore` — instead of one flat `admin` namespace.
 * Requiring the old top-level `firebase-admin` package and reaching
 * for `admin.credential.cert(...)` can come back with `.credential`
 * undefined depending on the installed version's CJS interop, which
 * is exactly the "Cannot read properties of undefined (reading
 * 'cert')" error. Importing from the two subpaths below is the
 * version-stable way to do this and works the same whether you have
 * v11.6, v12, or v13 installed.
 *
 * WHY THIS ISN'T DONE FROM THE APP:
 * Production Firestore rules for `orders` are `allow update: false` —
 * customers (and the browser app itself) can never modify an existing
 * order once it's created, including to add this field. Only the
 * Firebase Admin SDK, running here with a service account,
 * legitimately bypasses security rules — so this script is the
 * correct place for the backfill, not client code, and the rules
 * never need to be loosened to make it possible.
 *
 * USAGE:
 *   node scripts/backfillOrderIds.cjs "C:\path\to\serviceAccountKey.json"
 *
 * Safe to re-run: it only touches documents that are still missing
 * `orderId`, and each such document is only ever assigned one. Orders
 * that already have an orderId are left completely untouched.
 */

const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const keyPath = process.argv[2];
if (!keyPath) {
  console.error('Usage: node scripts/backfillOrderIds.cjs <path-to-service-account-key.json>');
  process.exit(1);
}

const serviceAccount = require(path.resolve(keyPath));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Kept identical to the character set in src/lib/orderUtils.js —
// no 0/O/1/I, to avoid ambiguous-looking IDs.
const ORDER_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function generateOrderId(date) {
  const datePart = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += ORDER_ID_CHARS[Math.floor(Math.random() * ORDER_ID_CHARS.length)];
  }
  return `ABX-${datePart}-${suffix}`;
}

async function run() {
  const snap = await db.collection('orders').get();
  const legacy = snap.docs.filter((d) => !d.data().orderId);

  console.log(`Found ${snap.size} total order(s); ${legacy.length} missing orderId.`);

  if (legacy.length === 0) {
    console.log('Nothing to migrate.');
    return;
  }

  const seenThisRun = new Set();
  let batch = db.batch();
  let count = 0;

  for (const docSnap of legacy) {
    const data = docSnap.data();
    // Backdate the ID to when the order was actually placed, when we
    // know that — falls back to "today" only for the rare doc with no
    // createdAt at all.
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();

    let orderId;
    do {
      orderId = generateOrderId(createdAt);
    } while (seenThisRun.has(orderId));
    seenThisRun.add(orderId);

    batch.update(docSnap.ref, {
      orderId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    count += 1;

    // Firestore batches cap at 500 writes; commit in chunks of 400 to
    // stay comfortably under that.
    if (count % 400 === 0) {
      // eslint-disable-next-line no-await-in-loop
      await batch.commit();
      batch = db.batch();
      console.log(`Committed ${count}/${legacy.length}…`);
    }
  }

  await batch.commit();
  console.log(`Done. Backfilled orderId on ${count} legacy order(s).`);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
