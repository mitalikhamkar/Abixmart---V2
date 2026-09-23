import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, BookOpen, Package, MessageCircle } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';

const INK = '#151417';
const GRAPHITE = '#1E1C1F';
const STONE = '#211E1F';
const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';
const AMBER = '#D3A467';

// ABIXMART Assist — a persistent floating button that opens a
// full-screen simplified menu. Multi-page aware.
export default function AbixmartAssist() {
  const { assistOpen, openAssist, closeAssist } = useShop();
  const navigate = useNavigate();

  const go = (path) => { closeAssist(); navigate(path); };

  const options = [
    // CHANGED — temporary inquiry-only deployment: no real purchase flow
    // exists yet, so this no longer opens CheckoutModal. Routes to the
    // Shilajit product page, where "Send Inquiry" carries quantity into
    // the existing Support-page inquiry form.
    { key: 'buy', label: 'Enquire about a product', desc: 'Ask about availability and pricing.', icon: ShoppingBag, action: () => go('/shop/shilajit') },
    { key: 'understand', label: 'Understand a product', desc: 'Know what you are buying.', icon: BookOpen, action: () => go('/shop/shilajit') },
    { key: 'track', label: 'Track my order', desc: 'Where is my order?', icon: Package, action: () => go('/support#tracking') },
    { key: 'talk', label: 'Talk to us', desc: 'WhatsApp support.', icon: MessageCircle, action: () => window.open('https://wa.me/910000000000', '_blank') },
  ];

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 18 }}
        onClick={openAssist}
        className="fixed bottom-5 right-5 lg:bottom-7 lg:right-7 z-40 h-11 lg:h-12 px-4 lg:px-5 inline-flex items-center gap-2.5 border transition-all duration-300 hover:-translate-y-0.5 rounded-full group"
        style={{
          background: GRAPHITE,
          borderColor: 'rgba(242,236,226,0.14)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(211,164,103,0.4)';
          e.currentTarget.style.background = '#252225';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(242,236,226,0.14)';
          e.currentTarget.style.background = GRAPHITE;
        }}
        aria-label="ABIXMART Assist"
      >
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: AMBER }} />
        <span
          className="font-grotesk text-[11px] lg:text-[12px] font-medium tracking-luxe-sm uppercase"
          style={{ color: IVORY }}
        >
          Need help?
        </span>
      </motion.button>

      <AnimatePresence>
        {assistOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-6"
            style={{ background: `${INK}F2` }}
            onClick={closeAssist}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="label-meta" style={{ color: AMBER }}>ABIXMART Assist</span>
                  <h2 className="mt-2 font-display text-4xl lg:text-5xl" style={{ color: IVORY }}>How can we help?</h2>
                </div>
                <button
                  onClick={closeAssist}
                  className="h-11 w-11 inline-flex items-center justify-center border rounded-full transition-colors"
                  style={{ color: IVORY, borderColor: `${IVORY}30` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = AMBER;
                    e.currentTarget.style.color = AMBER;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${IVORY}30`;
                    e.currentTarget.style.color = IVORY;
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {options.map((o) => (
                  <button
                    key={o.key}
                    onClick={o.action}
                    className="group flex items-start gap-4 p-6 border transition-colors duration-300 text-left"
                    style={{ background: STONE, borderColor: `${IVORY}1A` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = IVORY;
                      e.currentTarget.style.borderColor = IVORY;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = STONE;
                      e.currentTarget.style.borderColor = `${IVORY}1A`;
                    }}
                  >
                    <o.icon size={22} className="mt-0.5 transition-colors" style={{ color: AMBER }} />
                    <div>
                      <h3
                        className="font-display text-2xl transition-colors"
                        style={{ color: IVORY }}
                      >
                        {o.label}
                      </h3>
                      <p className="mt-1 text-sm transition-colors" style={{ color: MUTED }}>
                        {o.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-8 text-center text-xs" style={{ color: `${MUTED}` }}>
                Designed to be simple for everyone — no account needed to enquire.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}