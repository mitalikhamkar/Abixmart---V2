import React from 'react';

// A real Google-branded mark (not a generic "G" glyph) rendered inline as
// SVG so it never depends on an external icon font/image request. Colors
// match Google's brand guidelines.
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.9v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.9a9 9 0 0 0 0 8.08l3.07-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.96l3.07 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function GoogleButton({ onClick, loading, label = 'Continue with Google' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full h-12 inline-flex items-center justify-center gap-3 border border-charcoal/15 bg-ivory/95 text-charcoal text-[13px] font-medium tracking-wide hover:bg-ivory hover:border-charcoal/25 transition-colors duration-300 disabled:opacity-50"
    >
      <GoogleMark />
      {loading ? 'Connecting…' : label}
    </button>
  );
}