// src/pages/Account.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  LogOut, ShieldCheck, RefreshCw, Package, MapPin, Heart, Users,
  Facebook, MessageCircle, Instagram, Linkedin, Send, Pencil, Check as CheckIcon, X as XIcon,
  User, Mail, Phone, PhoneCall, CalendarDays, KeyRound, Building2, Flag, Hash, Globe,
  Copy, ArrowRight, ArrowUpRight, LifeBuoy,
} from 'lucide-react';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import LeafShadow from '@/components/abix/home/LeafShadow';
import { ABOUT_CSS } from '@/components/abix/about/aboutMotion';
import { ABIX } from '@/components/abix/brandColors';
import { FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { useAuth } from '@/lib/AuthContext';
import { useShop } from '@/lib/ShopContext';
import { useCatalog } from '@/lib/CatalogContext';
import { getOrdersForUser, getDisplayOrderId } from '@/lib/orderUtils';
import mineralBg from '@/assets/shilajit-steps/himalayaBG.png';

const RESEND_COOLDOWN_S = 30;
const WHATSAPP_URL = 'https://wa.me/917680014597';
const EASE = [0.22, 1, 0.36, 1];

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
    heading: 'Join the ABIXMART Circle',
    body: 'Stay connected with the community around better everyday rituals.',
    cta: null,
    social: [
      { icon: Facebook, label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=6159343745872' },
      { icon: MessageCircle, label: 'WhatsApp', href: WHATSAPP_URL },
      { icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/abixmart/' },
      { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/company/abixmart/posts/' },
      { icon: Send, label: 'Telegram', href: null }, // real URL not provided yet — stays "Coming soon"
    ],
  },
];

// Real orderStatus values (see orderUtils.js) mapped to display labels.
// The key ORDER is also the order of the progress line on each order card.
const STATUS_LABELS = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
};
const STATUS_KEYS = Object.keys(STATUS_LABELS);

function formatMemberSince(createdAt, fallbackAuthCreationTime) {
  let date = createdAt?.toDate ? createdAt.toDate() : createdAt ? new Date(createdAt) : null;
  if ((!date || Number.isNaN(date.getTime())) && fallbackAuthCreationTime) {
    date = new Date(fallbackAuthCreationTime);
  }
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function formatOrderDate(createdAt) {
  const date = createdAt?.toDate ? createdAt.toDate() : createdAt ? new Date(createdAt) : null;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Builds "City, State PIN" without repeating the state when the saved city
// already contains it (e.g. city saved as "Mumbai, Maharashtra, India").
function buildCityLine(p) {
  const city = (p?.city || '').trim();
  const state = (p?.state || '').trim();
  const pin = (p?.pincode || '').trim();
  const cityHasState = state && city.toLowerCase().includes(state.toLowerCase());
  const place = cityHasState ? city : [city, state].filter(Boolean).join(', ');
  return [place, pin].filter(Boolean).join(' ');
}

// Validation for the editable profile form (unchanged).
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

/* ───────────────────────── small building blocks ───────────────────────── */

// Fade-and-rise when scrolled into view. Plain div when reduced motion is on.
function Reveal({ children, delay = 0, className = '' }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

// Card with a soft gold light that follows the pointer.
function SpotlightCard({ children, className = '' }) {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={`group/spot relative overflow-hidden rounded-lg border border-ivory/10 bg-ivory/5 backdrop-blur-sm transition-colors duration-500 hover:border-ivory/25 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{ background: `radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), ${ABIX.gold15}, transparent 70%)` }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

// Data values use the normal UI font (font-sans) with lining numerals —
// no decorative display face, so numbers stay easy to read for everyone.
function InfoField({ icon: Icon, label, value, wide = false }) {
  return (
    <SpotlightCard className={wide ? 'sm:col-span-2' : ''}>
      <div className="px-5 py-4">
        <dt className="flex items-center gap-2 label-meta text-ivory/40">
          <Icon size={13} className="shrink-0 text-gold-light" aria-hidden="true" />
          {label}
        </dt>
        <dd
          className={`mt-2 font-sans lining-nums tabular-nums text-base sm:text-lg [overflow-wrap:anywhere] ${
            value ? 'text-ivory' : 'text-ivory/35 italic'
          }`}
        >
          {value || 'Not added'}
        </dd>
      </div>
    </SpotlightCard>
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

function GroupLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="block h-px w-8" style={{ backgroundColor: ABIX.gold }} />
      <span className="label-meta text-ivory/45">{children}</span>
    </div>
  );
}

// Gold ring that draws itself to the completeness percentage.
function CompletenessRing({ pct }) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90" aria-hidden="true">
      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(230,225,213,0.12)" strokeWidth="3" />
      <motion.circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke={ABIX.gold}
        strokeWidth="3"
        strokeLinecap="round"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: pct / 100 }}
        transition={{ duration: 1.6, ease: EASE, delay: 0.5 }}
      />
    </svg>
  );
}

// A thin gold line with one dot per order stage; the line fills up to the current stage.
function OrderProgress({ status }) {
  const idx = STATUS_KEYS.indexOf(status);
  if (idx < 0) return null;
  const pct = (idx / (STATUS_KEYS.length - 1)) * 100;
  return (
    <div className="mt-5" role="img" aria-label={`Order status: ${STATUS_LABELS[status]}`}>
      <div className="relative h-4">
        <div className="absolute left-1 right-1 top-1/2 h-px bg-ivory/15">
          <motion.div
            className="h-full"
            style={{ backgroundColor: ABIX.gold }}
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-between">
          {STATUS_KEYS.map((k, i) => (
            <span
              key={k}
              className="block h-2 w-2 rounded-full"
              style={{
                backgroundColor: i <= idx ? ABIX.gold : 'rgba(230,225,213,0.2)',
                boxShadow: i === idx ? `0 0 0 4px ${ABIX.gold25}` : 'none',
              }}
            />
          ))}
        </div>
      </div>
      <p className="mt-2.5 text-xs text-ivory/50">
        <span className="text-gold-light">{STATUS_LABELS[status]}</span>
        <span className="mx-1.5 text-ivory/20">•</span>
        Step {idx + 1} of {STATUS_KEYS.length}
      </p>
    </div>
  );
}

function CopyId({ value }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch {
      /* clipboard blocked — ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy order ID"
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-ivory/15 text-ivory/55 transition-colors hover:border-ivory/35 hover:text-ivory ${FOCUS_RING}`}
    >
      {done ? <CheckIcon size={13} className="text-gold-light" /> : <Copy size={13} />}
    </button>
  );
}

const pillBtn =
  'inline-flex items-center gap-1.5 text-[11px] uppercase tracking-luxe-sm text-ivory/70 hover:text-ivory transition-colors border border-ivory/15 hover:border-ivory/30 rounded-full px-3.5 py-2';

function HelpCard({ navigate }) {
  return (
    <SpotlightCard>
      <div className="p-6">
        <LifeBuoy size={20} className="text-gold-light" aria-hidden="true" />
        <h3 className="mt-4 font-display text-xl text-ivory">Need a hand?</h3>
        <p className="mt-2 text-sm leading-relaxed text-ivory/55">
          Track an order, ask about a product, or talk to a real person.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => navigate('/support')} className={pillBtn}>
            Visit Support <ArrowRight size={12} />
          </button>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={pillBtn}>
            <MessageCircle size={12} /> WhatsApp
          </a>
        </div>
      </div>
    </SpotlightCard>
  );
}

