// src/pages/ForgotPassword.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import CinematicAuthShell from '@/components/abix/CinematicAuthShell';
import { useAuth } from '@/lib/AuthContext';
import { mapAuthError } from '@/lib/authErrors';
import { ABIX } from '@/components/abix/brandColors';
import loginImage from '@/assets/authentication/login.png';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_S = 30;

// Envelope icon with a soft ring that pulses outward.
function SentBadge() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: ABIX.goldLight }}
          initial={{ scale: 0.8, opacity: 0.6 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <motion.span
        className="relative flex h-16 w-16 items-center justify-center rounded-full border border-ivory/20 bg-ivory/5"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
      >
        <MailCheck size={26} className="text-gold-light" />
      </motion.span>
    </div>
  );
}

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendReset = async () => {
    await resetPassword(email.trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("That email address doesn't look right.");
      return;
    }

    setLoading(true);
    try {
      await sendReset();
      setSent(true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading || cooldown > 0) return;
    setResendLoading(true);
    setError('');
    try {
      await sendReset();
      setResendDone(true);
      setCooldown(RESEND_COOLDOWN_S);
      setTimeout(() => setResendDone(false), 4000);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setResendLoading(false);
    }
  };

  const resendLabel = resendLoading
    ? 'Resending…'
    : cooldown > 0
    ? `Resend in ${cooldown}s`
    : resendDone
    ? 'Sent again ✓'
    : 'Resend Link';

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
            <SentBadge />
            <div className="border border-ivory/15 bg-ivory/5 p-5 text-center">
              <p className="text-ivory leading-relaxed [overflow-wrap:anywhere]">
                If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.
              </p>
              <p className="mt-2 text-sm text-ivory/55 leading-relaxed">
                Check your spam or promotions folder if it doesn't arrive within a few minutes.
              </p>
            </div>

            {error && (
              <div className="mt-4 border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-3">{error}</div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleResend}
                disabled={resendLoading || cooldown > 0}
                className="inline-flex items-center justify-center h-12 px-6 border border-ivory/25 text-ivory/90 text-sm tracking-wide hover:bg-ivory/10 transition-colors flex-1 disabled:opacity-50"
              >
                {resendLabel}
              </button>
              <Link to="/login" className="btn-primary-inverse flex-1 text-center">
                Back to Login
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError('');
              }}
              className="mt-4 w-full min-h-[44px] text-center text-sm text-ivory/55 underline underline-offset-4 hover:text-ivory transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-2.5">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="forgot-email" className="block label-meta text-ivory/50 mb-1">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
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