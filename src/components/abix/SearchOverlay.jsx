import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';
import { products } from '@/data/products';

export default function SearchOverlay() {
  const { searchOpen, closeSearch } = useShop();
  const [q, setQ] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeSearch(); };
    if (searchOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, closeSearch]);

  const results = q.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.shortDesc?.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-ivory/97 backdrop-blur-md flex flex-col"
        >
          <div className="mx-auto max-w-3xl w-full px-6 pt-28 pb-10 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <span className="label-meta text-gold-light">Search ABIXMART</span>
              <button onClick={closeSearch} className="h-11 w-11 inline-flex items-center justify-center text-greendark border border-greendark/20 hover:border-gold hover:text-gold transition-colors rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 border-b-2 border-greendark/20 focus-within:border-gold transition-colors pb-4">
              <Search size={24} className="text-greendark/50" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search for shilajit, ashwagandha, wellness…"
                className="flex-1 bg-transparent font-display text-2xl lg:text-3xl text-greendark placeholder:text-foreground/30 focus:outline-none"
              />
            </div>

            <div className="mt-8 flex-1 overflow-y-auto">
              {q.trim() === '' ? (
                <p className="text-foreground/45 text-sm">Start typing to explore our products.</p>
              ) : results.length === 0 ? (
                <p className="text-foreground/45 text-sm">No products match "{q}". Try "shilajit".</p>
              ) : (
                <div className="space-y-2">
                  {results.map((p) => (
                    <Link
                      key={p.id}
                      to={`/shop/${p.slug}`}
                      onClick={closeSearch}
                      className="flex items-center gap-5 p-4 hover:bg-sand transition-colors group"
                    >
                      <div className="h-16 w-14 bg-sand overflow-hidden shrink-0">
                        {p.image && <img src={p.image} alt={p.name} className="h-full w-full object-cover" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-display text-xl text-greendark group-hover:text-gold transition-colors">{p.name}</h4>
                        <p className="text-sm text-foreground/55">{p.shortDesc || p.note}</p>
                      </div>
                      <span className="label-meta text-foreground/40">
                        {p.status === 'coming_soon' ? 'Coming Soon' : `${p.currency}${p.price}`}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}