import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import CinematicAuthShell from '@/components/abix/CinematicAuthShell';
import GoogleButton from '@/components/abix/GoogleButton';
import { useAuth } from '@/lib/AuthContext';
import { mapAuthError } from '@/lib/authErrors';
import registerImage from '@/assets/authentication/register.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = 'Please enter your full name.';
  if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Please enter a valid 10-digit phone number.';
  }
  if (!EMAIL_RE.test(form.email)) errors.email = 'Please enter a valid email address.';
  if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

// Hoisted outside the component so it keeps a stable identity across
// re-renders — this is what fixes the focus-loss-after-one-character bug.
function Field({ label, error, children, extra }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label-meta text-ivory/50">{label}</label>
        {extra}
      </div>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-300">{error}</p>}
    </div>
  );
}

export default function CreateAccount() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [verifyIssue, setVerifyIssue] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // NEW: refs instead of relying solely on `loading` state to block
  // double-submits. State updates are async/batched, so a fast double
  // click (or double Enter-press) could fire handleSubmit/handleGoogle
  // twice before `loading` visually flips to true on the button. A ref
  // updates immediately and closes that race completely.
  const submittingRef = useRef(false);
  const googleSubmittingRef = useRef(false);

  const handleGoogle = async () => {
    if (googleSubmittingRef.current) return;
    googleSubmittingRef.current = true;
    setFormError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) navigate('/account');
    } catch (err) {
      setFormError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
      googleSubmittingRef.current = false;
    }
  };

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const errors = validate(form);
    setFieldErrors(errors);
    setFormError('');
    if (Object.keys(errors).length > 0) return;

    submittingRef.current = true;
    setLoading(true);
    try {
      const { verificationError } = await register({
        fullName: form.fullName.trim(),
        phone: form.phone.replace(/\D/g, ''),
        email: form.email.trim(),
        password: form.password,
      });
      setSubmitted(true);
      setVerifyIssue(verificationError ? mapAuthError(verificationError) : null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] CreateAccount register() failed:', err?.code, err?.message, err);
      setFormError(
        err?.code === 'abixmart/profile-write-failed'
          ? "Your account was created, but we couldn't save your profile details. Please contact support."
          : mapAuthError(err)
      );
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <PageTransition>
      <CinematicAuthShell
        image={registerImage}
        imageAlt=""
        eyebrow="ABIXMART Account"
        title={submitted ? 'Account Created' : 'Create Your Account'}
        subtitle={submitted ? null : 'A more considered way to shop wellness — starting with your own space.'}
        footer={
          submitted ? null : (
            <>
              Already have an account?{' '}
              <Link to="/login" className="text-gold-light font-medium hover:text-ivory transition-colors">
                Login
              </Link>
            </>
          )
        }
      >
        {submitted ? (
          <div>
            {verifyIssue ? (
              <div className="border border-gold-light/30 bg-ivory/10 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-gold-light shrink-0 mt-0.5" />
                  <div>
                    <p className="text-ivory font-medium">Your account was created.</p>
                    <p className="mt-1.5 text-sm text-ivory/65 leading-relaxed">
                      We couldn't send the verification email right now: {verifyIssue} You can resend it anytime
                      from your Account page.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-ivory leading-relaxed">
                A verification email is on its way to <span className="font-medium">{form.email}</span>. Check your
                inbox — and your spam or promotions folder — then verify to unlock the full ABIXMART experience.
              </p>
            )}
            <Link to="/login" className="btn-primary-inverse mt-6 inline-flex">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            {formError && (
              <div className="mb-4 border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-2.5">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Full Name" error={fieldErrors.fullName}>
                <input value={form.fullName} onChange={update('fullName')} placeholder="Your name" className="express-input-inverse" />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone Number" error={fieldErrors.phone}>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                    inputMode="numeric"
                    placeholder="10-digit mobile"
                    className="express-input-inverse"
                  />
                </Field>
                <Field label="Email" error={fieldErrors.email}>
                  <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" className="express-input-inverse" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Password" error={fieldErrors.password}>
                  <input type="password" value={form.password} onChange={update('password')} placeholder="8+ characters" className="express-input-inverse" />
                </Field>
                <Field label="Confirm" error={fieldErrors.confirmPassword}>
                  <input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="••••••••" className="express-input-inverse" />
                </Field>
              </div>

              <button type="submit" disabled={loading} className="btn-primary-inverse w-full mt-1">
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-ivory/15" />
              <span className="label-meta text-ivory/40">Or</span>
              <span className="h-px flex-1 bg-ivory/15" />
            </div>

            <GoogleButton onClick={handleGoogle} loading={googleLoading} />
          </>
        )}
      </CinematicAuthShell>
    </PageTransition>
  );
}