function LatestOrderCard({ orders, loading, navigate, onSeeAll }) {
  if (loading) return null;

  if (!orders.length) {
    return (
      <SpotlightCard>
        <div className="p-6">
          <Package size={20} className="text-gold-light" aria-hidden="true" />
          <h3 className="mt-4 font-display text-xl text-ivory">No orders yet</h3>
          <p className="mt-2 text-sm leading-relaxed text-ivory/55">
            Your first ritual will show up here, with its journey.
          </p>
          <button type="button" onClick={() => navigate('/shop')} className={`${pillBtn} mt-5`}>
            Explore Products <ArrowRight size={12} />
          </button>
        </div>
      </SpotlightCard>
    );
  }

  const order = orders[0];
  return (
    <SpotlightCard>
      <div className="p-6">
        <span className="label-meta text-ivory/45">Latest order</span>
        <p className="mt-3 font-sans text-base font-medium tracking-wide text-ivory lining-nums tabular-nums [overflow-wrap:anywhere]">
          {getDisplayOrderId(order)}
        </p>
        <p className="mt-1 text-xs text-ivory/40">{formatOrderDate(order.createdAt)}</p>
        <OrderProgress status={order.orderStatus || 'placed'} />
        <div className="mt-5 flex flex-wrap gap-2">
          {order.orderId && (
            <button
              type="button"
              onClick={() => navigate(`/support?orderId=${encodeURIComponent(order.orderId)}#tracking`)}
              className={pillBtn}
            >
              Track Order
            </button>
          )}
          <button type="button" onClick={onSeeAll} className={pillBtn}>
            All orders
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
}

function StatTile({ icon: Icon, label, value, hint, onClick }) {
  return (
    <SpotlightCard>
      <button type="button" onClick={onClick} className={`w-full p-5 text-left sm:p-6 ${FOCUS_RING}`}>
        <span className="flex items-center gap-2 label-meta text-ivory/45">
          <Icon size={13} className="text-gold-light" aria-hidden="true" />
          {label}
        </span>
        <span className="mt-3 block font-sans text-4xl font-light leading-none tabular-nums lining-nums text-ivory">
          {value}
        </span>
        <span className="mt-2 block text-xs text-ivory/45">{hint}</span>
      </button>
    </SpotlightCard>
  );
}

/* ───────────────────────── section panels ───────────────────────── */

function OrdersPanel({ orders, loading, error, navigate }) {
  if (loading) {
    return <p className="text-ivory/40 text-sm uppercase tracking-luxe-sm">Loading your orders…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-300">{error}</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-xl">
        <Package size={22} className="text-gold-light" />
        <h2 className="mt-4 font-display text-2xl text-ivory">Your Ritual Orders</h2>
        <p className="mt-2 text-ivory/55 leading-relaxed">
          Your purchases will appear here once you place your first ABIXMART order.
        </p>
        <button onClick={() => navigate('/shop')} className="btn-primary-inverse mt-6">
          Explore Products
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
      <div className="lg:col-span-8 min-w-0">
        <h2 className="font-display text-2xl text-ivory">Your Ritual Orders</h2>

        <div className="mt-6 space-y-4">
          {orders.map((order, i) => {
            const displayId = getDisplayOrderId(order);
            // Only orders with a real, permanent orderId can be looked up by the
            // Support page's tracking query.
            const trackable = Boolean(order.orderId);

            return (
              <Reveal key={order.id} delay={Math.min(i, 3) * 0.06}>
                <SpotlightCard>
                  <div className="px-5 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2.5">
                        <span className="font-sans text-base sm:text-lg font-medium text-ivory tracking-wide lining-nums tabular-nums select-all">
                          {displayId}
                        </span>
                        <CopyId value={displayId} />
                      </span>
                      <span className="label-meta text-gold-light">
                        {STATUS_LABELS[order.orderStatus] || order.orderStatus || 'Placed'}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-ivory/40">{formatOrderDate(order.createdAt)}</p>

                    <OrderProgress status={order.orderStatus || 'placed'} />

                    <div className="mt-5 space-y-1.5">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 text-sm">
                          <span className="text-ivory/80 truncate">
                            {item.name}
                            {item.variantLabel ? ` — ${item.variantLabel}` : ''}
                            {' '}× {item.qty}
                          </span>
                          <span className="text-ivory/60 shrink-0">₹{item.subtotal}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-ivory/10 pt-3">
                      <span className="text-sm text-ivory/50">Total</span>
                      <span className="font-price text-lg text-ivory">₹{order.total}</span>
                    </div>

                    <div className="mt-4">
                      {trackable ? (
                        <button
                          onClick={() => navigate(`/support?orderId=${encodeURIComponent(order.orderId)}#tracking`)}
                          className={pillBtn}
                        >
                          Track Order <ArrowRight size={12} />
                        </button>
                      ) : (
                        <span className="text-xs text-ivory/35 italic">Tracking ID pending update</span>
                      )}
                    </div>
                  </div>
                </SpotlightCard>
              </Reveal>
            );
          })}
        </div>
      </div>

      <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-44">
        <HelpCard navigate={navigate} />
      </aside>
    </div>
  );
}

function AddressesPanel({ profile, onEdit }) {
  const hasAddress = Boolean(profile?.address && profile?.city && profile?.state && profile?.pincode);

  if (!hasAddress) {
    return (
      <div className="max-w-xl">
        <MapPin size={22} className="text-gold-light" />
        <h2 className="mt-4 font-display text-2xl text-ivory">Delivery Addresses</h2>
        <p className="mt-2 text-ivory/55 leading-relaxed">
          Save your preferred delivery address for a faster checkout.
        </p>
        <button onClick={onEdit} className={`${pillBtn} mt-6`}>
          <Pencil size={12} /> Add address
        </button>
      </div>
    );
  }

  const country = (profile?.country || '').trim();
  const cityHasCountry = country && (profile.city || '').toLowerCase().includes(country.toLowerCase());

  return (
    <div className="max-w-xl">
      <MapPin size={22} className="text-gold-light" />
      <h2 className="mt-4 font-display text-2xl text-ivory">Delivery Addresses</h2>
      <p className="mt-2 text-ivory/55 leading-relaxed">Your saved address is used for a faster checkout.</p>

      <Reveal>
        <SpotlightCard className="mt-6">
          <div className="px-5 py-5">
            <span className="label-meta text-ivory/40">Saved address</span>
            {profile?.fullName && <p className="mt-3 text-base text-ivory">{profile.fullName}</p>}
            {profile?.phone && <p className="text-sm text-ivory/70 lining-nums tabular-nums">+91 {profile.phone}</p>}
            <p className="mt-3 text-sm text-ivory/80 leading-relaxed">{profile.address}</p>
            <p className="text-sm text-ivory/80 lining-nums tabular-nums">{buildCityLine(profile)}</p>
            {country && !cityHasCountry && <p className="text-sm text-ivory/80">{country}</p>}
          </div>
        </SpotlightCard>
      </Reveal>

      <button onClick={onEdit} className={`${pillBtn} mt-5`}>
        <Pencil size={12} />
        Edit address
      </button>
    </div>
  );
}

// Reads the SAME wishlist (array of product ids) from useShop() that the header
// and the /wishlist page use, so all three stay in sync.
function WishlistPanel({ wishlist, toggleWishlist, navigate }) {
  const { products, loading } = useCatalog();
  const items = (wishlist || []).map((id) => products.find((p) => p.id === id)).filter(Boolean);

  if (loading) {
    return <p className="text-ivory/40 text-sm uppercase tracking-luxe-sm">Loading your wishlist…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-xl">
        <Heart size={22} className="text-gold-light" />
        <h2 className="mt-4 font-display text-2xl text-ivory">Your Wishlist</h2>
        <p className="mt-2 text-ivory/55 leading-relaxed">
          Products you save for your next ritual will appear here.
        </p>
        <button onClick={() => navigate('/shop')} className="btn-primary-inverse mt-6">
          Browse Shop
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="font-display text-2xl text-ivory">Your Wishlist</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((product, i) => (
          <Reveal key={product.id} delay={Math.min(i, 3) * 0.06}>
            <SpotlightCard>
              <div className="flex items-center gap-4 px-4 py-3">
                <button
                  onClick={() => navigate(`/shop/${product.slug}`)}
                  className="h-16 w-16 shrink-0 rounded-md bg-ivory/5 flex items-center justify-center overflow-hidden"
                  aria-label={`View ${product.name}`}
                >
                  {product.shopImage && (
                    <img src={product.shopImage} alt={product.name} className="h-full w-full object-contain p-1" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-tight text-ivory truncate">{product.name}</p>
                  <p className="mt-0.5 text-sm text-ivory/60 font-sans lining-nums tabular-nums">
                    {product.status === 'available' ? `${product.currency}${product.price}` : 'Coming Soon'}
                  </p>
                  <button
                    onClick={() => navigate(`/shop/${product.slug}`)}
                    className="mt-1.5 text-[11px] uppercase tracking-luxe-sm text-gold-light hover:text-ivory transition-colors"
                  >
                    View product
                  </button>
                </div>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Remove from wishlist"
                  className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full border border-ivory/15 text-ivory/60 hover:text-ivory hover:border-ivory/30 transition-colors"
                >
                  <XIcon size={14} />
                </button>
              </div>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function CommunityPanel({ section }) {
  return (
    <div className="max-w-3xl">
      <section.icon size={22} className="text-gold-light" />
      <h2 className="mt-4 font-display text-2xl text-ivory">{section.heading}</h2>
      <p className="mt-2 text-ivory/55 leading-relaxed">{section.body}</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {section.social.map(({ icon: Icon, label, href }, i) => (
          <Reveal key={label} delay={Math.min(i, 4) * 0.05}>
            {href ? (
              <SpotlightCard>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between gap-3 px-5 py-4 text-ivory/75 hover:text-ivory transition-colors ${FOCUS_RING}`}
                >
                  <span className="inline-flex items-center gap-3 text-base">
                    <Icon size={18} className="text-gold-light" />
                    {label}
                  </span>
                  <ArrowUpRight size={16} className="text-ivory/40" />
                </a>
              </SpotlightCard>
            ) : (
              <div
                aria-disabled="true"
                className="flex items-center justify-between gap-3 rounded-lg border border-ivory/10 px-5 py-4 text-ivory/30 cursor-not-allowed"
              >
                <span className="inline-flex items-center gap-3 text-base">
                  <Icon size={18} />
                  {label}
                </span>
                <span className="label-meta text-ivory/30">Coming soon</span>
              </div>
            )}
          </Reveal>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function Account() {
  const { user, profile, loading, logout, resendVerification, refreshUser, updateUserProfile } = useAuth();
  // Same wishlist source of truth as the header and /wishlist page.
  const { wishlist, toggleWishlist } = useShop();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

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

  // Orders are loaded once here so the hero, the tab badge and the Orders tab share them.
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError('');
    getOrdersForUser(user.uid)
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[ABIXMART] Failed to load orders:', err?.code, err?.message, err);
        if (!cancelled) setOrdersError('Could not load your orders right now. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

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
  const nameParts = fullName.trim().split(/\s+/);
  const initial = fullName.charAt(0).toUpperCase();
  const photoURL = profile?.photoURL || user?.photoURL || '';
  const verified = isGoogleUser || user.emailVerified;
  const memberSince = formatMemberSince(profile?.createdAt, user?.metadata?.creationTime);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';

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

  // ── profile completeness (UI only, computed from data already loaded) ──
  const goEditProfile = () => {
    setActiveSection('profile');
    startEditing();
  };
  const checks = [
    { key: 'name', done: Boolean(profile?.fullName), label: 'Add your name', go: goEditProfile },
    {
      key: 'phone',
      done: (profile?.phone || '').replace(/\D/g, '').length === 10,
      label: 'Add your phone number',
      go: goEditProfile,
    },
    {
      key: 'address',
      done: Boolean(profile?.address && profile?.city && profile?.state && profile?.pincode),
      label: 'Save a delivery address',
      go: goEditProfile,
    },
    { key: 'verified', done: verified, label: 'Verify your email', go: () => setActiveSection('profile') },
    { key: 'alt', done: Boolean(profile?.alternatePhone), label: 'Add an alternate phone', go: goEditProfile },
  ];
  const doneCount = checks.filter((c) => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const nextStep = checks.find((c) => !c.done);

  const wishlistCount = (wishlist || []).length;
  const ordersCount = ordersLoading ? '–' : orders.length;
  const latestStatus = orders[0] ? STATUS_LABELS[orders[0].orderStatus] || 'Placed' : null;

  const badgeFor = (key) => {
    if (key === 'orders' && !ordersLoading && orders.length > 0) return orders.length;
    if (key === 'wishlist' && wishlistCount > 0) return wishlistCount;
    return null;
  };
  const navItems = [
    { key: 'profile', label: 'Profile' },
    ...SPACE_SECTIONS.map((s) => ({ key: s.key, label: s.label })),
  ];

  const fadeUp = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  const communitySection = SPACE_SECTIONS.find((s) => s.key === 'community');

  return (
    <PageTransition>
      <section className="relative min-h-[100svh] bg-charcoal text-ivory">
        <style>{ABOUT_CSS}</style>
        <img
          src={mineralBg}
          alt=""
          className="fixed inset-0 h-full w-full object-cover opacity-25 scale-110 pointer-events-none"
        />
        <div className="fixed inset-0 bg-gradient-to-b from-charcoal/95 via-charcoal/90 to-charcoal/95 pointer-events-none" />
        <div className="fixed inset-0 grain opacity-[0.05] pointer-events-none" />

        <div className="relative z-10">
          {/* ============ HERO ============ */}
          <div className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="abix-amber absolute -right-[10%] top-[0%] h-[90%] w-[60%] pointer-events-none"
              style={{ background: `radial-gradient(closest-side, ${ABIX.gold25} 0%, transparent 70%)` }}
            />
            <LeafShadow side="right" opacity={0.07} />

            <div className="relative mx-auto max-w-6xl px-6 lg:px-10 pt-28 lg:pt-36 pb-10">
              <motion.div {...fadeUp(0.1)} className="flex items-center justify-between gap-4">
                <Eyebrow light>Your ABIXMART</Eyebrow>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-luxe-sm text-ivory/50 hover:text-ivory transition-colors border border-ivory/15 hover:border-ivory/30 rounded-full px-3.5 py-2 shrink-0"
                >
                  <LogOut size={12} />
                  Logout
                </button>
              </motion.div>

              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
                <motion.div {...fadeUp(0.2)} className="relative shrink-0 self-start sm:self-auto">
                  <div
                    className="rounded-full p-[3px]"
                    style={{ background: `linear-gradient(135deg, ${ABIX.goldLight}, ${ABIX.gold}66 60%, transparent)` }}
                  >
                    {photoURL ? (
                      <img
                        src={photoURL}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-20 w-20 lg:h-28 lg:w-28 rounded-full object-cover border-2 border-charcoal"
                      />
                    ) : (
                      <div className="h-20 w-20 lg:h-28 lg:w-28 rounded-full bg-resin text-ivory font-display text-3xl lg:text-4xl flex items-center justify-center border-2 border-charcoal">
                        {initial}
                      </div>
                    )}
                  </div>
                  {verified && (
                    <span
                      className="absolute bottom-0.5 right-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-charcoal"
                      style={{ backgroundColor: ABIX.gold, color: '#151417' }}
                      title="Verified"
                    >
                      <CheckIcon size={12} strokeWidth={3} />
                    </span>
                  )}
                </motion.div>

                <div className="min-w-0">
                  <motion.p {...fadeUp(0.25)} className="text-sm text-ivory/55">
                    {greeting}
                  </motion.p>
                  {/* Full name: every word in the same gold. The last word stays italic. */}
                  <h1
                    aria-label={fullName}
                    className="mt-1 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight"
                    style={{ color: ABIX.goldLight }}
                  >
                    {nameParts.map((w, i) => {
                      const isLast = nameParts.length > 1 && i === nameParts.length - 1;
                      return (
                        <span
                          key={`${w}-${i}`}
                          aria-hidden="true"
                          className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em] pr-[0.12em] mr-[0.06em]"
                        >
                          <motion.span
                            className={`inline-block ${isLast ? 'italic' : ''}`}
                            style={{ color: ABIX.goldLight }}
                            initial={reduce ? false : { y: '115%' }}
                            animate={{ y: 0 }}
                            transition={{ duration: 0.9, ease: EASE, delay: 0.35 + i * 0.12 }}
                          >
                            {w}
                          </motion.span>
                        </span>
                      );
                    })}
                  </h1>

                  <motion.div
                    {...fadeUp(0.7)}
                    className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ivory/60 font-sans"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/15 px-3 py-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${verified ? 'bg-resin-light' : 'bg-ivory/30'}`} />
                      {verified ? 'Verified' : 'Not verified'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-ivory/15 px-3 py-1">
                      <CalendarDays size={12} className="text-gold-light" />
                      Member since {memberSince}
                    </span>
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-ivory/15 px-3 py-1">
                      <Mail size={12} className="shrink-0 text-gold-light" />
                      <span className="truncate">{user.email}</span>
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* at-a-glance row */}
              <motion.div {...fadeUp(0.85)} className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SpotlightCard>
                  <div className="flex items-center gap-5 p-5 sm:p-6">
                    <div className="relative h-20 w-20 shrink-0">
                      <CompletenessRing pct={pct} />
                      <span className="absolute inset-0 flex items-center justify-center font-sans text-lg tabular-nums lining-nums text-ivory">
                        {pct}%
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="label-meta text-ivory/45">Profile</span>
                      {nextStep ? (
                        <>
                          <p className="mt-1.5 text-sm text-ivory/80">Almost there.</p>
                          <button
                            type="button"
                            onClick={nextStep.go}
                            className={`mt-0.5 inline-flex items-center gap-1 min-h-[32px] text-sm underline underline-offset-4 text-left ${FOCUS_RING}`}
                            style={{ color: ABIX.goldLight }}
                          >
                            {nextStep.label} <ArrowRight size={13} className="shrink-0" />
                          </button>
                        </>
                      ) : (
                        <p className="mt-1.5 text-sm text-ivory/80">Everything is in place.</p>
                      )}
                    </div>
                  </div>
                </SpotlightCard>

                <StatTile
                  icon={Package}
                  label="Orders"
                  value={ordersCount}
                  hint={latestStatus ? `Latest: ${latestStatus}` : ordersLoading ? 'Loading…' : 'None placed yet'}
                  onClick={() => setActiveSection('orders')}
                />
                <StatTile
                  icon={Heart}
                  label="Wishlist"
                  value={wishlistCount}
                  hint={wishlistCount === 1 ? 'Saved for later' : 'Saved for later'}
                  onClick={() => setActiveSection('wishlist')}
                />
              </motion.div>
            </div>
          </div>

          {/* ============ NAVIGATION ============ */}
          <div className="sticky top-[78px] lg:top-[92px] z-20 backdrop-blur-xl bg-charcoal/70 border-y border-ivory/10">
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
              <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar" aria-label="Account sections">
                {navItems.map((item) => {
                  const badge = badgeFor(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveSection(item.key)}
                      className={`relative whitespace-nowrap px-4 sm:px-5 py-4 label-meta transition-colors ${
                        activeSection === item.key ? 'text-ivory' : 'text-ivory/40 hover:text-ivory/80'
                      }`}
                    >
                      {item.label}
                      {badge !== null && (
                        <span
                          className="ml-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-sans text-[10px] tracking-normal tabular-nums lining-nums"
                          style={{ backgroundColor: ABIX.gold25, color: ABIX.goldLight }}
                        >
                          {badge}
                        </span>
                      )}
                      {activeSection === item.key && (
                        <motion.span
                          layoutId="account-nav-underline"
                          className="absolute left-4 right-4 sm:left-5 sm:right-5 -bottom-px h-px bg-gold-light"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* ============ CONTENT ============ */}
          <div className="mx-auto max-w-6xl px-6 lg:px-10 py-12 lg:py-16">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeSection}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                {activeSection === 'profile' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                    <div className="lg:col-span-8 min-w-0 space-y-8">
                      <div>
                        <div className="flex items-center justify-between gap-4">
                          <h2 className="font-display text-2xl text-ivory">Profile</h2>
                          {!editing && (
                            <button onClick={startEditing} className={`${pillBtn} shrink-0`}>
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
                            <div className="mt-8">
                              <GroupLabel>Personal information</GroupLabel>
                              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoField icon={User} label="Full Name" value={fullName} />
                                <InfoField icon={Mail} label="Email" value={user.email} />
                                <InfoField icon={Phone} label="Phone" value={profile?.phone} />
                                <InfoField icon={PhoneCall} label="Alternate Phone" value={profile?.alternatePhone} />
                                <InfoField icon={CalendarDays} label="Member Since" value={memberSince} />
                                <InfoField
                                  icon={KeyRound}
                                  label="Sign-in Method"
                                  value={isGoogleUser ? 'Google' : 'Email & Password'}
                                />
                              </dl>
                            </div>

                            <div className="mt-10">
                              <GroupLabel>Address</GroupLabel>
                              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <InfoField icon={MapPin} label="Address" value={profile?.address} wide />
                                <InfoField icon={Building2} label="City" value={profile?.city} />
                                <InfoField icon={Flag} label="State" value={profile?.state} />
                                <InfoField icon={Hash} label="Pincode" value={profile?.pincode} />
                                <InfoField icon={Globe} label="Country" value={profile?.country} />
                              </dl>
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
                              <GroupLabel>Personal information</GroupLabel>
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              <GroupLabel>Address</GroupLabel>
                              <div className="mt-4 space-y-4">
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
                        <SpotlightCard>
                          <div className="p-6 sm:p-7">
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
                        </SpotlightCard>
                      )}
                    </div>

                    <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-44">
                      <LatestOrderCard
                        orders={orders}
                        loading={ordersLoading}
                        navigate={navigate}
                        onSeeAll={() => setActiveSection('orders')}
                      />
                      <HelpCard navigate={navigate} />
                    </aside>
                  </div>
                )}

                {activeSection === 'orders' && (
                  <OrdersPanel orders={orders} loading={ordersLoading} error={ordersError} navigate={navigate} />
                )}

                {activeSection === 'addresses' && (
                  <AddressesPanel
                    profile={profile}
                    onEdit={() => {
                      setActiveSection('profile');
                      startEditing();
                    }}
                  />
                )}

                {activeSection === 'wishlist' && (
                  <WishlistPanel wishlist={wishlist} toggleWishlist={toggleWishlist} navigate={navigate} />
                )}

                {activeSection === 'community' && communitySection && <CommunityPanel section={communitySection} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}