import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut, ShieldCheck, RefreshCw, Package, MapPin, Heart, Users,
  Facebook, MessageCircle, Instagram, Send, Pencil, Check as CheckIcon, X as XIcon,
} from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import { useAuth } from '@/lib/AuthContext';
import mineralBg from '@/assets/shilajit-steps/himalayaBG.png';
import logo from '@/assets/logo/Abixmart-header.png';
// ABIXMART account branding
const RESEND_COOLDOWN_S = 30;

const SPACE_SECTIONS = [
  {
    key: 'orders',
    label: 'Orders',
    icon: Package,
    heading: 'Your Ritual Orders',
    body: 'Your purchases will appear here once you place your first ABIXMART order.',
    cta: { label: 'Explore Products', to: '/shop' },
  },
  {
    key: 'addresses',
    label: 'Addresses',
    icon: MapPin,
    heading: 'Delivery Addresses',
    body: 'Save your preferred delivery address for a faster checkout.',
    cta: null,
  },
  {
    key: 'wishlist',
    label: 'Wishlist',
    icon: Heart,
    heading: 'Your Wishlist',
    body: 'Products you save for your next ritual will appear here.',
    cta: { label: 'Browse Shop', to: '/shop' },
  },
  {
    key: 'community',
    label: 'Community',
    icon: Users,
    heading: 'The ABIXMART Circle',
    body: 'Stay connected with the community around better everyday rituals.',
    cta: null,
    social: [
      { icon: Facebook, label: 'Facebook' },
      { icon: MessageCircle, label: 'WhatsApp' },
      { icon: Instagram, label: 'Instagram' },
      { icon: Send, label: 'Telegram' },
    ],
  },
];

function formatMemberSince(createdAt, fallbackAuthCreationTime) {
  let date = createdAt?.toDate ? createdAt.toDate() : createdAt ? new Date(createdAt) : null;
  if ((!date || Number.isNaN(date.getTime())) && fallbackAuthCreationTime) {
    date = new Date(fallbackAuthCreationTime);
  }
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// Validation for the editable profile form. Kept in the page (not
// AuthContext) — same pattern CreateAccount.jsx already uses.
function validateProfileForm(form) {
  const errors = {};
  if (!form.fullName.trim()) errors.fullName = 'Name cannot be blank.';
  if (!form.phone.trim() || form.phone.replace(/\D/g, '').length !== 10) {
    errors.phone = 'Enter a valid 10-digit phone number.';
  }
  if (form.alternatePhone && form.alternatePhone.replace(/\D/g, '').length !== 10) {
    errors.alternatePhone = 'Enter a valid 10-digit phone number.';
  }
  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = 'Enter a valid 6-digit pincode.';
  }
  return errors;
}

// Small field renderer for view mode — shows "Not added" for empty
// optional fields rather than a blank/awkward gap.
function InfoField({ label, value }) {
  return (
    <div className="border border-ivory/10 bg-ivory/5 backdrop-blur-sm rounded-lg px-5 py-4">
      <dt className="label-meta text-ivory/40">{label}</dt>
      <dd className={`mt-1.5 text-base sm:text-lg font-display truncate ${value ? 'text-ivory' : 'text-ivory/35 italic'}`}>
        {value || 'Not added'}
      </dd>
    </div>
  );
}

function EditField({ label, error, children }) {
  return (
    <div>
      <label className="label-meta text-ivory/50 mb-1 block">{label}</label>
      {children}
      {error && <p className="mt-1 text-[11px] text-red-300">{error}</p>}
    </div>
  );
}

