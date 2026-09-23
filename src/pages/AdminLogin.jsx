import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/admin/lib/AdminAuthContext';
import logo from '@/assets/logo/Abixmart-header.png';

function mapAdminError(err) {
  if (err?.code === 'abixmart/not-admin') return err.message;
  const code = err?.code || '';
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return `Something went wrong${code ? ` (${code})` : ''}. Please try again.`;
  }
}

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      navigate('/admin/overview', { replace: true });
    } catch (err) {
      setError(mapAdminError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen bg-charcoal flex items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-ivory/95 px-3 py-1.5">
            <img src={logo} alt="ABIXMART" className="h-5 w-auto object-contain" />
          </div>
        </div>

        <div className="border border-ivory/10 bg-ivory/[0.03] rounded-md p-7 sm:p-8">
          <p className="label-meta text-gold-light">ABIXMART Admin</p>
          <h1 className="mt-3 font-display text-3xl text-ivory">Admin Login</h1>
          <p className="mt-2 text-ivory/50 text-sm">Authorized access only.</p>

          {error && (
            <div className="mt-5 border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="label-meta text-ivory/50 mb-1 block">Email</label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="admin@abixmart.com"
                className="express-input-inverse"
              />
            </div>
            <div>
              <label className="label-meta text-ivory/50 mb-1 block">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className="express-input-inverse"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary-inverse w-full mt-2">
              {loading ? 'Logging In…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}