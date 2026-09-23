import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { adminDb as db } from '@/admin/lib/adminFirebase';

// Generic realtime Firestore collection hook for the admin app. Always
// reflects live data — never mock/fake data, per the admin brief.
//
// IMPORTANT: `db` here is `adminDb` from `@/admin/lib/adminFirebase`,
// bound to the admin app's own isolated Firebase Auth session — NOT the
// customer `db` from `@/lib/firebase`. Every onSnapshot listener below
// carries the admin session's ID token, so Firestore Rules checking
// admins/{request.auth.uid} authorize it correctly. If this ever gets
// changed back to import `db` from `@/lib/firebase`, every admin section
// (Overview, Customers, Orders, Products, Inquiries, Analytics,
// CustomerActivity, Acquisition, ProductPerformance, Community) silently
// breaks — reads get rejected by the admin authorization rule.
export function useAdminCollection(collectionName, { orderByField, direction = 'desc' } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const ref = collection(db, collectionName);
    const q = orderByField ? query(ref, orderBy(orderByField, direction)) : ref;

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        // eslint-disable-next-line no-console
        console.error(`[ABIXMART Admin] ${collectionName} listener failed:`, err?.code, err?.message);
        setError(err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [collectionName, orderByField, direction]);

  return { data, loading, error };
}