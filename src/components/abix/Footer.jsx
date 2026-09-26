// src/components/abix/Footer.jsx
import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';
import { footerLinks } from '@/data/products';
import logo from '@/assets/logo/Abixmart-full.png';
import footerImg from '@/assets/home/footer.png';
import { ABIX } from '@/components/abix/brandColors';

export default function Footer() {
  const sectionRef = useRef(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const handleChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  return (
    <footer id="footer" ref={sectionRef} className="relative overflow-hidden grain">
      {/* CHANGED: gradient now runs Deep Botanical → Obsidian Forest —
          the footer image stays visible near the top, then the page
          resolves into the darkest tone on the site by the bottom
          edge, replacing the removed ABIX.stoneDeep token. */}
            <div className="absolute inset-0">
        <img src={footerImg} alt="" className="w-full h-full object-cover" aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(9,17,11,0.25) 0%, ${ABIX.deep}e6 50%, ${ABIX.obsidian}f7 100%)`,
          }}
        />
      </div>

      <motion.div
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 pt-20 lg:pt-28 pb-10"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-16 lg:mb-20">
            <span className="font-display text-2xl sm:text-3xl tracking-tight" style={{ color: ABIX.ivory }}>
              ABIXMART
            </span>
            <p className="mt-2 text-sm sm:text-base" style={{ color: ABIX.ivory70 }}>
              Wellness, considered for modern life.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 pb-16 lg:pb-20">
            <div className="col-span-2 lg:col-span-1 flex items-start">
              <Link to="/" aria-label="ABIXMART home">
                <img src={logo} alt="ABIXMART" className="h-16 w-auto object-contain" />
              </Link>
            </div>

            <FooterCol title="Shop" links={footerLinks.shop} />
            <FooterCol title="About" links={footerLinks.about} />
            <FooterCol title="Support" links={footerLinks.help} />
            {footerLinks.account && <FooterCol title="Account" links={footerLinks.account} />}
          </div>

          <div className="flex items-center gap-3 pb-8">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="h-10 w-10 inline-flex items-center justify-center border transition-colors hover:opacity-80" style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }} aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href="https://wa.me/910000000000" target="_blank" rel="noreferrer" className="h-10 w-10 inline-flex items-center justify-center border transition-colors hover:opacity-80" style={{ borderColor: ABIX.ivory25, color: ABIX.ivory }} aria-label="WhatsApp">
              <MessageCircle size={16} />
            </a>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs" style={{ borderTop: `1px solid ${ABIX.ivory12}`, color: ABIX.ivory45 }}>
            <span>© {new Date().getFullYear()} ABIXMART. Crafted with intention.</span>
            <div className="flex items-center gap-5">
              {footerLinks.legal?.map((l) => (
                <Link key={l.label} to={l.to} className="hover:opacity-80 transition-opacity" style={{ color: ABIX.ivory45 }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  if (!links?.length) return null;
  return (
    <div>
      <span className="text-[10px] uppercase tracking-luxe-sm" style={{ color: ABIX.gold }}>{title}</span>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm transition-colors hover:opacity-90" style={{ color: ABIX.ivory70 }}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}