import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  checkActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

const AuthContext = createContext(null);

function actionCodeSettings(path = '/auth/action') {
  return {
    url: `${window.location.origin}${path}`,
    handleCodeInApp: true,
  };
}

function buildGoogleProfilePatch(firebaseUser, existingProfile) {
  const patch = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    provider: 'google',
    emailVerified: true,
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (!existingProfile?.fullName) patch.fullName = firebaseUser.displayName || '';
  if (!existingProfile?.photoURL) patch.photoURL = firebaseUser.photoURL || '';
  if (existingProfile?.phone === undefined) patch.phone = '';

  // NEW: editable profile fields (Account page Edit Profile). Only set on
  // first-ever creation of this doc — an existing Google user's doc is
  // never overwritten with blanks, so any address info they've already
  // added via Edit Profile is preserved across every future Google login.
  if (!existingProfile) {
    patch.createdAt = serverTimestamp();
    patch.alternatePhone = '';
    patch.address = '';
    patch.city = '';
    patch.state = '';
    patch.pincode = '';
    patch.country = 'India';
  }

  return patch;
}

// NEW: checks the account is still real on Firebase's servers, not just
// locally cached. reload() forces a fresh round-trip; if the account was
// deleted from the Console, this throws auth/user-not-found or
// auth/user-disabled instead of silently succeeding against stale local
// state. Returns false (and signs out) if the session is stale.
async function verifyLiveSession(firebaseUser) {
  try {
    await firebaseUser.reload();
    return true;
  } catch (err) {
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/user-disabled') {
      // eslint-disable-next-line no-console
      console.warn('[ABIXMART] Stale session detected (account deleted/disabled server-side) — signing out.', err.code);
      await signOut(auth);
      return false;
    }
    // Any other error (e.g. network) — don't force a sign-out over a
    // transient failure; let the app continue with the cached session.
    // eslint-disable-next-line no-console
    console.error('[ABIXMART] Session verification failed (non-fatal):', err?.code, err?.message);
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const redirectHandledRef = useRef(false);
  const pendingProfileUidsRef = useRef(new Set());

  const loadProfile = useCallback(async (firebaseUser) => {
    const ref = doc(db, 'users', firebaseUser.uid);
    let snap = await getDoc(ref);

    if (!snap.exists() && pendingProfileUidsRef.current.has(firebaseUser.uid)) {
      for (let i = 0; i < 10 && pendingProfileUidsRef.current.has(firebaseUser.uid); i++) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      snap = await getDoc(ref);
    }

    if (snap.exists()) {
      return { ref, data: snap.data() };
    }

    // Missing profile doc for a live, signed-in Auth user. Before treating
    // this as "deleted account," check whether this uid is an admin (admin
    // accounts intentionally have no customer profile — see
    // src/admin/lib/AdminAuthContext.jsx).
    try {
      const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
      if (adminSnap.exists()) {
        return { ref, data: null };
      }
    } catch {
      // Fall through to normal handling below.
    }

    // eslint-disable-next-line no-console
    console.warn('[ABIXMART] No profile doc for signed-in user — signing out.', firebaseUser.uid);
    await signOut(auth);
    return { ref, data: null };
  }, []);

  const finishGoogleSignIn = useCallback(async (credential) => {
    const firebaseUser = credential.user;
    pendingProfileUidsRef.current.add(firebaseUser.uid);
    try {
      const ref = doc(db, 'users', firebaseUser.uid);
      const existingSnap = await getDoc(ref);
      const patch = buildGoogleProfilePatch(firebaseUser, existingSnap.exists() ? existingSnap.data() : null);
      await setDoc(ref, patch, { merge: true });
      return firebaseUser;
    } finally {
      pendingProfileUidsRef.current.delete(firebaseUser.uid);
    }
  }, []);

  useEffect(() => {
    if (!redirectHandledRef.current) {
      redirectHandledRef.current = true;
      getRedirectResult(auth)
        .then((result) => {
          if (result) return finishGoogleSignIn(result);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[ABIXMART] Google redirect sign-in failed:', err?.code, err?.message);
        });
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        const isLive = await verifyLiveSession(firebaseUser);
        if (!isLive) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const { data } = await loadProfile(firebaseUser);
          setProfile(data);
          if (data) {
            updateDoc(doc(db, 'users', firebaseUser.uid), { lastLoginAt: serverTimestamp() }).catch(() => {});
          }
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [loadProfile, finishGoogleSignIn]);

  const register = useCallback(async ({ fullName, phone, email, password }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    pendingProfileUidsRef.current.add(credential.user.uid);

    try {
      try {
        await updateProfile(credential.user, { displayName: fullName });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] updateProfile failed:', err?.code, err?.message);
      }

      try {
        await setDoc(doc(db, 'users', credential.user.uid), {
          uid: credential.user.uid,
          fullName,
          phone,
          email,
          photoURL: '',
          provider: 'password',
          emailVerified: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          // NEW: editable profile fields, initialized empty. Registration
          // itself still only requires Full Name / Phone / Email /
          // Password — these are just schema placeholders so every
          // customer doc has a consistent shape from day one, filled in
          // later via Edit Profile.
          alternatePhone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India',
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Firestore profile creation failed:', err?.code, err?.message, err);

        try {
          await credential.user.delete();
        } catch (deleteErr) {
          // eslint-disable-next-line no-console
          console.error(
            '[ABIXMART] Rollback delete after failed profile write also failed:',
            deleteErr?.code,
            deleteErr?.message
          );
        }

        throw Object.assign(new Error('profile-write-failed'), { code: 'abixmart/profile-write-failed', cause: err });
      }

      let verificationError = null;
      try {
        await sendEmailVerification(credential.user, actionCodeSettings());
      } catch (err) {
        verificationError = err;
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] sendEmailVerification failed:', err?.code, err?.message, err);
      }

      return { user: credential.user, verificationError };
    } finally {
      pendingProfileUidsRef.current.delete(credential.user.uid);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    try {
      await updateDoc(doc(db, 'users', credential.user.uid), { lastLoginAt: serverTimestamp() });
    } catch {
      // Non-fatal.
    }
    return credential.user;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await finishGoogleSignIn(result);
    } catch (err) {
      if (err?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  }, [finishGoogleSignIn]);

  const logout = useCallback(() => signOut(auth), []);

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user to verify.');
    }
    await auth.currentUser.reload();
    if (auth.currentUser.emailVerified) {
      throw Object.assign(new Error('Email already verified.'), { code: 'abixmart/already-verified' });
    }
    try {
      await sendEmailVerification(auth.currentUser, actionCodeSettings());
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] resend sendEmailVerification failed:', err?.code, err?.message, err);
      throw err;
    }
  }, []);

  const resetPassword = useCallback(
    (email) => sendPasswordResetEmail(auth, email, actionCodeSettings()),
    []
  );

  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setUser(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { emailVerified: true, updatedAt: serverTimestamp() });
        setProfile((prev) => (prev ? { ...prev, emailVerified: true } : prev));
      } catch {
        // Non-fatal.
      }
    }
    return auth.currentUser.emailVerified;
  }, []);

  const confirmEmailVerification = useCallback(async (oobCode) => {
    await checkActionCode(auth, oobCode);
    await applyActionCode(auth, oobCode);
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser(auth.currentUser);
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), { emailVerified: true, updatedAt: serverTimestamp() });
        setProfile((prev) => (prev ? { ...prev, emailVerified: true } : prev));
      } catch {
        // Non-fatal.
      }
    }
  }, []);

  const verifyResetCode = useCallback((oobCode) => verifyPasswordResetCode(auth, oobCode), []);

  const confirmReset = useCallback(
    (oobCode, newPassword) => confirmPasswordReset(auth, oobCode, newPassword),
    []
  );

  // NEW: updates the caller's own users/{uid} doc — never creates a new
  // document, never touches Firebase Auth's email (per requirement #5,
  // email stays Auth-owned and read-only in the UI). After the write,
  // re-reads the doc from Firestore rather than trusting the local
  // `updates` object, so `profile` always reflects the real persisted
  // server state, not an optimistic guess.
  const updateUserProfile = useCallback(async (updates) => {
    if (!auth.currentUser) {
      throw new Error('No signed-in user.');
    }
    const ref = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setProfile(snap.data());
      return snap.data();
    }
    return null;
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    register,
    login,
    loginWithGoogle,
    logout,
    resendVerification,
    resetPassword,
    refreshUser,
    confirmEmailVerification,
    verifyResetCode,
    confirmReset,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}