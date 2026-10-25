// src/pages/Support.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import { AlertCircle, Check, Loader2, Mail, MessageCircle, Send } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { gsap } from '@/lib/gsap';
import PageTransition, { whenPageReady } from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import FAQAccordion from '@/components/abix/FAQAccordion';
import LeafShadow from '@/components/abix/home/LeafShadow';
import ChapterRail from '@/components/abix/ChapterRail';
import HelpFinder from '@/components/abix/support/HelpFinder';
import OrderTimeline from '@/components/abix/support/OrderTimeline';
import { ABOUT_CSS } from '@/components/abix/about/aboutMotion';
import { useInViewReveal } from '@/hooks/useInViewReveal';
import { supportOptions, faqs, orderSteps, getProductBySlug, ritualBundles } from '@/data/products';
import { useAuth } from '@/lib/AuthContext';
import { getOrderForTracking, statusToDetailIndex } from '@/lib/orderUtils';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

import supportHero from '@/assets/support/support-hero.png';
import supportHelpCards from '@/assets/support/support-help-cards.png';
import supportTracking from '@/assets/support/support-tracking.png';
import supportFaq from '@/assets/support/support-faq.png';
import supportContact from '@/assets/support/support-contact.png';

const WHATSAPP_URL = 'https://wa.me/917680014597';
const SUPPORT_EMAIL = 'abixmartsupport@gmail.com';
const ERROR = '#C98473';
const ORDER_ID_RE = /^ABX-\d{8}-[A-Z0-9]{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CHAPTERS = [
  { id: 'support-hero', label: 'Welcome' },
  { id: 'help', label: 'Find your path' },
  { id: 'tracking', label: 'Track an order' },
  { id: 'faq', label: 'Questions' },
  { id: 'inquiry', label: 'Write to us' },
  { id: 'contact', label: 'Reach us' },
];
const HEADLINE = ['How', 'can', 'we', 'help?'];

// One image per help option (5 real assets for 6 options: the hero repeats once,
// on options that are not next to each other).
const FINDER_IMAGES = [supportHero, supportHelpCards, supportTracking, supportContact, supportFaq, supportHero].map((src) => ({
  src,
  alt: '',
}));

const EMPTY_FORM = { name: '', email: '', phone: '', productInterest: '', quantity: '', message: '' };
const FIELD_IDS = {
  name: 'inq-name',
  email: 'inq-email',
  phone: 'inq-phone',
  productInterest: 'inq-interest',
  quantity: 'inq-quantity',
  message: 'inq-message',
};

function validateInquiry(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Please enter your name.';
  if (!f.email.trim()) e.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(f.email.trim())) e.email = "That email address doesn't look right.";
  const digits = f.phone.replace(/\D/g, '');
  if (f.phone.trim() && (digits.length < 7 || digits.length > 15)) e.phone = 'Enter a valid phone number, or leave it blank.';
  if (f.quantity && !(Number(f.quantity) > 0)) e.quantity = 'Quantity must be 1 or more.';
  if (!f.message.trim()) e.message = 'Please write a short message.';
  else if (f.message.trim().length < 10) e.message = 'Please add a little more detail (at least 10 characters).';
  return e;
}

const jumpTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// A gold line that drops from one chapter into the next.
function NextStep({ to, children }) {
  const go = (e) => {
    const el = document.getElementById(to);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <div className="mt-14 lg:mt-20 flex justify-center">
      <a href={`#${to}`} onClick={go} className={`group inline-flex flex-col items-center gap-3 min-h-[44px] ${FOCUS_RING}`}>
        <span className="text-[11px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.goldLight }}>
          {children}
        </span>
        <span
          aria-hidden="true"
          className="block h-10 w-px transition-all duration-500 group-hover:h-14"
          style={{ background: `linear-gradient(180deg, ${ABIX.gold}, transparent)` }}
        />
      </a>
    </div>
  );
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="label-meta mb-1.5 block" style={{ color: ABIX.ivory70 }}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: ERROR }}>
          <AlertCircle size={12} className="shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

