// src/components/abix/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';
import { ABIX } from './brandColors';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart } = useShop();

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // addToCart already opens the existing cart drawer as confirmation —
    // no separate "Added" indicator needed.
    addToCart(product.id, 1);
  };

  return (
    <motion.div
      id={`product-${product.slug}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative scroll-mt-24 border overflow-hidden"
      style={{ borderColor: ABIX.ivory12, backgroundColor: ABIX.obsidian }}
    >
      <Link to={`/shop/${product.slug}`} className="block relative aspect-[4/5] overflow-hidden">
        {product.shopImage && (
          <img
            src={product.shopImage}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 40%, ${ABIX.gold15}, transparent 65%)` }}
        />

        <div className="hidden sm:flex absolute inset-x-0 bottom-0 justify-center gap-3 pb-6 opacity-0 translate-y-3 transition-all duration-400 group-hover:opacity-100 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView();
            }}
            className="inline-flex items-center gap-2 h-11 px-5 text-[11px] font-semibold tracking-luxe-sm uppercase border transition-colors duration-300"
            style={{ borderColor: ABIX.ivory, color: ABIX.ivory, backgroundColor: `${ABIX.obsidian}CC` }}
          >
            <Eye size={14} /> Quick View
          </button>
          <button
            onClick={handleQuickAdd}
            className="inline-flex items-center gap-2 h-11 px-5 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors duration-300"
            style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
          >
            <ShoppingBag size={14} /> Quick Add
          </button>
        </div>
      </Link>

      <div className="p-6">
        <h3 className="font-display text-2xl leading-tight" style={{ color: ABIX.ivory }}>{product.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed" style={{ color: ABIX.ivory45 }}>{product.shortDesc}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-price text-xl" style={{ color: ABIX.ivory }}>
            {product.currency}{product.price}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
            Available
          </span>
        </div>

        <div className="mt-4 flex sm:hidden gap-2">
          <button
            onClick={() => onQuickView()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 text-[11px] font-semibold tracking-luxe-sm uppercase border transition-colors"
            style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
          >
            <Eye size={14} /> Quick View
          </button>
          <button
            onClick={handleQuickAdd}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 text-[11px] font-semibold tracking-luxe-sm uppercase transition-colors"
            style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
          >
            <ShoppingBag size={14} /> Quick Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}