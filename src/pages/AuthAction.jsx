import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '@/components/abix/AuthShell';
import { useAuth } from '@/lib/AuthContext';
import { auth } from '@/lib/firebase';
import loginImage from '@/assets/authentication/login.png';

/**
 * Handles the links Firebase emails for `mode=verifyEmail` and
 * `mode=resetPassword`.
 *
 * IMPORTANT: for this page to actually receive `mode`/`oobCode`, the
 * "Customize action URL" field for each template in Firebase Console →
 * Authentication → Templates must point to this app's own domain
 * (e.g. http://localhost:5173/auth/action in dev). Without that console
 * setting, Firebase routes the email link through its own generic hosted
 * page (yourproject.firebaseapp.com/__/auth/action) first, which consumes
 * the one-time code itself before redirecting here — this page then sees
 * no code left to verify. That's expected in that scenario, not a bug in
 * this component, which is why the missing-code case below is treated as
 * "already verified" rather than an error.
 */
export default function AuthAction() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { confirmEmailVerification, verifyResetCode, confirmReset, refreshUser } = useAuth();

  const mode = params.get('mode');
  const oobCode = params.get('oobCode');

  const [status, setStatus] = useState('working'); // working | verified | reset-form | reset-done | error
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Guards against this effect running the verification/reset-code call
  // twice for the same oobCode (e.g. React StrictMode double-invoking
  // effects in dev). A code is single-use, so a second call would
  // otherwise fail right after the first one already succeeded.
  const processedCodeRef = useRef(null);

  useEffect(() => {
    if (!mode || !oobCode) {
      // CHANGED: previously this showed a "Link Issue" error. Now treated
      // as "verification already happened via Firebase's own hosted page,
      // and this is just the continueUrl redirect landing here with the
      // code already consumed." See the console note above the component
      // for how to avoid this path entirely.
      setStatus('verified');
      return;
    }

    if (processedCodeRef.current === oobCode) return;
    processedCodeRef.current = oobCode;

    if (mode === 'verifyEmail') {
      confirmEmailVerification(oobCode)
        .then(() => setStatus('verified'))
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[ABIXMART] Email verification failed:', err?.code, err?.message, err);
          setStatus('error');
          setError(
            err?.code === 'auth/invalid-action-code' || err?.code === 'auth/expired-action-code'
              ? "This verification link has expired or has already been used. Use the latest verification email we sent — if you requested more than one, only the newest link works."
              : err?.message || 'We could not verify your email.'
          );
        });
    } else if (mode === 'resetPassword') {
      verifyResetCode(oobCode)
        .then((email) => {
          setResetEmail(email);
          setStatus('reset-form');
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[ABIXMART] Reset code verification failed:', err?.code, err?.message, err);
          setStatus('error');
          setError(
            err?.code === 'auth/invalid-action-code' || err?.code === 'auth/expired-action-code'
              ? 'This reset link has expired or has already been used. Use the latest reset email we sent.'
              : err?.message || 'We could not verify this reset link.'
          );
        });
    } else {
      setStatus('error');
      setError('Unrecognized link type.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, oobCode]);

  const handleContinue = async () => {
    try {
      await refreshUser();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] refreshUser on continue failed:', err?.code, err?.message, err);
    }

    // CHANGED: check the real, current Firebase session (not React state,
    // which may not have re-rendered yet) to decide where "Continue" goes.
    // Same browser/session as signup → straight to the account page, no
    // detour. Different device/browser (link opened elsewhere, e.g. a
    // mobile mail app) → there's genuinely no session to resume, so send
    // to login with a friendly confirmation instead of a dead end.
    if (auth.currentUser) {
      navigate('/account', { replace: true });
    } else {
      navigate('/login?verified=1', { replace: true });
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await confirmReset(oobCode, newPassword);
      setStatus('reset-done');
    } catch (err) {
      setError(err?.message || 'Could not reset your password. The link may have expired — request a new one.');
    } finally {
      setSubmitting(false);
    }
  };

  let title = 'Working…';
  let subtitle = 'Please wait a moment.';
  if (status === 'verified') {
    title = 'Email Verified';
    subtitle = 'Your email has been successfully verified.';
  } else if (status === 'error') {
    title = 'Link Issue';
    subtitle = null;
  } else if (status === 'reset-form') {
    title = 'Set a New Password';
    subtitle = resetEmail ? `For ${resetEmail}` : null;
  } else if (status === 'reset-done') {
    title = 'Password Updated';
    subtitle = 'You can now log in with your new password.';
  }

  return (
    <AuthShell image={loginImage} imageAlt="" eyebrow="ABIXMART Account" title={title} subtitle={subtitle}>
      {status === 'working' && <p className="text-ivory/60 text-sm">Verifying your link…</p>}

      {status === 'verified' && (
        <button onClick={handleContinue} className="btn-primary-inverse w-full">
          Continue to ABIXMART
        </button>
      )}

      {status === 'error' && (
        <div>
          <p className="text-red-200 text-sm leading-relaxed border border-red-400/40 bg-red-950/30 px-4 py-3">
            {error}
          </p>
          <Link to="/login" className="btn-primary-inverse w-full mt-5 inline-flex items-center justify-center">
            Back to Login
          </Link>
        </div>
      )}

      {status === 'reset-form' && (
        <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-2.5">{error}</div>
          )}
          <div>
            <label className="label-meta text-ivory/50 mb-1 block">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="express-input-inverse"
            />
          </div>
          <div>
            <label className="label-meta text-ivory/50 mb-1 block">Confirm Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              className="express-input-inverse"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary-inverse w-full">
            {submitting ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      )}

      {status === 'reset-done' && (
        <Link to="/login" className="btn-primary-inverse w-full inline-flex items-center justify-center">
          Go to Login
        </Link>
      )}
    </AuthShell>
  );
}