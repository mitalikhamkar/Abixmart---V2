import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Separate, independently-named Firebase App pointed at the SAME project
// (identical config) as the customer app in `@/lib/firebase`. Firebase
// persists Auth sessions keyed by app name, so this app's `currentUser`
// and the customer app's `currentUser` are two completely independent
// sessions in the browser — logging into one never overwrites the other.
//
// IMPORTANT: this does NOT create a second Firebase project or a second
// user pool. An admin's uid, and the `admins/{uid}` document that
// authorizes them, are exactly the same as before. Only the *client-side
// session* is now isolated — server-side authorization via Firestore
// Rules is unaffected and unchanged.
const ADMIN_APP_NAME = 'abixmart-admin';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Guards against re-initializing during Vite HMR, same pattern as
// src/lib/firebase.js.
const adminApp = getApps().some((a) => a.name === ADMIN_APP_NAME)
  ? getApp(ADMIN_APP_NAME)
  : initializeApp(firebaseConfig, ADMIN_APP_NAME);

export const adminAuth = getAuth(adminApp);

// CRITICAL: Firestore requests are authenticated using whichever Auth
// instance belongs to the SAME Firebase App as the Firestore instance
// they were obtained from. `adminDb` below is bound to `adminApp`, so
// every read/write made through it carries the admin session's ID token.
//
// Any admin-side Firestore access — the admins/{uid} authorization
// check, and every admin dashboard section that reads/writes Firestore
// (Overview, Customers, Orders, Products, Inquiries, Analytics, etc.) —
// must import and use `adminDb` from this file, NOT the customer `db`
// exported from `@/lib/firebase`. Using the wrong `db` won't error
// loudly; it will just silently authenticate as the customer session (or
// no one), and Firestore Rules checking admins/{request.auth.uid} will
// reject the request.
export const adminDb = getFirestore(adminApp);

export default adminApp;