export default function Account() {
  const { user, profile, loading, logout, resendVerification, refreshUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const isGoogleUser =
    profile?.provider === 'google' || user?.providerData?.some((p) => p.providerId === 'google.com');

  const [activeSection, setActiveSection] = useState('profile');
  const [resendState, setResendState] = useState('idle');
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  // Edit Profile state
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (loading || !user) {
    return (
      <PageTransition>
        <section className="min-h-[100svh] flex items-center justify-center bg-charcoal">
          <p className="text-ivory/40 text-sm uppercase tracking-luxe-sm">Loading…</p>
        </section>
      </PageTransition>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleResend = async () => {
    if (resendState === 'sending' || cooldown > 0) return;
    setResendState('sending');
    setResendError('');
    try {
      await resendVerification();
      setResendState('sent');
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setResendState('error');
      setResendError(err?.message || 'Could not send the verification email. Please try again shortly.');
    }
  };

  const handleCheckAgain = async () => {
    if (checking) return;
    setChecking(true);
    try {
      await refreshUser();
    } finally {
      setChecking(false);
    }
  };

  const fullName = profile?.fullName || user?.displayName || 'Your Account';
  const initial = fullName.charAt(0).toUpperCase();
  const photoURL = profile?.photoURL || user?.photoURL || '';
  const verified = isGoogleUser || user.emailVerified;
  const memberSince = formatMemberSince(profile?.createdAt, user?.metadata?.creationTime);

  const navItems = [
    { key: 'profile', label: 'Profile' },
    ...SPACE_SECTIONS.map((s) => ({ key: s.key, label: s.label })),
  ];

  const startEditing = () => {
    setProfileForm({
      fullName: profile?.fullName || '',
      phone: profile?.phone || '',
      alternatePhone: profile?.alternatePhone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      pincode: profile?.pincode || '',
      country: profile?.country || 'India',
    });
    setProfileErrors({});
    setSaveMessage('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setProfileForm(null);
    setProfileErrors({});
  };

  const updateFormField = (key) => (e) =>
    setProfileForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSaveProfile = async () => {
    if (!profileForm || savingProfile) return;
    const errors = validateProfileForm(profileForm);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    try {
      await updateUserProfile({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.replace(/\D/g, ''),
        alternatePhone: profileForm.alternatePhone.replace(/\D/g, ''),
        address: profileForm.address.trim(),
        city: profileForm.city.trim(),
        state: profileForm.state.trim(),
        pincode: profileForm.pincode.trim(),
        country: profileForm.country.trim(),
      });
      setEditing(false);
      setProfileForm(null);
      setSaveMessage('Profile updated.');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Profile update failed:', err?.code, err?.message, err);
      setProfileErrors({ form: 'Could not save your changes. Please try again.' });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <PageTransition>
      <section className="relative min-h-[100svh] bg-charcoal text-ivory">
        <img
          src={mineralBg}
          alt=""
          className="fixed inset-0 h-full w-full object-cover opacity-25 scale-110 pointer-events-none"
        />
        <div className="fixed inset-0 bg-gradient-to-b from-charcoal/95 via-charcoal/90 to-charcoal/95 pointer-events-none" />
        <div className="fixed inset-0 grain opacity-[0.05] pointer-events-none" />

        <div className="relative z-10">
          {/* Hero / identity */}
          <div className="mx-auto max-w-6xl px-6 lg:px-10 pt-12 lg:pt-16 pb-8">
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-ivory/90 backdrop-blur px-3 py-1.5 shadow-md">
                <img src={logo} alt="ABIXMART" className="h-5 w-auto object-contain" />
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-luxe-sm text-ivory/50 hover:text-ivory transition-colors border border-ivory/15 hover:border-ivory/30 rounded-full px-3.5 py-2 shrink-0"
              >
                <LogOut size={12} />
                Logout
              </button>
            </div>

            <span className="mt-8 block label-meta text-gold-light">Your ABIXMART</span>

            <div className="mt-4 flex items-center gap-5">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-16 w-16 lg:h-20 lg:w-20 rounded-full object-cover shrink-0 border border-ivory/20"
                />
              ) : (
                <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-resin text-ivory font-display text-2xl lg:text-3xl flex items-center justify-center shrink-0">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-ivory/55 text-sm">Welcome back,</p>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-tight break-words">
                  {fullName}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ivory/50">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${verified ? 'bg-resin-light' : 'bg-ivory/30'}`} />
                    {verified ? 'Verified' : 'Not verified'}
                  </span>
                  <span className="text-ivory/20">•</span>
                  <span>Member since {memberSince}</span>
                  <span className="text-ivory/20 hidden sm:inline">•</span>
                  <span className="w-full sm:w-auto truncate">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="sticky top-0 z-20 backdrop-blur-xl bg-charcoal/70 border-y border-ivory/10">
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={`relative whitespace-nowrap px-4 sm:px-5 py-4 label-meta transition-colors ${
                      activeSection === item.key ? 'text-ivory' : 'text-ivory/40 hover:text-ivory/80'
                    }`}
                  >
                    {item.label}
                    {activeSection === item.key && (
                      <motion.span
                        layoutId="account-nav-underline"
                        className="absolute left-4 right-4 sm:left-5 sm:right-5 -bottom-px h-px bg-gold-light"
                      />
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto max-w-3xl px-6 lg:px-10 py-12 lg:py-16">
            {activeSection === 'profile' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="font-display text-2xl text-ivory">Profile</h2>
                    {!editing && (
                      <button
                        onClick={startEditing}
                        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-luxe-sm text-ivory/60 hover:text-ivory transition-colors border border-ivory/15 hover:border-ivory/30 rounded-full px-3.5 py-2 shrink-0"
                      >
                        <Pencil size={12} />
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {saveMessage && !editing && (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gold-light">
                      <CheckIcon size={14} /> {saveMessage}
                    </p>
                  )}

                  {!editing ? (
                    <>
                      <div className="mt-6">
                        <span className="label-meta text-ivory/40">Personal Information</span>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InfoField label="Full Name" value={fullName} />
                          <InfoField label="Email" value={user.email} />
                          <InfoField label="Phone" value={profile?.phone} />
                          <InfoField label="Alternate Phone" value={profile?.alternatePhone} />
                          <InfoField label="Member Since" value={memberSince} />
                          <InfoField label="Sign-in Method" value={isGoogleUser ? 'Google' : 'Email & Password'} />
                        </div>
                      </div>

                      <div className="mt-6">
                        <span className="label-meta text-ivory/40">Address</span>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InfoField label="Address" value={profile?.address} />
                          <InfoField label="City" value={profile?.city} />
                          <InfoField label="State" value={profile?.state} />
                          <InfoField label="Pincode" value={profile?.pincode} />
                          <InfoField label="Country" value={profile?.country} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-6 space-y-8">
                      {profileErrors.form && (
                        <div className="border border-red-400/40 bg-red-950/30 text-red-200 text-sm px-4 py-2.5">
                          {profileErrors.form}
                        </div>
                      )}

                      <div>
                        <span className="label-meta text-ivory/40">Personal Information</span>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <EditField label="Full Name" error={profileErrors.fullName}>
                            <input
                              value={profileForm.fullName}
                              onChange={updateFormField('fullName')}
                              className="express-input-inverse"
                              placeholder="Your name"
                            />
                          </EditField>
                          <EditField label="Email">
                            <input
                              value={user.email}
                              disabled
                              className="express-input-inverse opacity-50 cursor-not-allowed"
                            />
                          </EditField>
                          <EditField label="Phone" error={profileErrors.phone}>
                            <input
                              value={profileForm.phone}
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))
                              }
                              inputMode="numeric"
                              className="express-input-inverse"
                              placeholder="10-digit mobile"
                            />
                          </EditField>
                          <EditField label="Alternate Phone" error={profileErrors.alternatePhone}>
                            <input
                              value={profileForm.alternatePhone}
                              onChange={(e) =>
                                setProfileForm((prev) => ({ ...prev, alternatePhone: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))
                              }
                              inputMode="numeric"
                              className="express-input-inverse"
                              placeholder="Optional"
                            />
                          </EditField>
                        </div>
                      </div>

                      <div>
                        <span className="label-meta text-ivory/40">Address</span>
                        <div className="mt-3 space-y-4">
                          <EditField label="Address">
                            <textarea
                              value={profileForm.address}
                              onChange={updateFormField('address')}
                              rows={2}
                              className="express-input-inverse resize-none"
                              placeholder="House no, street, area"
                            />
                          </EditField>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <EditField label="City">
                              <input
                                value={profileForm.city}
                                onChange={updateFormField('city')}
                                className="express-input-inverse"
                                placeholder="City"
                              />
                            </EditField>
                            <EditField label="State">
                              <input
                                value={profileForm.state}
                                onChange={updateFormField('state')}
                                className="express-input-inverse"
                                placeholder="State"
                              />
                            </EditField>
                            <EditField label="Pincode" error={profileErrors.pincode}>
                              <input
                                value={profileForm.pincode}
                                onChange={(e) =>
                                  setProfileForm((prev) => ({ ...prev, pincode: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) }))
                                }
                                inputMode="numeric"
                                className="express-input-inverse"
                                placeholder="6-digit pincode"
                              />
                            </EditField>
                            <EditField label="Country">
                              <input
                                value={profileForm.country}
                                onChange={updateFormField('country')}
                                className="express-input-inverse"
                                placeholder="Country"
                              />
                            </EditField>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className="btn-primary-inverse inline-flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <CheckIcon size={14} />
                          {savingProfile ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={savingProfile}
                          className="inline-flex items-center justify-center gap-2 h-14 px-6 border border-ivory/20 text-ivory/80 text-[12px] font-semibold tracking-luxe-sm uppercase hover:bg-ivory/10 transition-colors disabled:opacity-50"
                        >
                          <XIcon size={14} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification */}
                {!verified && (
                  <div className="border border-ivory/10 bg-ivory/5 backdrop-blur-sm rounded-lg p-6 sm:p-7">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-gold-light" />
                      <span className="label-meta text-gold-light">Email Verification</span>
                    </div>
                    <p className="mt-2.5 text-ivory leading-relaxed">
                      We've sent a verification link to <span className="font-medium">{user.email}</span>.
                    </p>
                    <p className="mt-1 text-sm text-ivory/50">Check your inbox, Spam, or Promotions folder.</p>

                    {resendState === 'error' && (
                      <p className="mt-3 text-sm text-red-200 bg-red-950/30 border border-red-400/40 px-3 py-2">
                        {resendError}
                      </p>
                    )}
                    {resendState === 'sent' && cooldown > 0 && (
                      <p className="mt-3 text-sm text-gold-light">Verification email sent.</p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleResend}
                        disabled={resendState === 'sending' || cooldown > 0}
                        className="inline-flex items-center justify-center h-11 px-5 border border-ivory/20 text-ivory/90 text-sm hover:bg-ivory/10 transition-colors disabled:opacity-50"
                      >
                        {resendState === 'sending'
                          ? 'Sending…'
                          : cooldown > 0
                          ? `Resend in ${cooldown}s`
                          : 'Resend Verification'}
                      </button>
                      <button
                        onClick={handleCheckAgain}
                        disabled={checking}
                        className="inline-flex items-center gap-1.5 label-meta text-ivory/50 hover:text-ivory transition-colors disabled:opacity-40"
                      >
                        <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
                        {checking ? 'Checking…' : 'Check Verification'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {SPACE_SECTIONS.filter((s) => s.key === activeSection).map((section) => (
              <div key={section.key} className="max-w-xl">
                <section.icon size={22} className="text-gold-light" />
                <h2 className="mt-4 font-display text-2xl text-ivory">{section.heading}</h2>
                <p className="mt-2 text-ivory/55 leading-relaxed">{section.body}</p>

                {section.cta && (
                  <button onClick={() => navigate(section.cta.to)} className="btn-primary-inverse mt-6">
                    {section.cta.label}
                  </button>
                )}

                {section.social && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {section.social.map(({ icon: Icon, label }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-2 border border-ivory/15 px-4 py-2.5 text-sm text-ivory/60"
                      >
                        <Icon size={15} />
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageTransition>
  );
}