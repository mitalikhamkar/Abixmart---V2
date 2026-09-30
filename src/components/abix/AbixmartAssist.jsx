import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { ABIX } from './brandColors';

// ABIXMART WhatsApp button — PHASE 1 ONLY.
// Opens the official ABIXMART WhatsApp chat with a pre-filled message
// in a new tab. No chatbot, no Meta Cloud API, no webhooks, no backend
// logic — that is Phase 2, not implemented here.
//
// Number and message are the single source of truth for the wa.me
// link below; change either one here only.
const WHATSAPP_NUMBER = '917680014597';
const WHATSAPP_MESSAGE = 'Hi ABIXMART, I would like to know more about your products.';

// Same ABIX tokens the rest of the site's floating/overlay chrome
// already uses (previously aliased in this same file) — no new colors
// introduced.
const GRAPHITE = ABIX.espresso;
const IVORY = ABIX.ivory;
const AMBER = ABIX.goldLight;

export default function AbixmartAssist() {
  // Framer Motion doesn't honor prefers-reduced-motion on its own;
  // useReducedMotion() is the hook it ships specifically for this, so
  // the entrance spring and hover lift both collapse to instant state
  // changes for anyone who has that OS-level preference set.
  const shouldReduceMotion = useReducedMotion();

  const handleClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
      animate={shouldReduceMotion ? false : { scale: 1, opacity: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { delay: 1, type: 'spring', stiffness: 200, damping: 18 }
      }
      onClick={handleClick}
      // Icon-only circle on mobile keeps the tap target compact and
      // out of the way of page content; the lg+ breakpoint widens into
      // a labeled pill, matching the affordance the old "Need help?"
      // button had on larger screens.
      className="fixed bottom-5 right-5 lg:bottom-7 lg:right-7 z-40 h-12 w-12 lg:h-12 lg:w-auto lg:px-5 inline-flex items-center justify-center gap-2.5 border transition-all duration-300 hover:-translate-y-0.5 rounded-full"
      style={{
        background: GRAPHITE,
        borderColor: `${IVORY}24`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${AMBER}66`;
        e.currentTarget.style.background = ABIX.elevated;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = `${IVORY}24`;
        e.currentTarget.style.background = GRAPHITE;
      }}
      aria-label="Chat with ABIXMART on WhatsApp"
    >
      <MessageCircle size={18} style={{ color: AMBER }} className="shrink-0" aria-hidden="true" />
      <span
        className="hidden lg:inline font-grotesk text-[11px] lg:text-[12px] font-medium tracking-luxe-sm uppercase"
        style={{ color: IVORY }}
      >
        Chat on WhatsApp
      </span>
    </motion.button>
  );
}