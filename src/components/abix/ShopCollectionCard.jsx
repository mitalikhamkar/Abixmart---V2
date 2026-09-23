// src/components/abix/ShopCollectionCard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import { useProductNotify } from '@/hooks/useProductNotify';

const PENDING_NOTIFY_KEY = 'abixmart_pending_notify';

export default function ShopCollectionCard({ product, index = 0 }) {
  const navigate = useNavigate();
  const isAvailable = product.status === 'available';
  const { status, subscribe, isLoggedIn } = useProductNotify(product.id, product.name);
  const [dismissed, setDismissed] = React.useState(false);

  const handleNotifyClick = () => {
    if (!isLoggedIn) {
      sessionStorage.setItem(PENDING_NOTIFY_KEY, product.id);
      navigate('/login');
      return;
    }
    subscribe();
  };

  const showConfirmation = status === 'subscribed' && !dismissed;
  const showAlready = status === 'already-subscribed';

  return (
    <motion.div
      id={`product-${product.slug}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="scroll-mt-24 group border border-[#F2ECE2]/10 bg-[#211E1F] overflow-hidden flex flex-col"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#151417]/50">
        {product.shopImage ? (
          <img
            src={product.shopImage}
            alt={product.name}
            className={`h-full w-full object-cover transition-transform [transition-duration:1.2s] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] ${
              isAvailable ? '' : 'opacity-90'
            }`}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="font-display text-6xl text-[#F2ECE2]/10">{String(index + 1).padStart(2, '0')}</span>
          </div>
        )}
        <span className="absolute top-4 left-4 font-grotesk text-[10px] uppercase tracking-luxe-sm text-[#F2ECE2] bg-[#151417]/80 backdrop-blur px-2.5 py-1">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className={`absolute top-4 right-4 label-meta px-2.5 py-1 backdrop-blur ${
            isAvailable ? 'bg-[#BE8A4B] text-[#151417]' : 'bg-[#151417]/70 text-[#C9C0B4] border border-[#F2ECE2]/10'
          }`}
        >
          {isAvailable ? 'Available' : 'Coming Soon'}
        </span>
        {!isAvailable && (
          <span className="absolute bottom-3 left-4 text-[10px] text-[#D8CFC2]/70 tracking-wide">Conceptual visual</span>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="font-display text-2xl text-[#F2ECE2] leading-tight">{product.name}</h3>
        <p className="mt-1.5 text-sm text-[#A79C8D] leading-relaxed flex-1">{product.shortDesc}</p>

        {isAvailable ? (
          <Link
            to={`/shop/${product.slug}`}
            className="mt-5 inline-flex items-center justify-center h-12 border border-[#F2ECE2]/60 text-[#F2ECE2] text-[11px] font-semibold tracking-luxe-sm uppercase hover:bg-[#BE8A4B] hover:text-[#151417] hover:border-[#BE8A4B] transition-colors duration-300"
          >
            Explore Product
          </Link>
        ) : showConfirmation ? (
          <div className="mt-5 border border-[#BE8A4B]/30 bg-[#BE8A4B]/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-luxe-sm text-[#D3A467]">You're On The List</p>
            <p className="mt-1.5 text-sm text-[#A79C8D] leading-relaxed">
              We'll let you know when {product.name} becomes available.
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#A79C8D] hover:text-[#F2ECE2] transition-colors"
            >
              <X size={12} /> Close
            </button>
          </div>
        ) : showAlready ? (
          <div className="mt-5 inline-flex items-center gap-2 h-12 px-4 border border-[#F2ECE2]/15 text-[#A79C8D] text-[11px] font-semibold tracking-luxe-sm uppercase">
            <Check size={14} className="text-[#D3A467]" />
            Already On The List
          </div>
        ) : (
          <button
            onClick={handleNotifyClick}
            disabled={status === 'submitting'}
            className="mt-5 inline-flex items-center justify-center gap-2 h-12 border border-[#F2ECE2]/20 text-[#F2ECE2] text-[11px] font-semibold tracking-luxe-sm uppercase hover:border-[#BE8A4B] hover:bg-[#BE8A4B] hover:text-[#151417] transition-colors duration-300 disabled:opacity-50"
          >
            <Bell size={14} />
            {status === 'submitting' ? 'Saving…' : 'Notify Me'}
          </button>
        )}
      </div>
    </motion.div>
  );
}