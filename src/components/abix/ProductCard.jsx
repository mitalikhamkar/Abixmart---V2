// src/components/abix/ProductCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, ShoppingBag } from 'lucide-react';
import { useShop } from '@/lib/ShopContext';
import { ABIX } from './brandColors';

// CHANGED: removed the max-w-sm/mx-auto centering that used to live on
// this card — alignment for a single vs. multiple products is now
// handled entirely by the grid in Shop.jsx, so the card itself always
// renders at a natural width and sits wherever the grid places it
// (top-left first, filling left-to-right/row-wise as more are added).
export default function ProductCard({ product, onQuickView }) {
  const { addToCart } = useShop();

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product.id, 1);
  };

  return (
    <motion.div
      id={`product-${product.slug}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative scroll-mt-24 rounded-2xl border overflow-hidden"
      style={{ borderColor: ABIX.ivory12, backgroundColor: `${ABIX.espresso}55` }}
    >
      <Link
        to={`/shop/${product.slug}`}
        className="block relative aspect-square overflow-hidden rounded-t-2xl p-8"
        style={{ background: `linear-gradient(160deg, ${ABIX.espresso} 0%, ${ABIX.obsidian} 100%)` }}
      >
        <span
          className="absolute top-4 left-4 z-10 text-[9px] font-semibold uppercase tracking-luxe-sm px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${ABIX.obsidian}CC`, color: ABIX.gold }}
        >
          Available
        </span>

        {product.shopImage && (
          <img
            src={product.shopImage}
            alt={product.name}
            className="relative z-0 h-full w-full object-contain transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
          />
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 45%, ${ABIX.gold15}, transparent 65%)` }}
        />

        <div className="hidden sm:flex absolute inset-x-0 bottom-4 justify-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView();
            }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-[10px] font-semibold tracking-luxe-sm uppercase border backdrop-blur-md opacity-0 translate-y-2 transition-all duration-400 group-hover:opacity-100 group-hover:translate-y-0"
            style={{ borderColor: ABIX.ivory, color: ABIX.ivory, backgroundColor: `${ABIX.obsidian}99` }}
          >
            <Eye size={13} /> Quick View
          </button>
          <button
            onClick={handleQuickAdd}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-[10px] font-semibold tracking-luxe-sm uppercase opacity-0 translate-y-2 transition-all duration-400 delay-[60ms] group-hover:opacity-100 group-hover:translate-y-0"
            style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
          >
            <ShoppingBag size={13} /> Quick Add
          </button>
        </div>
      </Link>

      <div className="px-5 py-4">
        <h3 className="font-display text-lg leading-tight" style={{ color: ABIX.ivory }}>{product.name}</h3>
        <p className="mt-1 text-xs leading-relaxed line-clamp-2" style={{ color: ABIX.ivory45 }}>{product.shortDesc}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-price text-lg" style={{ color: ABIX.ivory }}>
            {product.currency}{product.price}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>
            {product.category}
          </span>
        </div>

        <div className="mt-4 flex sm:hidden gap-2">
          <button
            onClick={() => onQuickView()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full text-[10px] font-semibold tracking-luxe-sm uppercase border transition-colors"
            style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }}
          >
            <Eye size={13} /> Quick View
          </button>
          <button
            onClick={handleQuickAdd}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full text-[10px] font-semibold tracking-luxe-sm uppercase transition-colors"
            style={{ backgroundColor: ABIX.gold, color: ABIX.obsidian }}
          >
            <ShoppingBag size={13} /> Quick Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}