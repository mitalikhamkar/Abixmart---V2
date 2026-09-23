// src/pages/Support.jsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  BookOpen,
  Package,
  Truck,
  HelpCircle,
  MessageCircle,
  Check,
  Send,
  ArrowRight,
} from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PageTransition from '@/components/abix/PageTransition';
import Eyebrow from '@/components/abix/Eyebrow';
import FAQAccordion from '@/components/abix/FAQAccordion';
import {
  supportOptions,
  faqs,
  orderSteps,
  getProductBySlug,
  ritualBundles,
} from '@/data/products';
import { useAuth } from '@/lib/AuthContext';

import supportHero from '@/assets/support/support-hero.png';
import supportHelpCards from '@/assets/support/support-help-cards.png';
import supportTracking from '@/assets/support/support-tracking.png';
import supportFaq from '@/assets/support/support-faq.png';
import supportContact from '@/assets/support/support-contact.png';

const iconMap = {
  ShoppingBag,
  BookOpen,
  Package,
  Truck,
  HelpCircle,
  MessageCircle,
};

const INK = '#151417';
const GRAPHITE = '#1E1C1F';
const STONE = '#211E1F';
const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';
const AMBER = '#D3A467';
const AMBER_FILL = '#BE8A4B';

// The "Choose Your Path" section has 6 cards but only 5 support images
// exist in the project — there is no dedicated 6th photo. This maps each
// card to one of the 5 real assets so no two *adjacent* cards repeat the
// same image. supportHero is reused once (cards 0 and 5, which are not
// next to each other) since 6 slots > 5 assets. If a unique 6th image is
// ever added, replace supportHero at the end with the new import.
const CARD_IMAGES = [
  supportHero,       // "I want to buy something"
  supportHelpCards,  // "I want to understand a product"
  supportTracking,   // "I already placed an order"
  supportContact,    // "I want to track my order"
  supportFaq,        // "I have a question"
  supportHero,       // "Talk to ABIXMART" — reused, non-adjacent to card 0
];

