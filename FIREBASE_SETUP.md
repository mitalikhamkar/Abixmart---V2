# Firebase Setup Guide — ABIXMART

This covers everything you need to do manually in the Firebase Console.
Everything on the code side is already implemented — this file is only
about the Firebase project itself.

---

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**.
3. Name it something like `abixmart` or `abixmart-prod`.
4. You can disable Google Analytics for this project — it's not needed
   for authentication/Firestore and can always be added later.
5. Click **Create project** and wait for it to finish provisioning.

## 2. Register the ABIXMART web app

1. On the project's Overview page, click the **Web (`</>`)** icon to add
   a web app.
2. Give it a nickname, e.g. "ABIXMART Web".
3. You do **not** need "Also set up Firebase Hosting" checked unless you
   plan to deploy via Firebase Hosting — leave it unchecked if you're
   deploying elsewhere (Vercel/Netlify/etc.).
4. Click **Register app**. Firebase will show you a `firebaseConfig`
   object — keep this page open, you'll need the values in Step 9.

## 3. Enable Authentication

1. In the left sidebar, go to **Build → Authentication**.
2. Click **Get started**.

## 4. Enable Email/Password sign-in

1. In Authentication, go to the **Sign-in method** tab.
2. Click **Email/Password**.
3. Toggle it **Enabled**.
4. Leave "Email link (passwordless sign-in)" **off** — not used here.
5. Save.

## 5. Do you need any other sign-in provider right now?

**No.** This milestone only implements Email/Password. Don't enable
Google/Phone/etc. yet — each one adds setup steps (OAuth consent
screens, SHA certificates for phone auth, etc.) that aren't needed until
you actually build that feature. Add them later when you're ready.

## 6. Create Cloud Firestore

1. In the left sidebar, go to **Build → Firestore Database**.
2. Click **Create database**.

## 7. Which mode should you choose — production or test?

Choose **Production mode**.

Why: Production mode starts with "deny all" rules, which is the safe
default — nothing is readable/writable until you explicitly allow it via
Security Rules (which you'll deploy in Step 15 below). Test mode starts
fully open to anyone for 30 days, which is not appropriate even for a
prototype that has real user data — you already have real auth users at
this point, so their data should be protected from day one.

3. Pick a Firestore location close to your users (e.g. an `asia-south1`
   region if most customers are in India). This cannot be changed later,
   so choose deliberately.

## 8. Where to find the Web App configuration

Project settings (gear icon, top-left, next to "Project Overview") →
**General** tab → scroll to **"Your apps"** → click your web app → you'll
see the `firebaseConfig` object with `apiKey`, `authDomain`,
`projectId`, `storageBucket`, `messagingSenderId`, `appId`.

## 9. Which values go into environment variables

Copy `.env.example` to a new file named `.env` in the project root, then
fill in each value from the `firebaseConfig` object:

```
VITE_FIREBASE_API_KEY=<apiKey>
VITE_FIREBASE_AUTH_DOMAIN=<authDomain>
VITE_FIREBASE_PROJECT_ID=<projectId>
VITE_FIREBASE_STORAGE_BUCKET=<storageBucket>
VITE_FIREBASE_MESSAGING_SENDER_ID=<messagingSenderId>
VITE_FIREBASE_APP_ID=<appId>
```

## 10. `.env` file structure (already matches this project's setup)

The project uses Vite, so environment variables **must** be prefixed
with `VITE_` to be exposed to the frontend code — this is already
reflected in `.env.example` and in `src/lib/firebase.js`. `.env` is
already listed in `.gitignore` (with `.env.example` explicitly
un-ignored so the template itself stays in version control).

## 11. Exact variables needed

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

That's all six — nothing else is required for this milestone.

## 12. Never put Admin SDK credentials in the frontend

The values above are the **public Web SDK config** — safe to ship in a
browser bundle; Firebase is designed for this, and protection comes from
Security Rules, not secrecy of these values.

The **Firebase Admin SDK** (a service-account JSON key, used for
privileged server-side operations like bulk user management or bypassing
Security Rules) is completely different and must **never** be added to
this project, committed to git, or shipped to the browser. It only
belongs in a trusted server/Cloud Function environment, which does not
exist yet in this milestone.

## 13. Authorized Domains

1. Authentication → **Settings** tab → **Authorized domains**.
2. `localhost` is included by default — this covers local development
   (`npm run dev`).
3. When you deploy (Vercel/Netlify/Firebase Hosting/your own domain),
   add that production domain here too (e.g. `abixmart.com` and/or
   `www.abixmart.com`), or email verification / password reset links and
   any future OAuth sign-in will fail on that domain.

## 14. How to deploy Firestore Security Rules

Easiest path (no Firebase CLI needed):

1. Firestore Database → **Rules** tab.
2. Paste in the rules from Step 15 below, replacing what's there.
3. Click **Publish**.

(If you later set up the Firebase CLI for other reasons, you can instead
keep rules in a `firestore.rules` file and run `firebase deploy --only
firestore:rules` — either approach produces the same result.)

## 15. Initial Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

What this does:
- A signed-in user can read and write **only their own**
  `users/{their-own-uid}` document.
- No one (including other signed-in users) can read or write anyone
  else's profile.
- Nothing outside `/users/{uid}` is allowed at all — there's nothing
  else in the database yet.

**What's needed later for real admin functionality:** these rules give
zero users elevated access — there is currently no concept of an "admin"
in Firestore or Auth. When you build an admin dashboard, you'll need
either (a) a custom claim set via the Admin SDK (`isAdmin: true` on the
Auth token, checked in rules via `request.auth.token.isAdmin == true`),
or (b) a server-side function (Cloud Function) that performs privileged
operations using the Admin SDK, never trusting the frontend alone to
decide who's an admin. Don't build "if user.role === 'admin'" checks
only in frontend React code — that is not real security, since Security
Rules (not frontend code) are what actually protect the database.

## 16. How to test Authentication and Firestore

1. Run the app locally (`npm run dev`), go to `/create-account`, and
   register a test account.
2. In Firebase Console → **Authentication → Users**, confirm the new
   user appears with the right email.
3. In Firebase Console → **Firestore Database → Data**, confirm a
   `users/{uid}` document was created with `fullName`, `phone`, `email`,
   `emailVerified: false`, `createdAt`, `lastLoginAt`.
4. Check the test account's inbox for the verification email; click the
   link.
5. Back in the app, on `/account`, click **"I've Verified"** to refresh
   the state — it should switch to "Verified".
6. Log out, then log back in on `/login` — confirm it succeeds and
   `lastLoginAt` updates in Firestore.
7. Try `/forgot-password` with that email and confirm the reset email
   arrives.