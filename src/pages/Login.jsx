import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageTransition from '@/components/abix/PageTransition';
import CinematicAuthShell from '@/components/abix/CinematicAuthShell';
import GoogleButton from '@/components/abix/GoogleButton';
import { useAuth } from '@/lib/AuthContext';
import { mapAuthError } from '@/lib/authErrors';
import loginImage from '@/assets/authentication/login.png';

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // NEW: set by AuthAction.jsx's Continue button when the user verified
  // their email in a session/browser with no active login — lets them
  // know *why* they landed here instead of straight on their profile.
  const justVerified = searchParams.get('verified') === '1';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate('/account');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (googleLoading) return;
    setError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) navigate('/account');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <PageTransition>
      <CinematicAuthShell
        image={loginImage}
        imageAlt=""
        eyebrow="ABIXMART Account"
        title="Welcome Back"
        subtitle="Continue your ABIXMART journey."
        footer={
          <>
            New to ABIXMART?{' '}
            <Link to="/create-account" className="text-gold-light font-medium hover:text-ivory transition-colors">
              Create Account
            </Link>
          </>
        }
      >
        {justVerified && !error && (
          <div className="mb-5 border border-gold-light/30 bg-ivory/10 text-ivory/90 text-sm px-4 py-3">
            Your email is verified. Log in to continue to your account.
          </div>
        )}

        {error && (
          <div className="mb-5 border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-2.5">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label className="block label-meta text-ivory/50 mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="you@example.com"
              className="express-input-inverse"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block label-meta text-ivory/50">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-ivory/50 hover:text-gold-light transition-colors">
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              className="express-input-inverse"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary-inverse w-full">
            {loading ? 'Logging In…' : 'Login'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-ivory/15" />
          <span className="label-meta text-ivory/40">Or</span>
          <span className="h-px flex-1 bg-ivory/15" />
        </div>

        <GoogleButton onClick={handleGoogle} loading={googleLoading} />
      </CinematicAuthShell>
    </PageTransition>
  );
}