export default function Support() {
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const [orderId, setOrderId] = useState('');
  const [tracked, setTracked] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const demoStage = 3;

  const handleTrack = (e) => {
    e.preventDefault();
    setTracked(true);
  };

  // Inquiry form writes to Firestore `inquiries/{inquiryId}` —
  // the same collection and schema the admin panel's Inquiries section reads.
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    productInterest: '',
    quantity: '',
    message: '',
  });

  // Product context carried in from a product page's "Send Inquiry"
  // action (ProductDetail.jsx / ProductQuickView.jsx), via
  // ?product=slug&quantity=n.
  // Kept separate from the form fields so the submitted inquiry
  // always records the real productId, even if the customer edits
  // the product-interest text afterward.
  const [productContext, setProductContext] = useState(null);

  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySubmitted, setInquirySubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [focusedField, setFocusedField] = useState(null);

  // Prefill from ?product=&quantity= — runs once on mount.
  useEffect(() => {
    const slug = searchParams.get('product');
    const quantityParam = searchParams.get('quantity');
    const ritualParam = searchParams.get('ritual');

    if (!slug) return;

    const product = getProductBySlug(slug);

    if (!product) return;

    const ritual = ritualParam
      ? ritualBundles.find((b) => b.id === ritualParam)
      : null;

    const quantity =
      quantityParam && Number(quantityParam) > 0
        ? String(Number(quantityParam))
        : ritual
        ? String(ritual.jars)
        : '1';

    const interestLabel = ritual ? `${product.name} — ${ritual.name}` : product.name;

    setProductContext({
      id: product.id,
      slug: product.slug,
      name: product.name,
    });

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

  // Prefill contact fields from the authenticated user, once,
  // without ever overwriting anything the customer has already typed.
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

  const updateInquiryField = (key) => (e) =>
    setInquiryForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));

  const handleInquirySubmit = async (e) => {
    e.preventDefault();

    if (inquirySubmitting) return;

    if (
      !inquiryForm.name.trim() ||
      !inquiryForm.email.trim() ||
      !inquiryForm.message.trim()
    ) {
      setInquiryError('Please fill in your name, email, and message.');
      return;
    }

    setInquiryError('');
    setInquirySubmitting(true);

    try {
      const quantityNumber = inquiryForm.quantity
        ? Number(inquiryForm.quantity)
        : null;

      await addDoc(collection(db, 'inquiries'), {
        name: inquiryForm.name.trim(),
        email: inquiryForm.email.trim(),
        phone: inquiryForm.phone.trim(),
        productInterest: inquiryForm.productInterest.trim(),
        productId: productContext?.id || null,
        quantity:
          Number.isFinite(quantityNumber) && quantityNumber > 0
            ? quantityNumber
            : null,
        message: inquiryForm.message.trim(),
        source: productContext ? 'product-inquiry' : 'website',
        status: 'new',
        createdAt: serverTimestamp(),
      });

      setInquirySubmitted(true);

      setInquiryForm({
        name: '',
        email: '',
        phone: '',
        productInterest: '',
        quantity: '',
        message: '',
      });

      setProductContext(null);
    } catch (err) {
      console.error(
        '[ABIXMART] Inquiry submission failed:',
        err?.code,
        err?.message,
        err
      );

      setInquiryError(
        'Something went wrong sending your message. Please try again, or reach us on WhatsApp below.'
      );
    } finally {
      setInquirySubmitting(false);
    }
  };

  const inputClass =
    'w-full h-14 px-5 bg-transparent border text-[#F2ECE2] placeholder:text-[#A79C8D] focus:outline-none transition-colors';

  return (
    <PageTransition>
      {/* =========================================================
          HERO
      ========================================================== */}
      <section
        className="relative min-h-[70vh] flex items-end overflow-hidden"
        style={{ background: INK }}
      >
        <motion.div
          initial={{ opacity: 0.3, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 2,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="absolute inset-0"
        >
          <img
            src={supportHero}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-t from-[#151417] via-[#151417]/60 to-[#151417]/15" />

        <div className="absolute inset-0 bg-gradient-to-r from-[#151417]/75 via-[#151417]/15 to-transparent" />

        <div className="absolute inset-0 grain opacity-[0.05]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 pb-16 lg:pb-24 pt-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="max-w-2xl"
          >
            <Eyebrow light>ABIXMART Support</Eyebrow>

            <h1
              className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl leading-[1] tracking-tight"
              style={{ color: IVORY }}
            >
              How can we help?
            </h1>

            <p
              className="mt-6 max-w-xl text-lg leading-relaxed"
              style={{ color: `${IVORY}B3` }}
            >
              We designed this to be simple — for everyone. Choose what you
              need below, or reach us directly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          CHOOSE YOUR PATH
      ========================================================== */}
      <section
        className="py-16 lg:py-24 border-t"
        style={{
          background: GRAPHITE,
          borderColor: `${IVORY}0D`,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {supportOptions.map((o, i) => {
              const Icon = iconMap[o.icon] || HelpCircle;
              const isHovered = hoveredCard === o.key;

              return (
                <motion.div
                  key={o.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{
                    once: true,
                    margin: '-60px',
                  }}
                  transition={{
                    duration: 0.5,
                    delay: (i % 3) * 0.06,
                  }}
                  onMouseEnter={() => setHoveredCard(o.key)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Link
                    to={o.to}
                    onFocus={() => setHoveredCard(o.key)}
                    onBlur={() => setHoveredCard(null)}
                    className="group relative h-full flex flex-col overflow-hidden border transition-colors duration-500"
                    style={{
                      borderColor: isHovered
                        ? `${AMBER}55`
                        : `${IVORY}14`,
                      background: STONE,
                    }}
                  >
<div className="relative h-28 overflow-hidden">
  <div
    className="absolute inset-0 transition-transform duration-700"
    style={{
      backgroundImage: `url(${CARD_IMAGES[i % CARD_IMAGES.length]})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      transform: isHovered ? 'scale(1.08)' : 'scale(1)',
      transitionTimingFunction:
        'cubic-bezier(0.16,1,0.3,1)',
    }}
  />

  <div
    className="absolute inset-0"
    style={{
      background: `${INK}66`,
    }}
  />
</div>

                    <div className="relative flex items-start gap-4 p-6 flex-1">
                      <span className="relative mt-1 shrink-0">
                        <span
                          className="absolute -inset-1.5 rounded-full transition-opacity duration-500"
                          style={{
                            background: `${AMBER}30`,
                            opacity: isHovered ? 1 : 0,
                          }}
                        />

                        <span
                          className="relative h-9 w-9 inline-flex items-center justify-center border transition-colors duration-300"
                          style={{
                            borderColor: isHovered
                              ? AMBER
                              : `${IVORY}30`,
                            color: isHovered ? AMBER : IVORY,
                          }}
                        >
                          <Icon size={16} />
                        </span>
                      </span>

                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-display text-xl leading-tight"
                          style={{ color: IVORY }}
                        >
                          {o.label}
                        </h3>

                        <p
                          className="mt-1.5 text-sm leading-relaxed"
                          style={{ color: MUTED }}
                        >
                          {o.desc}
                        </p>

                        <div
                          className="mt-4 h-px w-full relative overflow-hidden"
                          style={{
                            background: `${IVORY}14`,
                          }}
                        >
                          <span
                            className="absolute inset-y-0 left-0 transition-all duration-500"
                            style={{
                              width: isHovered ? '100%' : '0%',
                              background: AMBER,
                              transitionTimingFunction:
                                'cubic-bezier(0.16,1,0.3,1)',
                            }}
                          />
                        </div>
                      </div>

                      <ArrowRight
                        size={16}
                        className="shrink-0 mt-1 transition-transform duration-300"
                        style={{
                          color: isHovered ? AMBER : MUTED,
                          transform: isHovered
                            ? 'translateX(3px)'
                            : 'translateX(0)',
                        }}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================
          ORDER TRACKING
      ========================================================== */}
      <section
        id="tracking"
        className="relative py-16 lg:py-24 border-t scroll-mt-20 overflow-hidden"
        style={{
          background: INK,
          borderColor: `${IVORY}0D`,
        }}
      >
        <div className="absolute inset-0">
          <img
            src={supportTracking}
            alt=""
            className="h-full w-full object-cover opacity-20"
          />

          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${INK} 40%, ${INK}CC 100%)`,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <Eyebrow light>Order Tracking</Eyebrow>

            <h2
              className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
              style={{ color: IVORY }}
            >
              Where is my order?
            </h2>

            <p
              className="mt-4 leading-relaxed"
              style={{ color: MUTED }}
            >
              Enter your order ID to see its journey.
            </p>

            <form
              onSubmit={handleTrack}
              className="mt-7 flex flex-col sm:flex-row gap-3"
            >
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. ABX-2026-001"
                className={inputClass}
                style={{
                  borderColor: `${IVORY}30`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = AMBER;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = `${IVORY}30`;
                }}
              />

              <button
                type="submit"
                className="h-14 px-8 text-[#151417] text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300 shrink-0"
                style={{
                  background: AMBER_FILL,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = AMBER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = AMBER_FILL;
                }}
              >
                Track order
              </button>
            </form>
          </div>

          <div>
            <div className="flex items-center justify-between max-w-md">
              {['Order', 'In Transit', 'Delivered'].map((label, i) => {
                const active = tracked;

                return (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-2">
                      <motion.span
                        initial={false}
                        animate={{
                          scale: active ? 1 : 0.9,
                          borderColor: active
                            ? AMBER
                            : `${IVORY}30`,
                          color: active ? AMBER : MUTED,
                        }}
                        transition={{
                          duration: 0.5,
                          delay: active ? i * 0.15 : 0,
                        }}
                        className="h-10 w-10 rounded-full border flex items-center justify-center text-xs font-grotesk"
                      >
                        {i + 1}
                      </motion.span>

                      <span
                        className="text-[10px] uppercase tracking-luxe-sm"
                        style={{
                          color: active ? IVORY : MUTED,
                        }}
                      >
                        {label}
                      </span>
                    </div>

                    {i < 2 && (
                      <div
                        className="flex-1 h-px mx-2 relative overflow-hidden"
                        style={{
                          background: `${IVORY}1A`,
                        }}
                      >
                        <motion.span
                          initial={{ width: '0%' }}
                          animate={{
                            width: active ? '100%' : '0%',
                          }}
                          transition={{
                            duration: 0.6,
                            delay: active ? i * 0.15 + 0.2 : 0,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="absolute inset-y-0 left-0"
                          style={{
                            background: AMBER,
                          }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {tracked ? (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 12,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                className="mt-10 border p-6"
                style={{
                  borderColor: `${IVORY}1A`,
                  background: GRAPHITE,
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="font-display text-xl"
                    style={{ color: IVORY }}
                  >
                    Order {orderId || 'ABX-2026-001'}
                  </span>

                  <span
                    className="label-meta"
                    style={{ color: AMBER }}
                  >
                    {orderSteps[demoStage]?.label || 'In Transit'}
                  </span>
                </div>

                {orderSteps.map((s, i) => {
                  const done = i <= demoStage;

                  return (
                    <div
                      key={s.key}
                      className="grid grid-cols-[auto_1fr] gap-4"
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className="h-6 w-6 rounded-full inline-flex items-center justify-center text-[10px]"
                          style={{
                            background: done ? AMBER : 'transparent',
                            color: done ? INK : MUTED,
                            border: done
                              ? 'none'
                              : `1px solid ${IVORY}30`,
                          }}
                        >
                          {done ? <Check size={12} /> : i + 1}
                        </span>

                        {i < orderSteps.length - 1 && (
                          <span
                            className="w-px flex-1 my-1"
                            style={{
                              background: done
                                ? `${AMBER}55`
                                : `${IVORY}1A`,
                            }}
                          />
                        )}
                      </div>

                      <div className="pb-5">
                        <h4
                          className="font-display text-base"
                          style={{
                            color: done ? IVORY : `${IVORY}55`,
                          }}
                        >
                          {s.label}
                        </h4>

                        <p
                          className="text-xs"
                          style={{
                            color: done ? MUTED : `${MUTED}80`,
                          }}
                        >
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <p
                className="mt-10 text-sm max-w-sm"
                style={{ color: MUTED }}
              >
                Once your order is placed, its journey will appear here.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================
          FAQ + TRANSPARENCY
      ========================================================== */}
      <section
        id="faq"
        className="relative py-16 lg:py-24 border-t scroll-mt-20"
        style={{
          background: GRAPHITE,
          borderColor: `${IVORY}0D`,
        }}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-14">
          <div className="lg:col-span-4">
            <Eyebrow light>Questions</Eyebrow>

            <h2
              className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
              style={{ color: IVORY }}
            >
              Honest answers.
            </h2>

            <p
              className="mt-6 leading-relaxed"
              style={{ color: MUTED }}
            >
              If something isn't covered here, the ABIXMART Assist is always
              one tap away.
            </p>

            <div className="mt-8 relative overflow-hidden">
              <img
                src={supportFaq}
                alt=""
                className="h-40 w-full object-cover"
              />

              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(180deg, transparent, ${INK}F0 75%)`,
                }}
              />

              <div className="absolute inset-x-0 bottom-0 p-5">
                <span
                  className="label-meta"
                  style={{ color: AMBER }}
                >
                  Disclaimer
                </span>

                <p
                  className="mt-2 text-xs leading-relaxed"
                  style={{ color: `${IVORY}CC` }}
                >
                  ABIXMART Shilajit is a traditional wellness product, not a
                  medicine. Statements have not been evaluated by any medical
                  authority. Consult a qualified healthcare professional
                  before use, especially if pregnant, nursing, or managing a
                  health condition.
                </p>

                <a
                  href="#inquiry"
                  className="mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-luxe-sm transition-colors"
                  style={{ color: AMBER }}
                >
                  Send an inquiry
                  <ArrowRight size={12} />
                </a>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <FAQAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* =========================================================
          INQUIRY
      ========================================================== */}
      <section
        id="inquiry"
        className="relative py-16 lg:py-24 border-t scroll-mt-20 overflow-hidden"
        style={{
          background: INK,
          borderColor: `${IVORY}0D`,
        }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: focusedField
              ? `radial-gradient(600px circle at 50% 30%, ${AMBER}14, transparent 60%)`
              : `radial-gradient(600px circle at 50% 30%, ${AMBER}00, transparent 60%)`,
          }}
          transition={{ duration: 0.8 }}
        />

        <div className="relative mx-auto max-w-3xl px-6 lg:px-10">
          <Eyebrow light>
            {productContext ? 'Product Inquiry' : 'Talk to ABIXMART'}
          </Eyebrow>

          <h2
            className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
            style={{ color: IVORY }}
          >
            {productContext
              ? `Ask about ${productContext.name}.`
              : 'Ask us anything.'}
          </h2>

          <p
            className="mt-4 leading-relaxed"
            style={{ color: MUTED }}
          >
            {productContext
              ? "We'll follow up on availability, pricing, and next steps directly."
              : "Have a question about ingredients, sourcing, or an order? Send us a note and we'll get back to you directly."}
          </p>

          {productContext && (
            <div
              className="mt-6 flex items-center gap-6 border px-5 py-4"
              style={{
                borderColor: `${IVORY}1A`,
                background: GRAPHITE,
              }}
            >
              <div>
                <span
                  className="label-meta block"
                  style={{ color: MUTED }}
                >
                  Product
                </span>

                <span
                  className="mt-0.5 block font-display text-lg"
                  style={{ color: IVORY }}
                >
                  {productContext.name}
                </span>
              </div>

              <div>
                <span
                  className="label-meta block"
                  style={{ color: MUTED }}
                >
                  Quantity
                </span>

                <span
                  className="mt-0.5 block font-display text-lg"
                  style={{ color: IVORY }}
                >
                  {inquiryForm.quantity || '1'}
                </span>
              </div>
            </div>
          )}

          {inquirySubmitted ? (
            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-8 border p-7 flex items-start gap-4"
              style={{
                borderColor: `${IVORY}1A`,
                background: GRAPHITE,
              }}
            >
              <span
                className="h-10 w-10 shrink-0 inline-flex items-center justify-center"
                style={{
                  background: AMBER,
                  color: INK,
                }}
              >
                <Check size={18} />
              </span>

              <div>
                <p
                  className="font-display text-xl"
                  style={{ color: IVORY }}
                >
                  Thank you — your inquiry is on its way.
                </p>

                <p
                  className="mt-1.5 text-sm leading-relaxed"
                  style={{ color: MUTED }}
                >
                  We typically reply within one business day. You can also
                  reach us on WhatsApp below for a faster response.
                </p>

                <button
                  type="button"
                  onClick={() => setInquirySubmitted(false)}
                  className="mt-4 text-sm underline underline-offset-4 transition-colors"
                  style={{ color: AMBER }}
                >
                  Send another inquiry
                </button>
              </div>
            </motion.div>
          ) : (
            <form
              onSubmit={handleInquirySubmit}
              className="mt-8 space-y-5"
              noValidate
            >
              {inquiryError && (
                <div className="border border-red-400/40 bg-red-950/40 text-red-300 text-sm px-4 py-3">
                  {inquiryError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    className="label-meta mb-1.5 block"
                    style={{ color: MUTED }}
                  >
                    Name
                  </label>

                  <input
                    value={inquiryForm.name}
                    onChange={updateInquiryField('name')}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Your name"
                    className={inputClass}
                    style={{
                      borderColor:
                        focusedField === 'name'
                          ? AMBER
                          : `${IVORY}30`,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="label-meta mb-1.5 block"
                    style={{ color: MUTED }}
                  >
                    Phone (optional)
                  </label>

                  <input
                    value={inquiryForm.phone}
                    onChange={updateInquiryField('phone')}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="10-digit mobile"
                    className={inputClass}
                    style={{
                      borderColor:
                        focusedField === 'phone'
                          ? AMBER
                          : `${IVORY}30`,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="label-meta mb-1.5 block"
                  style={{ color: MUTED }}
                >
                  Email
                </label>

                <input
                  type="email"
                  value={inquiryForm.email}
                  onChange={updateInquiryField('email')}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className={inputClass}
                  style={{
                    borderColor:
                      focusedField === 'email'
                        ? AMBER
                        : `${IVORY}30`,
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    className="label-meta mb-1.5 block"
                    style={{ color: MUTED }}
                  >
                    What are you interested in? (optional)
                  </label>

                  <input
                    value={inquiryForm.productInterest}
                    onChange={updateInquiryField('productInterest')}
                    onFocus={() => setFocusedField('productInterest')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="e.g. Himalayan Shilajit Resin"
                    className={inputClass}
                    style={{
                      borderColor:
                        focusedField === 'productInterest'
                          ? AMBER
                          : `${IVORY}30`,
                    }}
                  />
                </div>

                <div>
                  <label
                    className="label-meta mb-1.5 block"
                    style={{ color: MUTED }}
                  >
                    Quantity (optional)
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={inquiryForm.quantity}
                    onChange={updateInquiryField('quantity')}
                    onFocus={() => setFocusedField('quantity')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="1"
                    className={inputClass}
                    style={{
                      borderColor:
                        focusedField === 'quantity'
                          ? AMBER
                          : `${IVORY}30`,
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="label-meta mb-1.5 block"
                  style={{ color: MUTED }}
                >
                  Message
                </label>

                <textarea
                  value={inquiryForm.message}
                  onChange={updateInquiryField('message')}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="How can we help?"
                  rows={5}
                  className="w-full px-5 py-4 bg-transparent border resize-none focus:outline-none transition-colors"
                  style={{
                    borderColor:
                      focusedField === 'message'
                        ? AMBER
                        : `${IVORY}30`,
                    color: IVORY,
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={inquirySubmitting}
                className="h-14 px-8 inline-flex items-center gap-3 text-[#151417] text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300 disabled:opacity-50"
                style={{
                  background: AMBER_FILL,
                }}
                onMouseEnter={(e) => {
                  if (!inquirySubmitting) {
                    e.currentTarget.style.background = AMBER;
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = AMBER_FILL;
                }}
              >
                <Send size={16} />

                {inquirySubmitting ? 'Sending…' : 'Send Inquiry'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* =========================================================
          CONTACT
      ========================================================== */}
      <section
        id="contact"
        className="relative py-16 lg:py-24 border-t scroll-mt-20 overflow-hidden"
        style={{
          background: GRAPHITE,
          borderColor: `${IVORY}0D`,
        }}
      >
        <div className="absolute inset-0">
          <img
            src={supportContact}
            alt=""
            className="h-full w-full object-cover opacity-15"
          />

          <div
            className="absolute inset-0"
            style={{
              background: `${GRAPHITE}D9`,
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 lg:px-10 text-center">
          <Eyebrow light className="justify-center">
            Talk to ABIXMART
          </Eyebrow>

          <h2
            className="mt-5 font-display text-4xl sm:text-5xl leading-[1.02] tracking-tight"
            style={{ color: IVORY }}
          >
            We're here, the human way.
          </h2>

          <p
            className="mt-5 leading-relaxed max-w-xl mx-auto"
            style={{ color: MUTED }}
          >
            Reach us on WhatsApp for a quick reply, or send us an email. No
            bots, no runaround.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://wa.me/910000000000"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center h-14 px-8 text-[#151417] text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
              style={{
                background: AMBER_FILL,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = AMBER;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = AMBER_FILL;
              }}
            >
              <MessageCircle size={18} className="mr-3" />
              WhatsApp us
            </a>

            <a
              href="mailto:abixmartsupport@gmail.com"
              className="inline-flex items-center justify-center h-14 px-8 border text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
              style={{
                borderColor: IVORY,
                color: IVORY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = IVORY;
                e.currentTarget.style.color = INK;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = IVORY;
              }}
            >
              Email abixmartsupport@gmail.com
            </a>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}