import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { faqs } from '@/data/products';

// Warm clay surface, matching RitualOffers above it — ivory used only for
// text, never as the section fill.
export default function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-clay py-24 lg:py-36 border-t border-ivory/10">
      <div className="mx-auto max-w-7xl px-6 lg:px-10 grid lg:grid-cols-12 gap-12 lg:gap-16">
        <div className="lg:col-span-4">
          <span className="font-grotesk text-[11px] font-medium uppercase tracking-luxe-sm text-gold-light">Questions</span>
          <h2 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl text-ivory leading-[1.02] tracking-tight">
            Honest answers.
          </h2>
          <p className="mt-6 text-ivory/65 leading-relaxed">
            If something isn't covered here, the ABIXMART Assist is always one tap away.
          </p>
          <p className="mt-4 text-sm text-ivory/45 leading-relaxed">
            ABIXMART is just beginning — genuine customer reviews are being collected and will appear here
            unedited once they're ready. No invented testimonials, no bought stars.
          </p>
        </div>

        <div className="lg:col-span-8">
          <div className="divide-y divide-ivory/15 border-y border-ivory/15">
            {faqs.map((f, i) => {
              const on = open === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpen(on ? -1 : i)}
                    className="w-full flex items-center justify-between gap-6 py-6 text-left group"
                  >
                    <span className={`font-display text-xl lg:text-2xl transition-colors duration-300 ${on ? 'text-gold-light' : 'text-ivory group-hover:text-gold-light'}`}>
                      {f.q}
                    </span>
                    <span className={`shrink-0 h-9 w-9 inline-flex items-center justify-center border transition-colors duration-300 ${on ? 'border-gold-light text-gold-light' : 'border-ivory/25 text-ivory'}`}>
                      {on ? <Minus size={16} /> : <Plus size={16} />}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-12 text-ivory/70 leading-relaxed">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-xs text-ivory/45 leading-relaxed max-w-2xl">
            Disclaimer: ABIXMART Shilajit is a traditional wellness product, not a medicine. Statements have not been
            evaluated by any medical authority. Consult a qualified healthcare professional before use, especially if
            pregnant, nursing, or managing a health condition.
          </p>
        </div>
      </div>
    </section>
  );
}