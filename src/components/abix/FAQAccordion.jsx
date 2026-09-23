// src/components/abix/FAQAccordion.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IVORY = '#F2ECE2';
const MUTED = '#A79C8D';
const AMBER = '#D3A467';

// Editorial FAQ interaction: numbered indicator + growing amber line,
// rather than a generic plus/minus accordion. Keyboard accessible with
// proper aria-expanded semantics. Respects prefers-reduced-motion.
export default function FAQAccordion({ items }) {
  const [open, setOpen] = useState(0);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="divide-y" style={{ borderColor: `${IVORY}14` }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;
        return (
          <div key={i} className="border-t first:border-t-0" style={{ borderColor: `${IVORY}14` }}>
            <h3>
              <button
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="w-full flex items-start gap-5 py-6 text-left group"
              >
                <span
                  className="mt-1 font-grotesk text-xs shrink-0 transition-colors duration-300"
                  style={{ color: isOpen ? AMBER : MUTED }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1">
                  <span
                    className="font-display text-xl lg:text-2xl leading-snug transition-colors duration-300 block"
                    style={{ color: isOpen ? IVORY : `${IVORY}99` }}
                  >
                    {item.q}
                  </span>
                  <span
                    className="block h-px mt-4 origin-left transition-transform duration-500"
                    style={{
                      background: AMBER,
                      transform: isOpen ? 'scaleX(1)' : 'scaleX(0)',
                      transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
                    }}
                  />
                </span>
                <span
                  className="shrink-0 mt-1 font-grotesk text-lg leading-none transition-transform duration-300"
                  style={{ color: isOpen ? AMBER : MUTED, transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                >
                  +
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-7 pl-10 pr-6 text-base leading-relaxed" style={{ color: MUTED }}>
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}