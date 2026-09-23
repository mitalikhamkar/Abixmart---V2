import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';
import { footerLinks } from '@/data/products';
import logo from '@/assets/logo/Abixmart-full.png';

export default function Footer() {
  return (
    <footer id="footer" className="bg-charcoal text-ivory pt-16 lg:pt-20 pb-10 grain">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Links */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-10 py-16">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="inline-block" aria-label="ABIXMART home">
              <img src={logo} alt="ABIXMART" className="h-28 w-auto object-contain" />
            </Link>
            <p className="mt-4 text-sm text-ivory/55 leading-relaxed max-w-xs">
              Himalayan Wellness<br />Ancient origin. Modern experience.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="h-10 w-10 inline-flex items-center justify-center border border-ivory/25 hover:border-gold hover:text-gold transition-colors" aria-label="Instagram">
                <Instagram size={16} />
              </a>
              <a href="https://wa.me/910000000000" target="_blank" rel="noreferrer" className="h-10 w-10 inline-flex items-center justify-center border border-ivory/25 hover:border-gold hover:text-gold transition-colors" aria-label="WhatsApp">
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          <FooterCol title="Shop" links={footerLinks.shop} />
          <FooterCol title="About" links={footerLinks.about} />
          <FooterCol title="Support" links={footerLinks.help} />
          <FooterCol title="Legal" links={footerLinks.legal} />
        </div>

        {/* base */}
        <div className="pt-8 border-t border-ivory/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ivory/45">
          <span>© {new Date().getFullYear()} ABIXMART. Crafted with intention.</span>
          <span className="tracking-luxe-sm">HIMALAYAN MODERN LUXURY</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <span className="text-[10px] uppercase tracking-luxe-sm text-gold">{title}</span>
      <ul className="mt-4 space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-sm text-ivory/65 hover:text-ivory transition-colors">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}