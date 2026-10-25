// src/components/abix/upcoming/ModalShell.jsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { ABIX } from '@/components/abix/brandColors';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Shared by every open dialog so the page only unlocks when the last one
// closes, and only the top-most dialog reacts to Escape and Tab.
let lockCount = 0;
let savedOverflow = '';
const stack = [];

function lockScroll() {
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = savedOverflow;
}

// Accessible dialog frame: portal, backdrop, focus trap, Escape to close,
// scroll lock and focus restore. Matches the site's obsidian / ivory / gold
// look.
export default function ModalShell({
  labelledBy,
  onClose,
  closeDisabled = false,
  maxWidth = 'max-w-5xl',
  children,
}) {
  const reduce = useReducedMotion();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const closeDisabledRef = useRef(closeDisabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    closeDisabledRef.current = closeDisabled;
  });

  useEffect(() => {
    const token = {};
    stack.push(token);
    lockScroll();

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement;
    if (panel) panel.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (stack[stack.length - 1] !== token) return;

      if (event.key === 'Escape') {
        if (!closeDisabledRef.current) {
          event.stopPropagation();
          onCloseRef.current?.();
        }
        return;
      }

      if (event.key !== 'Tab' || !panel) return;

      const nodes = Array.from(panel.querySelectorAll(FOCUSABLE));
      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const index = stack.indexOf(token);
      if (index >= 0) stack.splice(index, 1);
      unlockScroll();

      // Give focus back to the trigger, but never steal it from a dialog
      // that opened in the meantime.
      const active = document.activeElement;
      const focusIsFree = active === document.body || (panel && panel.contains(active));
      if (
        focusIsFree &&
        previouslyFocused &&
        document.contains(previouslyFocused) &&
        typeof previouslyFocused.focus === 'function'
      ) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, []);

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[100] flex items-stretch sm:items-center justify-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.25 }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(5,9,6,0.84)', backdropFilter: 'blur(6px)' }}
        onClick={closeDisabled ? undefined : onClose}
        aria-hidden="true"
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`relative w-full ${maxWidth} h-[100svh] sm:h-auto sm:max-h-[92vh] overflow-y-auto outline-none`}
        style={{ background: ABIX.obsidian, border: `1px solid ${ABIX.ivory12}` }}
        initial={{ opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduce ? 0 : 16 }}
        transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="sticky top-0 z-20 h-0">
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Close"
            className="absolute right-3 top-3 h-10 w-10 inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-40"
            style={{ background: `${ABIX.obsidian}E6`, color: ABIX.ivory, border: `1px solid ${ABIX.ivory12}` }}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>,
    document.body
  );
}