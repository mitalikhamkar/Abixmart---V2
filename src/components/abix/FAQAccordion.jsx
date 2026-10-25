// src/components/abix/FAQAccordion.jsx
//
// Editorial FAQ: numbered question, a growing gold line, and a smooth open/close
// (CSS grid rows, so the height is animated without measuring). Answers use a
// comfortable line length. Keyboard accessible with aria-expanded; closed
// answers are removed from the accessibility tree. Respects reduced motion.
//
// Works on its own, or controlled: pass openIndex + onOpenChange to open an item
// from elsewhere on the page (the Support help finder does this).
import React, { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from './brandColors';

export default function FAQAccordion({ items, openIndex, onOpenChange }) {
  const reduce = useReducedMotion();
  const [inner, setInner] = useState(0);
  const controlled = openIndex !== undefined;
  const open = controlled ? openIndex : inner;
  const setOpen = (v) => {
    if (controlled) onOpenChange?.(v);
    else setInner(v);
  };

  return (
    <div className="border-y" style={{ borderColor: ABIX.ivory12 }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;
        return (
          <div
            key={item.q}
            id={`faq-item-${i}`}
            className="border-t first:border-t-0 scroll-mt-28"
            style={{ borderColor: ABIX.ivory12 }}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className={`w-full flex items-start gap-4 sm:gap-5 py-6 text-left group ${FOCUS_RING}`}
              >
                <span
                  className="mt-1.5 font-grotesk text-xs shrink-0 transition-colors duration-300"
                  style={{ color: isOpen ? ABIX.goldLight : ABIX.ivory45 }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 min-w-0">
                  <span
                    className="font-display text-xl lg:text-2xl leading-snug transition-colors duration-300 block group-hover:text-[#E6E1D5]"
                    style={{ color: isOpen ? ABIX.ivory : 'rgba(230,225,213,0.72)' }}
                  >
                    {item.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className="block h-px mt-4 origin-left"
                    style={{
                      background: ABIX.goldLight,
                      transform: isOpen ? 'scaleX(1)' : 'scaleX(0)',
                      transition: reduce ? 'none' : 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
                    }}
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 mt-1 font-grotesk text-xl leading-none"
                  style={{
                    color: isOpen ? ABIX.goldLight : ABIX.ivory45,
                    transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: reduce ? 'none' : 'transform 0.35s cubic-bezier(0.16,1,0.3,1), color 0.3s',
                  }}
                >
                  +
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              className="grid"
              style={{
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                opacity: isOpen ? 1 : 0,
                visibility: isOpen ? 'visible' : 'hidden',
                transition: reduce
                  ? 'none'
                  : `grid-template-rows 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease, visibility 0s linear ${isOpen ? 0 : 0.5}s`,
              }}
            >
              <div className="overflow-hidden min-h-0">
                <p
                  className="pb-7 pl-9 sm:pl-10 pr-2 sm:pr-8 text-base leading-[1.75] max-w-[62ch]"
                  style={{ color: ABIX.ivory70 }}
                >
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}