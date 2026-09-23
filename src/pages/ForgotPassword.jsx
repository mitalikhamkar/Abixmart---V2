import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import CinematicAuthShell from '@/components/abix/CinematicAuthShell';
import { useAuth } from '@/lib/AuthContext';
import { mapAuthError } from '@/lib/authErrors';
import loginImage from '@/assets/authentication/login.png';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  const sendReset = async () => {
    await resetPassword(email.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await sendReset();
      setSent(true);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading) return;
    setResendLoading(true);
    setError('');
    try {
      await sendReset();
      setResendDone(true);
      setTimeout(() => setResendDone(false), 4000);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <PageTransition>
      <CinematicAuthShell
        image={loginImage}
        imageAlt=""
        eyebrow="ABIXMART Account"
        title={sent ? 'Check Your Inbox' : 'Reset Your Password'}
        subtitle={sent ? null : "Enter the email on your account and we'll send you a link to reset your password."}
        footer={
          <>
            Remembered it?{' '}
            <Link to="/login" className="text-gold-light font-medium hover:text-ivory transition-colors">
              Login
            </Link>
          </>
        }
      >
        {sent ? (
          <div>
            <div className="flex items-start gap-3 border border-ivory/15 bg-ivory/5 p-5">
              <MailCheck size={20} className="text-gold-light shrink-0 mt-0.5" />
              <div>
                <p className="text-ivory leading-relaxed">
                  If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.
                </p>
                <p className="mt-2 text-sm text-ivory/55 leading-relaxed">
                  Check your spam or promotions folder if it doesn't arrive within a few minutes.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-3">{error}</div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="inline-flex items-center justify-center h-12 px-6 border border-ivory/25 text-ivory/90 text-sm tracking-wide hover:bg-ivory/10 transition-colors flex-1 disabled:opacity-50"
              >
                {resendLoading ? 'Resending…' : resendDone ? 'Sent again ✓' : 'Resend Link'}
              </button>
              <Link to="/login" className="btn-primary-inverse flex-1 text-center">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-2.5">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block label-meta text-ivory/50 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="express-input-inverse"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary-inverse w-full">
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </CinematicAuthShell>
    </PageTransition>
  );
}