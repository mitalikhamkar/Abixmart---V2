import { doc, runTransaction, updateDoc, serverTimestamp } from 'firebase/firestore';
import { adminDb } from '@/admin/lib/adminFirebase';

// Admin writes to Firestore `products/{productId}`. Always through `adminDb`
// (the admin session) so Firestore rules see an admin. Timestamps are server
// timestamps, never the browser clock.
//
// There is deliberately no delete: retire a product with archiveProduct().
// Past orders reference product IDs, so documents are never removed.

// Creates products/{productId}. Refuses (inside a transaction) if a
// document with that ID already exists, so nothing is ever overwritten.
export async function createProduct(productId, body) {
  const ref = doc(adminDb, 'products', productId);
  await runTransaction(adminDb, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      throw Object.assign(new Error('Product already exists'), { code: 'abixmart/product-exists' });
    }
    tx.set(ref, { ...body, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
}

// Updates the existing document only (updateDoc fails if it does not
// exist, so this can never create a second product). createdAt and the
// document ID are untouched.
export async function updateProduct(productId, body) {
  await updateDoc(doc(adminDb, 'products', productId), { ...body, updatedAt: serverTimestamp() });
}

export async function archiveProduct(productId) {
  await updateDoc(doc(adminDb, 'products', productId), { status: 'archived', updatedAt: serverTimestamp() });
}