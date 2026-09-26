// src/components/abix/ShopQuickView.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';
import { ABIX } from './brandColors';

export default function ShopQuickView({ product, onClose }) {
  const { addToCart } = useShop();

  const handleAdd = () => {
    addToCart(product.id, 1);
    onClose(); // reveal the cart drawer addToCart just opened
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 backdrop-blur-sm"
          style={{ backgroundColor: `${ABIX.obsidian}CC` }}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl grid sm:grid-cols-2 overflow-hidden"
          style={{ backgroundColor: ABIX.obsidian }}
        >
          <button
            onClick={onClose}
            aria-label="Close quick view"
            className="absolute top-4 right-4 z-20 p-2 transition-colors"
            style={{ color: ABIX.ivory45 }}
          >
            <X size={18} />
          </button>

          <motion.div
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative aspect-[4/5] sm:aspect-auto"
            style={{ background: `linear-gradient(160deg, ${ABIX.espresso} 0%, ${ABIX.obsidian} 100%)` }}
          >
            {product.shopImage && (
              <img src={product.shopImage} alt={product.name} className="h-full w-full object-cover" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-10 flex flex-col justify-center"
          >
            <span className="text-[11px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
              {product.subtitle}
            </span>
            <h3 className="mt-3 font-display text-3xl leading-tight" style={{ color: ABIX.ivory }}>
              {product.name}
            </h3>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: ABIX.ivory70 }}>
              {product.description || product.shortDesc}
            </p>

            {product.facts && (
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3">
                {product.facts.slice(0, 4).map((f) => (
                  <div key={f.label}>
                    <dt className="text-[10px] uppercase tracking-luxe-sm" style={{ color: ABIX.ivory45 }}>{f.label}</dt>
                    <dd className="mt-0.5 text-sm" style={{ color: ABIX.ivory }}>{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-7 flex items-center gap-4">
              <span className="font-price text-2xl" style={{ color: ABIX.ivory }}>
                {product.currency}{product.price}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
                Available
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-2 text-[12px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
                style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian, height: 52 }}
              >
                <ShoppingBag size={15} /> Quick Add
              </button>
              <Link
                to={`/shop/${product.slug}`}
                onClick={onClose}
                className="inline-flex items-center justify-center text-[12px] font-semibold tracking-luxe-sm uppercase border transition-colors duration-300"
                style={{ borderColor: ABIX.ivory25, color: ABIX.ivory, height: 52 }}
              >
                View Full Product
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}