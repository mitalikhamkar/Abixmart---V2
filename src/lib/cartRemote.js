// src/lib/cartRemote.js
//
// The only place the cart touches Firestore. Same collection and document as
// before: carts/{uid}. Firestore rules are unchanged (owner-only read/write).
//
// read()  never creates anything and returns { exists: false } for a missing
//         document. It throws on failure, and the cart store treats a thrown
//         read as "do not write anything".
// write() replaces the user's own cart document.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const cartRemote = {
  async read(uid) {
    const snap = await getDoc(doc(db, 'carts', uid));
    if (!snap.exists()) return { exists: false, version: 2, items: [] };
    const data = snap.data();
    return {
      exists: true,
      version: data.version === 2 ? 2 : 1,
      items: Array.isArray(data.items) ? data.items : [],
    };
  },

  async write(uid, lines) {
    await setDoc(doc(db, 'carts', uid), {
      version: 2,
      items: lines.map((l) => ({ id: l.id, jars: l.jars })),
      updatedAt: serverTimestamp(),
    });
  },
};