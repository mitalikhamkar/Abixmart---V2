import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// productNotifications/{uid}_{productId} — deterministic doc ID doubles as
// the duplicate-prevention mechanism: writing twice to the same ID just
// overwrites, so no query/list permission is needed to check "already
// subscribed," only a single get() on a predictable path.
export function notifyDocId(uid, productId) {
  return `${uid}_${productId}`;
}

export async function checkNotifySubscribed(uid, productId) {
  const snap = await getDoc(doc(db, 'productNotifications', notifyDocId(uid, productId)));
  return snap.exists();
}

export async function subscribeToNotify(uid, email, productId, productName) {
  await setDoc(doc(db, 'productNotifications', notifyDocId(uid, productId)), {
    uid,
    email,
    productId,
    productName,
    source: 'shop-page',
    createdAt: serverTimestamp(),
    status: 'pending',
    notifiedAt: null,
  });
}