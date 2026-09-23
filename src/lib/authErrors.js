// Readable messages for the Firebase Auth error codes this app can hit.
// Anything unmapped falls back to a generic, still-friendly message.
export function mapAuthError(error) {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 8 characters).';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'abixmart/already-verified':
      return 'Your email is already verified.';
    case 'auth/quota-exceeded':
      return 'Email sending limit reached for now. Please try again later.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return "Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.";
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method. Try logging in with email and password instead.';
    case 'auth/invalid-action-code':
      return 'This link has expired or has already been used.';
    case 'auth/expired-action-code':
      return 'This link has expired. Please request a new one.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in isn\u2019t enabled for this project yet. Enable the Google provider in Firebase Console \u2192 Authentication \u2192 Sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain isn\u2019t authorized for sign-in yet. Add it under Firebase Console \u2192 Authentication \u2192 Settings \u2192 Authorized domains.';
    default:
      return `Something went wrong${code ? ` (${code})` : ''}. Please try again.`;
  }
}