export default function Support() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const rootRef = useRef(null);
  const heroImgRef = useRef(null);

  const [faqOpen, setFaqOpen] = useState(0);

  // ── order tracking (real lookup, unchanged logic) ─────────────────
  const [orderId, setOrderId] = useState('');
  const [tracked, setTracked] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackKind, setTrackKind] = useState(''); // invalid | login | notfound | error
  const [trackedOrder, setTrackedOrder] = useState(null);

  // Looks up one order by orderId, scoped to the signed-in customer. Shared by the
  // manual "Track order" submit, the help finder, and the auto-lookup that runs
  // when Support is opened from Profile → Orders with ?orderId=... in the URL.
  const runTrack = async (idToTrack) => {
    const raw = (idToTrack ?? orderId).trim();
    setTrackedOrder(null);

    if (!raw) {
      setTracked(true);
      setTrackKind('invalid');
      setTrackError('Enter your order ID to continue.');
      return;
    }
    const id = raw.toUpperCase();
    setOrderId(id);
    if (!ORDER_ID_RE.test(id)) {
      setTracked(true);
      setTrackKind('invalid');
      setTrackError("That doesn't look like an order ID. It looks like ABX-20260927-7K4M2.");
      return;
    }
    if (!user) {
      setTracked(true);
      setTrackKind('login');
      setTrackError('Please log in to track your order.');
      return;
    }

    setTracking(true);
    setTrackError('');
    setTrackKind('');
    try {
      const order = await getOrderForTracking(id, user.uid);
      if (!order) {
        setTrackedOrder(null);
        setTrackKind('notfound');
        setTrackError('Order not found.');
      } else {
        setTrackedOrder(order);
      }
      setTracked(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Order tracking lookup failed:', err?.code, err?.message, err);
      setTrackedOrder(null);
      setTrackKind('error');
      setTrackError('Something went wrong looking up that order. Please try again.');
      setTracked(true);
    } finally {
      setTracking(false);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    runTrack(orderId);
  };

  // Prefill the order ID input from ?orderId=... (the link Profile → Orders →
  // "Track Order" sends customers here with).
  useEffect(() => {
    const qid = searchParams.get('orderId');
    if (!qid) return;
    setOrderId(qid);
    // <ScrollToTop /> resets scroll on every route change; run after it settles.
    requestAnimationFrame(() => {
      document.getElementById('tracking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-run the lookup once we know who's asking. Guarded by a ref so it only
  // fires once per page load, not on every auth refresh.
  const autoTrackedRef = useRef(false);
  useEffect(() => {
    const qid = searchParams.get('orderId');
    if (!qid || autoTrackedRef.current || !user) return;
    autoTrackedRef.current = true;
    runTrack(qid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const detailIndex = trackedOrder ? statusToDetailIndex(trackedOrder.orderStatus) : null;

  // ── inquiry form (writes to Firestore `inquiries`, same schema as before) ──
  const [inquiryForm, setInquiryForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  // Product context carried in from a product page's "Send Inquiry" action via
  // ?product=slug&quantity=n. Kept separate so the inquiry always records the real productId.
  const [productContext, setProductContext] = useState(null);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  // Prefill from ?product=&quantity= — runs once on mount.
  useEffect(() => {
    const slug = searchParams.get('product');
    const quantityParam = searchParams.get('quantity');
    const ritualParam = searchParams.get('ritual');
    if (!slug) return;
    const product = getProductBySlug(slug);
    if (!product) return;

    const ritual = ritualParam ? ritualBundles.find((b) => b.id === ritualParam) : null;
    const quantity =
      quantityParam && Number(quantityParam) > 0 ? String(Number(quantityParam)) : ritual ? String(ritual.jars) : '1';
    const interestLabel = ritual ? `${product.name} — ${ritual.name}` : product.name;

    setProductContext({ id: product.id, slug: product.slug, name: product.name });
    setInquiryForm((prev) => ({
      ...prev,
      productInterest: interestLabel,
      quantity,
      message: ritual
        ? `I am interested in ${product.name} — ${ritual.name}. Quantity requested: ${quantity}.`
        : `I am interested in ${product.name}. Quantity requested: ${quantity}.`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill contact fields from the authenticated user, once, without overwriting typed values.
  const authPrefilledRef = useRef(false);
  useEffect(() => {
    if (!user || authPrefilledRef.current) return;
    authPrefilledRef.current = true;
    setInquiryForm((prev) => ({
      ...prev,
      email: prev.email || user.email || '',
      name: prev.name || profile?.fullName || '',
      phone: prev.phone || profile?.phone || '',
    }));
  }, [user, profile]);

  const updateField = (key) => (e) => {
    const value = e.target.value;
    setInquiryForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };
  const blurField = (key) => () => {
    const err = validateInquiry(inquiryForm)[key];
    setFieldErrors((prev) => ({ ...prev, [key]: err }));
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (inquirySubmitting) return;

    const errors = validateInquiry(inquiryForm);
    setFieldErrors(errors);
    const firstBad = Object.keys(errors)[0];
    if (firstBad) {
      setInquiryError('Please check the highlighted fields.');
      document.getElementById(FIELD_IDS[firstBad])?.focus();
      return;
    }

    setInquiryError('');
    setInquirySubmitting(true);
    try {
      const quantityNumber = inquiryForm.quantity ? Number(inquiryForm.quantity) : null;
      await addDoc(collection(db, 'inquiries'), {
        name: inquiryForm.name.trim(),
        email: inquiryForm.email.trim(),
        phone: inquiryForm.phone.trim(),
        productInterest: inquiryForm.productInterest.trim(),
        productId: productContext?.id || null,
        quantity: Number.isFinite(quantityNumber) && quantityNumber > 0 ? quantityNumber : null,
        message: inquiryForm.message.trim(),
        source: productContext ? 'product-inquiry' : 'website',
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setInquirySubmitted(true);
      setInquiryForm(EMPTY_FORM);
      setFieldErrors({});
      setProductContext(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ABIXMART] Inquiry submission failed:', err?.code, err?.message, err);
      setInquiryError(
        'Something went wrong sending your message. Please try again, or reach us on WhatsApp below.'
      );
    } finally {
      setInquirySubmitting(false);
    }
  };

  // ── page motion ──────────────────────────────────────────────────
  useInViewReveal(rootRef, []);

  // Hero intro: headline words rise out of their masks once the page is revealed.
  useGSAP(
    (context, contextSafe) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
      const words = context.selector('[data-word]');
      const fades = context.selector('[data-hero-fade]');
      gsap.set(words, { yPercent: 115 });
      gsap.set(fades, { autoAlpha: 0, y: 18 });
      gsap.set(heroImgRef.current, { scale: 1.12 });
      return whenPageReady(
        contextSafe(() => {
          gsap
            .timeline({ defaults: { ease: 'power3.out' } })
            .to(heroImgRef.current, { scale: 1, duration: 2.2, ease: 'power2.out' }, 0)
            .to(words, { yPercent: 0, duration: 1, stagger: 0.12 }, 0.2)
            .to(fades, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, 0.8);
        })
      );
    },
    { scope: rootRef }
  );

  const askFaq = (i) => {
    setFaqOpen(i);
    window.setTimeout(() => {
      document.getElementById(`faq-item-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
  };
  const trackFromFinder = (id) => {
    setOrderId(id);
    jumpTo('tracking');
    runTrack(id);
  };

  const inputBase =
    'w-full bg-transparent border text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-[#C7AE7D] transition-colors';
  const borderFor = (err) => (err ? 'border-[#C98473]' : 'border-[rgba(230,225,213,0.25)]');
  const btnGold = `inline-flex items-center justify-center gap-2 h-14 px-8 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full transition-colors duration-300 hover:brightness-110 disabled:opacity-60 ${FOCUS_RING}`;
  const btnGhost = `inline-flex items-center justify-center gap-2 h-14 px-8 text-[12px] font-semibold tracking-luxe-sm uppercase rounded-full border transition-colors duration-300 hover:bg-[rgba(199,174,125,0.08)] ${FOCUS_RING}`;

  // ── order result area ────────────────────────────────────────────
  let trackResult;
  if (tracking) {
    trackResult = (
      <div role="status" className="flex items-center gap-3 text-sm" style={{ color: ABIX.ivory70 }}>
        <Loader2 size={16} className="animate-spin" style={{ color: ABIX.goldLight }} /> Looking up your order…
      </div>
    );
  } else if (tracked && trackError) {
    trackResult = (
      <div role="alert" className="border p-6" style={{ borderColor: ABIX.ivory12, background: `${FOREST.deepest}CC` }}>
        <p className="font-display text-xl" style={{ color: ABIX.ivory }}>{trackError}</p>
        {trackKind === 'notfound' && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
            Check the ID, and make sure you are logged in to the account that placed the order. Your orders are listed in Profile → Orders.
          </p>
        )}
        {trackKind === 'login' && (
          <Link to="/login" className={`mt-4 inline-flex items-center min-h-[44px] text-sm underline underline-offset-4 ${FOCUS_RING}`} style={{ color: ABIX.goldLight }}>
            Log in
          </Link>
        )}
        {trackKind === 'error' && (
          <button
            type="button"
            onClick={() => runTrack(orderId)}
            className={`mt-4 inline-flex items-center min-h-[44px] text-sm underline underline-offset-4 ${FOCUS_RING}`}
            style={{ color: ABIX.goldLight }}
          >
            Try again
          </button>
        )}
      </div>
    );
  } else if (tracked && trackedOrder) {
    trackResult = <OrderTimeline order={trackedOrder} detailIndex={detailIndex} steps={orderSteps} />;
  } else {
    trackResult = (
      <p className="text-sm leading-relaxed max-w-sm" style={{ color: ABIX.ivory45 }}>
        Once you look up an order, its journey appears here. It reflects your order's real status.
      </p>
    );
  }

  return (
    <PageTransition>
      <div ref={rootRef}>
        <style>{ABOUT_CSS}</style>
        <ChapterRail chapters={CHAPTERS} label="Support page chapters" />

        {/* ============ 01 · HERO ============ */}
        <section
          id="support-hero"
          aria-labelledby="support-title"
          className="relative min-h-[82svh] flex items-end overflow-hidden grain"
          style={{ background: ABIX.obsidian }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <img
              ref={heroImgRef}
              src={supportHero}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
              style={{ opacity: 0.55 }}
            />
          </div>
          <div
            aria-hidden="true"
            className="abix-amber absolute -left-[10%] top-[8%] h-[70%] w-[70%] pointer-events-none"
            style={{ background: `radial-gradient(closest-side, ${ABIX.gold25} 0%, transparent 70%)` }}
          />
          <LeafShadow side="left" opacity={0.09} />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(0deg, ${ABIX.obsidian} 0%, ${ABIX.obsidian}99 40%, ${ABIX.obsidian}26 100%)` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: `linear-gradient(90deg, ${ABIX.obsidian}CC 0%, ${ABIX.obsidian}33 55%, transparent 100%)` }}
          />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 pt-36 pb-16 lg:pb-24 w-full">
            <div className="max-w-2xl">
              <div data-hero-fade><Eyebrow light>ABIXMART Support</Eyebrow></div>
              <h1
                id="support-title"
                className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1] tracking-tight"
                style={{ color: ABIX.ivory }}
              >
                {HEADLINE.map((w, i) => (
                  <span key={w} className="inline-block overflow-hidden align-bottom pb-[0.14em] -mb-[0.14em] mr-[0.22em]">
                    <span
                      data-word
                      className={`inline-block ${i === HEADLINE.length - 1 ? 'italic' : ''}`}
                      style={i === HEADLINE.length - 1 ? { color: ABIX.goldLight } : undefined}
                    >
                      {w}
                    </span>
                  </span>
                ))}
              </h1>
              <p data-hero-fade className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: ABIX.ivory70 }}>
                We designed this to be simple, for everyone. Choose what you need below, or reach us directly.
              </p>
              <div data-hero-fade className="mt-9 flex flex-col sm:flex-row gap-3">
                <a
                  href="#help"
                  onClick={(e) => { e.preventDefault(); jumpTo('help'); }}
                  className={`group ${btnGold}`}
                  style={{ background: ABIX.gold, color: FOREST.deepest }}
                >
                  Choose what you need
                  <span className="ml-1 transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true">↓</span>
                </a>
                <a
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); jumpTo('contact'); }}
                  className={btnGhost}
                  style={{ color: ABIX.goldLight, borderColor: `${ABIX.goldLight}66` }}
                >
                  Reach us directly
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============ 02 · HELP FINDER ============ */}
        <section
          id="help"
          aria-labelledby="help-title"
          className="relative overflow-hidden grain scroll-mt-20"
          style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deep} 14%, ${FOREST.mid} 60%, ${FOREST.deep} 100%)` }}
        >
          <LeafShadow side="right" opacity={0.05} className="inset-x-0 top-0 h-[60%]" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28">
            <div className="max-w-xl">
              <div data-reveal><Eyebrow light>01 · Find your path</Eyebrow></div>
              <h2
                id="help-title"
                data-reveal
                data-reveal-delay="0.08"
                className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.03] tracking-tight"
                style={{ color: ABIX.ivory }}
              >
                What do you need?
              </h2>
              <p data-reveal data-reveal-delay="0.16" className="mt-5 text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>
                Pick the one that sounds like you. We'll point you to the right place.
              </p>
            </div>

            <div data-reveal className="mt-12 lg:mt-16">
              <HelpFinder
                options={supportOptions}
                images={FINDER_IMAGES}
                faqs={faqs}
                onTrack={trackFromFinder}
                onAskFaq={askFaq}
                whatsappUrl={WHATSAPP_URL}
              />
            </div>
            <NextStep to="tracking">Already ordered? Track it</NextStep>
          </div>
        </section>

        {/* ============ 03 · ORDER TRACKING ============ */}
        <section
          id="tracking"
          aria-labelledby="tracking-title"
          className="relative overflow-hidden grain scroll-mt-20"
          style={{ background: `linear-gradient(180deg, ${FOREST.deep} 0%, ${FOREST.deepest} 40%, ${ABIX.obsidian} 100%)` }}
        >
          <img
            src={supportTracking}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            style={{
              opacity: 0.13,
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
            }}
          />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 min-w-0">
              <div data-reveal><Eyebrow light>02 · Order tracking</Eyebrow></div>
              <h2
                id="tracking-title"
                data-reveal
                data-reveal-delay="0.08"
                className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
                style={{ color: ABIX.ivory }}
              >
                Where is my order?
              </h2>
              <p data-reveal data-reveal-delay="0.16" className="mt-4 leading-relaxed" style={{ color: ABIX.ivory70 }}>
                Enter your order ID to see its journey.
              </p>

              <form data-reveal data-reveal-delay="0.24" onSubmit={handleTrack} noValidate className="mt-7">
                <label htmlFor="track-order-id" className="label-meta" style={{ color: ABIX.ivory70 }}>Order ID</label>
                <div className="mt-2 flex flex-col sm:flex-row gap-3">
                  <input
                    id="track-order-id"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. ABX-20260927-7K4M2"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={tracked && trackKind === 'invalid'}
                    aria-describedby="track-help"
                    className={`${inputBase} h-14 px-5 ${borderFor(tracked && trackKind === 'invalid')}`}
                  />
                  <button
                    type="submit"
                    disabled={tracking}
                    className={`${btnGold} shrink-0`}
                    style={{ background: ABIX.gold, color: FOREST.deepest }}
                  >
                    {tracking ? (<><Loader2 size={15} className="animate-spin" /> Tracking…</>) : 'Track order'}
                  </button>
                </div>
                <p id="track-help" className="mt-2 text-xs" style={{ color: ABIX.ivory45 }}>
                  You'll find your order ID in Profile → Orders.
                </p>
              </form>
            </div>

            <div className="lg:col-span-7 min-w-0" aria-live="polite">{trackResult}</div>
          </div>
          <div className="relative z-10 pb-20 lg:pb-28 -mt-6"><NextStep to="faq">Still wondering? Read the answers</NextStep></div>
        </section>

        {/* ============ 04 · FAQ ============ */}
        <section
          id="faq"
          aria-labelledby="faq-title"
          className="relative overflow-hidden grain scroll-mt-20"
          style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deep} 18%, ${FOREST.mid} 60%, ${FOREST.deep} 100%)` }}
        >
          <LeafShadow side="left" opacity={0.05} className="inset-x-0 top-0 h-[60%]" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-12 lg:gap-14">
            <div className="lg:col-span-4 min-w-0">
              <div data-reveal><Eyebrow light>03 · Questions</Eyebrow></div>
              <h2
                id="faq-title"
                data-reveal
                data-reveal-delay="0.08"
                className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
                style={{ color: ABIX.ivory }}
              >
                Honest answers.
              </h2>
              <p data-reveal data-reveal-delay="0.16" className="mt-6 leading-relaxed" style={{ color: ABIX.ivory70 }}>
                If something isn't covered here, the ABIXMART Assist is always one tap away.
              </p>

              <div data-reveal className="mt-8 relative overflow-hidden">
                <img src={supportFaq} alt="" aria-hidden="true" loading="lazy" className="h-44 w-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${FOREST.deepest}55, ${FOREST.deepest}F2 75%)` }} />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="label-meta" style={{ color: ABIX.goldLight }}>Disclaimer</span>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: 'rgba(230,225,213,0.8)' }}>
                    ABIXMART Shilajit is a traditional wellness product, not a medicine. Statements have not been evaluated by any medical
                    authority. Consult a qualified healthcare professional before use, especially if pregnant, nursing, or managing a
                    health condition.
                  </p>
                </div>
              </div>
            </div>

            <div data-reveal className="lg:col-span-8 min-w-0">
              <FAQAccordion items={faqs} openIndex={faqOpen} onOpenChange={setFaqOpen} />
            </div>
          </div>
          <div className="relative z-10 pb-20 lg:pb-28 -mt-6"><NextStep to="inquiry">Not here? Write to us</NextStep></div>
        </section>

        {/* ============ 05 · INQUIRY ============ */}
        <section
          id="inquiry"
          aria-labelledby="inquiry-title"
          className="relative overflow-hidden grain scroll-mt-20"
          style={{ background: `linear-gradient(180deg, ${FOREST.deep} 0%, ${ABIX.obsidian} 25%, ${ABIX.obsidian} 100%)` }}
        >
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 py-20 lg:py-28 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-12 lg:gap-16">
            {/* left: ties the form back to the FAQ and forward to contact */}
            <div className="lg:col-span-4 min-w-0">
              <div data-reveal><Eyebrow light>{productContext ? '04 · Product inquiry' : '04 · Write to us'}</Eyebrow></div>
              <h2
                id="inquiry-title"
                data-reveal
                data-reveal-delay="0.08"
                className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
                style={{ color: ABIX.ivory }}
              >
                {productContext ? `Ask about ${productContext.name}.` : 'Ask us anything.'}
              </h2>
              <p data-reveal data-reveal-delay="0.16" className="mt-4 leading-relaxed" style={{ color: ABIX.ivory70 }}>
                {productContext
                  ? "We'll follow up on availability, pricing, and next steps directly."
                  : 'Have a question about ingredients, sourcing, or an order? Send us a note and we will get back to you directly.'}
              </p>

              {productContext && (
                <div className="mt-6 flex items-center gap-8 border px-5 py-4" style={{ borderColor: ABIX.ivory12, background: `${FOREST.deepest}99` }}>
                  <div>
                    <span className="label-meta block" style={{ color: ABIX.ivory45 }}>Product</span>
                    <span className="mt-0.5 block font-display text-lg" style={{ color: ABIX.ivory }}>{productContext.name}</span>
                  </div>
                  <div>
                    <span className="label-meta block" style={{ color: ABIX.ivory45 }}>Quantity</span>
                    <span className="mt-0.5 block font-display text-lg" style={{ color: ABIX.ivory }}>{inquiryForm.quantity || '1'}</span>
                  </div>
                </div>
              )}

              <div data-reveal className="mt-8 border-t pt-6" style={{ borderColor: ABIX.ivory12 }}>
                <p className="label-meta" style={{ color: ABIX.gold }}>Before you write</p>
                <ul className="mt-3">
                  {faqs.slice(0, 3).map((f, i) => (
                    <li key={f.q} className="list-none">
                      <button
                        type="button"
                        onClick={() => askFaq(i)}
                        className={`w-full text-left py-2.5 min-h-[44px] text-sm underline-offset-4 hover:underline ${FOCUS_RING}`}
                        style={{ color: ABIX.ivory70 }}
                      >
                        {f.q}
                      </button>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); jumpTo('contact'); }}
                  className={`mt-3 inline-flex items-center min-h-[44px] text-[11px] font-semibold uppercase tracking-luxe-sm underline-offset-4 hover:underline ${FOCUS_RING}`}
                  style={{ color: ABIX.goldLight }}
                >
                  Prefer to talk? →
                </a>
              </div>
            </div>

            {/* right: the form */}
            <div data-reveal className="lg:col-span-8 min-w-0">
              <div className="group/form relative">
                <div
                  aria-hidden="true"
                  className="absolute -inset-6 pointer-events-none opacity-0 group-focus-within/form:opacity-100 transition-opacity duration-700"
                  style={{ background: `radial-gradient(60% 60% at 50% 40%, ${ABIX.gold15}, transparent 70%)` }}
                />
                {inquirySubmitted ? (
                  <div
                    role="status"
                    className="relative border p-7 flex items-start gap-4"
                    style={{ borderColor: ABIX.ivory12, background: `${FOREST.deepest}CC` }}
                  >
                    <span className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-full" style={{ background: ABIX.gold, color: FOREST.deepest }}>
                      <Check size={18} />
                    </span>
                    <div>
                      <p className="font-display text-xl" style={{ color: ABIX.ivory }}>Thank you — your inquiry is on its way.</p>
                      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
                        We have your message and will follow up with you directly. For a quicker conversation, you can also reach us on WhatsApp below.
                      </p>
                      <button
                        type="button"
                        onClick={() => setInquirySubmitted(false)}
                        className={`mt-4 min-h-[44px] text-sm underline underline-offset-4 ${FOCUS_RING}`}
                        style={{ color: ABIX.goldLight }}
                      >
                        Send another inquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="relative space-y-5" noValidate>
                    {inquiryError && (
                      <div role="alert" className="flex items-start gap-2 border text-sm px-4 py-3" style={{ borderColor: `${ERROR}66`, background: 'rgba(201,132,115,0.08)', color: ERROR }}>
                        <AlertCircle size={16} className="mt-0.5 shrink-0" /> {inquiryError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field id={FIELD_IDS.name} label="Name" error={fieldErrors.name}>
                        <input
                          id={FIELD_IDS.name}
                          value={inquiryForm.name}
                          onChange={updateField('name')}
                          onBlur={blurField('name')}
                          autoComplete="name"
                          placeholder="Your name"
                          aria-invalid={Boolean(fieldErrors.name)}
                          aria-describedby={fieldErrors.name ? `${FIELD_IDS.name}-error` : undefined}
                          className={`${inputBase} h-14 px-5 ${borderFor(fieldErrors.name)}`}
                        />
                      </Field>
                      <Field id={FIELD_IDS.phone} label="Phone (optional)" error={fieldErrors.phone}>
                        <input
                          id={FIELD_IDS.phone}
                          type="tel"
                          value={inquiryForm.phone}
                          onChange={updateField('phone')}
                          onBlur={blurField('phone')}
                          autoComplete="tel"
                          placeholder="10-digit mobile"
                          aria-invalid={Boolean(fieldErrors.phone)}
                          aria-describedby={fieldErrors.phone ? `${FIELD_IDS.phone}-error` : undefined}
                          className={`${inputBase} h-14 px-5 ${borderFor(fieldErrors.phone)}`}
                        />
                      </Field>
                    </div>

                    <Field id={FIELD_IDS.email} label="Email" error={fieldErrors.email}>
                      <input
                        id={FIELD_IDS.email}
                        type="email"
                        value={inquiryForm.email}
                        onChange={updateField('email')}
                        onBlur={blurField('email')}
                        autoComplete="email"
                        placeholder="you@example.com"
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? `${FIELD_IDS.email}-error` : undefined}
                        className={`${inputBase} h-14 px-5 ${borderFor(fieldErrors.email)}`}
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Field id={FIELD_IDS.productInterest} label="What are you interested in? (optional)" error={fieldErrors.productInterest}>
                        <input
                          id={FIELD_IDS.productInterest}
                          value={inquiryForm.productInterest}
                          onChange={updateField('productInterest')}
                          placeholder="e.g. Himalayan Shilajit Resin"
                          className={`${inputBase} h-14 px-5 ${borderFor(fieldErrors.productInterest)}`}
                        />
                      </Field>
                      <Field id={FIELD_IDS.quantity} label="Quantity (optional)" error={fieldErrors.quantity}>
                        <input
                          id={FIELD_IDS.quantity}
                          type="number"
                          min="1"
                          inputMode="numeric"
                          value={inquiryForm.quantity}
                          onChange={updateField('quantity')}
                          onBlur={blurField('quantity')}
                          placeholder="1"
                          aria-invalid={Boolean(fieldErrors.quantity)}
                          aria-describedby={fieldErrors.quantity ? `${FIELD_IDS.quantity}-error` : undefined}
                          className={`${inputBase} h-14 px-5 ${borderFor(fieldErrors.quantity)}`}
                        />
                      </Field>
                    </div>

                    <Field id={FIELD_IDS.message} label="Message" error={fieldErrors.message}>
                      <textarea
                        id={FIELD_IDS.message}
                        value={inquiryForm.message}
                        onChange={updateField('message')}
                        onBlur={blurField('message')}
                        placeholder="How can we help?"
                        rows={5}
                        aria-invalid={Boolean(fieldErrors.message)}
                        aria-describedby={fieldErrors.message ? `${FIELD_IDS.message}-error` : undefined}
                        className={`${inputBase} px-5 py-4 resize-none ${borderFor(fieldErrors.message)}`}
                      />
                    </Field>

                    <button
                      type="submit"
                      disabled={inquirySubmitting}
                      className={`${btnGold} w-full sm:w-auto`}
                      style={{ background: ABIX.gold, color: FOREST.deepest }}
                    >
                      {inquirySubmitting ? (<><Loader2 size={16} className="animate-spin" /> Sending…</>) : (<><Send size={16} /> Send inquiry</>)}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
          <div className="relative z-10 pb-16 lg:pb-24 -mt-6"><NextStep to="contact">Or reach us directly</NextStep></div>
        </section>

        {/* ============ 06 · CONTACT ============ */}
        <section
          id="contact"
          aria-labelledby="contact-title"
          className="relative overflow-hidden grain scroll-mt-20"
          style={{ background: `linear-gradient(180deg, ${ABIX.obsidian} 0%, ${FOREST.deepest} 45%, ${ABIX.obsidian} 100%)` }}
        >
          <img
            src={supportContact}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
            style={{
              opacity: 0.12,
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, transparent 100%)',
            }}
          />
          <LeafShadow side="right" opacity={0.06} className="inset-x-0 top-0 h-[70%]" />

          <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10 py-20 lg:py-32 text-center">
            <div data-reveal className="flex justify-center"><Eyebrow light>05 · Talk to ABIXMART</Eyebrow></div>
            <h2
              id="contact-title"
              data-reveal
              data-reveal-delay="0.08"
              className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight"
              style={{ color: ABIX.ivory }}
            >
              We're here,{' '}
              <span className="italic" style={{ color: ABIX.goldLight }}>the human way.</span>
            </h2>
            <p data-reveal data-reveal-delay="0.16" className="mt-5 leading-relaxed max-w-xl mx-auto" style={{ color: ABIX.ivory70 }}>
              Reach us on WhatsApp for a quick reply, or send us an email. No bots, no runaround.
            </p>

            <div data-reveal data-reveal-delay="0.24" className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className={btnGold}
                style={{ background: ABIX.gold, color: FOREST.deepest }}
              >
                <MessageCircle size={18} /> WhatsApp us
              </a>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className={`${btnGhost} normal-case tracking-normal text-sm sm:text-[13px] break-all sm:break-normal`}
                style={{ color: ABIX.ivory, borderColor: ABIX.ivory25 }}
              >
                <Mail size={17} /> {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
}