// src/lib/safeRedirect.js
//
// Validates a "where to go after sign-in" value taken from the URL.
// Returns the path when it is a safe same-site path, otherwise null.

export function safeRedirectPath(raw) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 500) return null;
  // Must be a site-relative path: one leading slash, never "//host" or "/\host".
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
  // No control characters.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  // Do not bounce between auth pages or into the admin area.
  if (/^\/(login|create-account|forgot-password|auth|admin)(\/|\?|#|$)/.test(raw)) return null;
  return raw;
}