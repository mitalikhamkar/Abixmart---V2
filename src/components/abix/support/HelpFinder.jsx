// src/components/abix/support/HelpFinder.jsx
//
// The six help options as an interactive finder: pick what you need on the
// left, and the panel on the right shows the way, with the same destinations
// the old cards linked to (o.to). "Track" and "order" offer a quick order-ID
// lookup; "question" offers the first FAQ questions, which open the FAQ item.
// Nothing changes by itself: selection is by click, tap or arrow keys.
import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, HelpCircle, MessageCircle, Package, ShoppingBag, Truck } from 'lucide-react';
import MaskedImageStack from '@/components/abix/about/MaskedImageStack';
import { FOREST, FOCUS_RING } from '@/components/abix/upcoming/livingCollection/theme';
import { ABIX } from '@/components/abix/brandColors';

const ICONS = { ShoppingBag, BookOpen, Package, Truck, HelpCircle, MessageCircle };
const ACTION = {
  buy: 'Browse the shop',
  understand: 'Read the product story',
  order: 'Go to order tracking',
  track: 'Go to order tracking',
  question: 'See all questions',
  talk: 'See contact options',
};
const pad = (n) => String(n + 1).padStart(2, '0');

export default function HelpFinder({ options, images, faqs, onTrack, onAskFaq, whatsappUrl }) {
  const [sel, setSel] = useState({ active: 0, prev: 0 });
  const [trackId, setTrackId] = useState('');
  const tabRefs = useRef([]);
  const N = options.length;

  const choose = (i) => setSel((s) => (s.active === i ? s : { active: i, prev: s.active }));
  const onKeyDown = (e, i) => {
    let next = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (i + 1) % N;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (i - 1 + N) % N;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = N - 1;
    if (next === null) return;
    e.preventDefault();
    choose(next);
    tabRefs.current[next]?.focus();
  };

  const o = options[sel.active];
  const Icon = ICONS[o.icon] || HelpCircle;
  const isTrack = o.key === 'order' || o.key === 'track';
  const btnPrimary = `inline-flex items-center justify-center gap-2 h-12 px-7 text-[11px] font-semibold tracking-luxe-sm uppercase rounded-full transition-colors duration-300 hover:brightness-110 ${FOCUS_RING}`;
  const btnGhost = `inline-flex items-center justify-center gap-2 h-12 px-7 text-[11px] font-semibold tracking-luxe-sm uppercase rounded-full border transition-colors duration-300 hover:bg-[rgba(199,174,125,0.08)] ${FOCUS_RING}`;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 gap-8 lg:gap-14 items-start">
      <div className="lg:col-span-5 min-w-0">
        <div role="tablist" aria-label="What do you need help with?" className="grid grid-cols-2 gap-2 lg:block">
          {options.map((item, i) => {
            const on = i === sel.active;
            const ItemIcon = ICONS[item.icon] || HelpCircle;
            return (
              <button
                key={item.key}
                ref={(el) => { tabRefs.current[i] = el; }}
                id={`finder-tab-${item.key}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls="finder-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`relative w-full text-left px-4 py-3 lg:px-0 lg:py-5 border lg:border-0 lg:border-b transition-colors duration-300 ${FOCUS_RING}`}
                style={{ borderColor: on ? ABIX.gold : ABIX.ivory25 }}
              >
                <span className="flex items-center gap-3">
                  <span className="font-grotesk text-[10px] tracking-luxe-sm" style={{ color: ABIX.gold }}>{pad(i)}</span>
                  <ItemIcon size={15} style={{ color: on ? ABIX.goldLight : ABIX.ivory45 }} />
                </span>
                <span
                  className="mt-1 block font-display text-lg lg:text-2xl leading-tight transition-colors duration-500"
                  style={{ color: on ? ABIX.ivory : ABIX.ivory45 }}
                >
                  {item.label}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute left-0 bottom-0 h-px transition-[width] duration-700"
                  style={{ width: on ? '100%' : '0%', background: ABIX.gold }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div id="finder-panel" role="tabpanel" aria-labelledby={`finder-tab-${o.key}`} className="lg:col-span-7 min-w-0">
        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-2 sm:-inset-3 border pointer-events-none" style={{ borderColor: ABIX.gold25 }} />
          <MaskedImageStack
            images={images}
            active={sel.active}
            prev={sel.prev}
            className="aspect-[16/8] sm:aspect-[16/7]"
            style={{ background: FOREST.deepest }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 3, background: `linear-gradient(0deg, ${FOREST.deepest}CC 0%, ${FOREST.deepest}55 60%, ${FOREST.deepest}80 100%)` }}
          />
          <span
            aria-hidden="true"
            className="absolute left-4 bottom-4 h-12 w-12 rounded-full border inline-flex items-center justify-center"
            style={{ zIndex: 4, borderColor: ABIX.gold, color: ABIX.goldLight, background: `${FOREST.deepest}B3` }}
          >
            <Icon size={20} />
          </span>
        </div>

        <div aria-live="polite" className="mt-8">
          <div key={o.key} className="abix-rise">
            <h3 className="font-display text-3xl lg:text-4xl leading-tight" style={{ color: ABIX.ivory }}>{o.label}</h3>
            <p className="mt-3 max-w-lg text-base leading-relaxed" style={{ color: ABIX.ivory70 }}>{o.desc}</p>

            {isTrack && (
              <form
                onSubmit={(e) => { e.preventDefault(); onTrack(trackId); }}
                className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg"
              >
                <label htmlFor="finder-order-id" className="sr-only">Order ID</label>
                <input
                  id="finder-order-id"
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="e.g. ABX-20260927-7K4M2"
                  autoComplete="off"
                  className="w-full h-12 px-4 bg-transparent border text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-[#C7AE7D] transition-colors border-[rgba(230,225,213,0.25)]"
                />
                <button type="submit" className={`${btnPrimary} shrink-0`} style={{ background: ABIX.gold, color: FOREST.deepest }}>
                  Track order
                </button>
              </form>
            )}

            {o.key === 'question' && (
              <ul className="mt-6 max-w-lg">
                {faqs.slice(0, 4).map((f, i) => (
                  <li key={f.q} className="list-none">
                    <button
                      type="button"
                      onClick={() => onAskFaq(i)}
                      className={`group w-full flex items-center justify-between gap-4 py-3.5 text-left border-t min-h-[44px] ${FOCUS_RING}`}
                      style={{ borderColor: ABIX.ivory12 }}
                    >
                      <span className="text-base" style={{ color: ABIX.ivory }}>{f.q}</span>
                      <ArrowRight size={15} className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" style={{ color: ABIX.goldLight }} />
                    </button>
                  </li>
                ))}
                <li aria-hidden="true" className="list-none border-t" style={{ borderColor: ABIX.ivory12 }} />
              </ul>
            )}

            <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3">
              {o.key === 'talk' && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className={btnPrimary} style={{ background: ABIX.gold, color: FOREST.deepest }}>
                  <MessageCircle size={16} /> WhatsApp us
                </a>
              )}
              <Link
                to={o.to}
                className={o.key === 'talk' || isTrack ? btnGhost : btnPrimary}
                style={o.key === 'talk' || isTrack ? { color: ABIX.goldLight, borderColor: `${ABIX.goldLight}66` } : { background: ABIX.gold, color: FOREST.deepest }}
              >
                {ACTION[o.key] || 'Continue'} <ArrowRight size={15} />
              </Link>
              {o.key === 'talk' && (
                <Link to="/support#inquiry" className={btnGhost} style={{ color: ABIX.goldLight, borderColor: `${ABIX.goldLight}66` }}>
                  Send an inquiry
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}