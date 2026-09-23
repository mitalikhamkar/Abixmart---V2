import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { adminAuth, adminDb } from '@/admin/lib/adminFirebase';

// Uses its OWN secondary Firebase App/Auth instance (adminAuth) and its
// own Firestore instance bound to that app (adminDb) — see
// src/admin/lib/adminFirebase.js for why both matter. This context never
// touches the customer app's `auth`/`db` from `@/lib/firebase`, and never
// touches `users/{uid}`.
const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(adminDb, 'admins', firebaseUser.uid));
          setAdminData(snap.exists() ? snap.data() : null);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[ABIXMART Admin] admin doc check failed:', err?.code, err?.message);
          setAdminData(null);
        }
      } else {
        setAdminData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(adminAuth, email, password);
    const snap = await getDoc(doc(adminDb, 'admins', credential.user.uid));
    if (!snap.exists()) {
      // Not an admin account — sign out of the ADMIN session only. This
      // never touches the customer app's Auth instance, so a customer
      // session (if any) in the same browser is completely unaffected.
      await signOut(adminAuth);
      throw Object.assign(new Error('This account does not have admin access.'), {
        code: 'abixmart/not-admin',
      });
    }
    return credential.user;
  }, []);

  const logout = useCallback(() => signOut(adminAuth), []);
  const resetPassword = useCallback((email) => sendPasswordResetEmail(adminAuth, email), []);

  const value = {
    user,
    adminData,
    isAdmin: Boolean(user && adminData),
    loading,
    login,
    logout,
    resetPassword,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return ctx;
}