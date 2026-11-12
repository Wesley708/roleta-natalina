import React, { useState } from 'react';
import { Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from 'lucide-react';
import { WheelItem } from '../types/wheel';

interface WoodenSettingsSignboardProps {
  items: WheelItem[];
  removeAfterSpin: boolean;
  disabled: boolean;
  onToggleRemoveAfterSpin: (next: boolean) => void;
  onAddItem: (label: string) => void;
  onRemoveItem: (id: string) => void;
  onShuffleItems: () => void;
  onClearItems: () => void;
  onRestoreDefaults: () => void;
  onClose: () => void;
}

function HollyAccent({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="28"
      height="22"
      viewBox="0 0 34 26"
      fill="none"
      aria-hidden="true"
      className={flip ? 'scale-x-[-1] shrink-0' : 'shrink-0'}
    >
      <path
        d="M15 14C10 7 3 8 2 3C8 2 13 4 17 10C15 11 15 14 15 14Z"
        fill="#1e7a43"
        stroke="#0f3d21"
        strokeWidth="1.2"
      />
      <path
        d="M17 15C21 9 29 10 32 5C26 3 20 5 16 11C17 13 17 15 17 15Z"
        fill="#279653"
        stroke="#0f3d21"
        strokeWidth="1.2"
      />
      <circle cx="15" cy="14" r="3.3" fill="#e61c24" stroke="#5a080c" strokeWidth="1" />
      <circle cx="19.5" cy="15.5" r="3.1" fill="#ff3b42" stroke="#5a080c" strokeWidth="1" />
      <circle cx="16" cy="18.5" r="2.9" fill="#c41219" stroke="#5a080c" strokeWidth="1" />
    </svg>
  );
}

/**
 * Full-height hanging braided rope that extends continuously off the top of the viewport
 * and anchors directly into a brushed-brass ring mounted to the signboard top frame (zero gap).
 */
function HangingRopeWithKnot({ side }: { side: 'left' | 'right' }) {
  const patternId = `ropePattern-${side}`;
  return (
    <div
      className={`absolute bottom-[calc(100%-10px)] ${
        side === 'left' ? 'left-10 sm:left-14' : 'right-10 sm:right-14'
      } w-10 h-[100vh] pointer-events-none z-30 flex flex-col items-center drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]`}
    >
      {/* Continuous Vertical Twisted Hemp Rope extending above viewport */}
      <svg
        width="20"
        height="100%"
        preserveAspectRatio="none"
        className="w-4 flex-1 min-h-0"
      >
        <defs>
          <pattern id={patternId} width="20" height="16" patternUnits="userSpaceOnUse">
            <path
              d="M2 2C6 6 14 6 18 2 M2 10C6 14 14 14 18 10"
              stroke="#d9b27c"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M2 6C6 10 14 10 18 6 M2 14C6 18 14 18 18 14"
              stroke="#9c703e"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </pattern>
        </defs>
        <rect x="2" y="0" width="16" height="100%" fill={`url(#${patternId})`} />
        <line x1="2" y1="0" x2="2" y2="100%" stroke="#5c3b1c" strokeWidth="1.5" />
        <line x1="18" y1="0" x2="18" y2="100%" stroke="#3a210b" strokeWidth="1.5" />
      </svg>

      {/* Tied Rope Knot + Festive Gold Mounting Ring seated directly onto the board top edge */}
      <svg width="38" height="36" viewBox="0 0 38 36" fill="none" className="w-9 h-9 -mt-2 shrink-0">
        {/* Rope knot wrap */}
        <ellipse cx="19" cy="11" rx="11" ry="8" fill="#a87a46" stroke="#472a0f" strokeWidth="2" />
        <path
          d="M10 9C14 5 24 5 28 9 M9 13C14 17 24 17 29 13"
          stroke="#dfb882"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        {/* Brushed Brass Eyelet Ring looping right into the top board bracket */}
        <circle
          cx="19"
          cy="24"
          r="8.5"
          stroke="#f3c868"
          strokeWidth="3.8"
          fill="rgba(8, 21, 36, 0.45)"
        />
        <circle cx="19" cy="24" r="8.5" stroke="#855a14" strokeWidth="1.2" />
        {/* Tiny Holly Berry Accent on the Knot */}
        <circle cx="24" cy="15" r="2.8" fill="#e61c24" stroke="#5a080c" strokeWidth="0.9" />
        <circle cx="14" cy="15" r="2.5" fill="#1e7a43" stroke="#0f3d21" strokeWidth="0.9" />
      </svg>
    </div>
  );
}

const GARLAND_BULBS = [
  { color: '#ff2b4a', glow: 'rgba(255, 43, 74, 0.85)', pulse: false },
  { color: '#ffd700', glow: 'rgba(255, 215, 0, 0.85)', pulse: true },
  { color: '#00e676', glow: 'rgba(0, 230, 118, 0.85)', pulse: false },
  { color: '#00e5ff', glow: 'rgba(0, 229, 255, 0.85)', pulse: true },
  { color: '#ff4081', glow: 'rgba(255, 64, 129, 0.85)', pulse: false },
  { color: '#ffd700', glow: 'rgba(255, 215, 0, 0.85)', pulse: true },
  { color: '#00e676', glow: 'rgba(0, 230, 118, 0.85)', pulse: false },
];

export function WoodenSettingsSignboard({
  items,
  removeAfterSpin,
  disabled,
  onToggleRemoveAfterSpin,
  onAddItem,
  onRemoveItem,
  onShuffleItems,
  onClearItems,
  onRestoreDefaults,
  onClose,
}: WoodenSettingsSignboardProps) {
  const [draft, setDraft] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned || disabled) return;
    onAddItem(cleaned);
    setDraft('');
  };

  return (
    <div className="relative w-full max-w-[600px] max-h-[84vh] flex flex-col select-none pointer-events-auto my-auto mt-6">
      {/* Left and Right Hanging Ropes anchored seamlessly to the top edge */}
      <HangingRopeWithKnot side="left" />
      <HangingRopeWithKnot side="right" />

      {/* Main Festive Arctic-Night & Crimson-Gold Board Container (unclipped top so snow sits naturally) */}
      <div className="relative w-full flex flex-col festive-signboard rounded-2xl p-4 sm:p-5">
        {/* Soft Sculpted Snow Drift Blanket Resting Over the Top Frame Edge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-3.5 left-3 right-3 h-7 z-20"
        >
          <svg viewBox="0 0 600 32" preserveAspectRatio="none" className="w-full h-full drop-shadow-[0_3px_5px_rgba(3,10,24,0.6)]">
            <defs>
              <linearGradient id="snowCapGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#e4f0ff" />
                <stop offset="100%" stopColor="#b8d2f2" />
              </linearGradient>
            </defs>
            <path
              d="M6,16 C12,5 38,3 64,10 C95,18 118,6 155,10 C192,14 218,3 262,9 C300,14 335,2 375,10 C412,17 444,5 485,10 C520,14 554,3 582,11 C594,14 598,20 594,24 C575,24 558,18 532,22 C505,26 474,18 446,23 C412,28 380,17 346,22 C312,27 278,18 242,22 C206,27 175,18 140,23 C106,28 72,18 42,23 C22,26 10,23 6,16 Z"
              fill="url(#snowCapGrad)"
            />
          </svg>
        </div>

        {/* Golden Brass Corner Rivets */}
        <div aria-hidden="true" className="absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#fff2b2] via-[#e2b646] to-[#8c6718] border border-[#422b07] shadow-sm z-20" />
        <div aria-hidden="true" className="absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#fff2b2] via-[#e2b646] to-[#8c6718] border border-[#422b07] shadow-sm z-20" />
        <div aria-hidden="true" className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#fff2b2] via-[#e2b646] to-[#8c6718] border border-[#422b07] shadow-sm z-20" />
        <div aria-hidden="true" className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-[#fff2b2] via-[#e2b646] to-[#8c6718] border border-[#422b07] shadow-sm z-20" />

        {/* Top Festive Crimson & Gold Header Banner */}
        <div className="festive-crimson-bar relative rounded-xl px-4 py-2.5 mt-1 mb-3 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <HollyAccent />
            <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wider text-[#fff7e6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] truncate">
              CONFIGURAÇÕES DA ROLETA
            </h2>
            <Sparkles className="w-4 h-4 text-[#ffe28a] shrink-0 hidden sm:block" />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            title="Fechar menu"
            className="w-7 h-7 rounded-full bg-[#4c080b]/85 hover:bg-[#b51c22] active:scale-95 text-[#fff4e2] border border-[#f3c868]/70 flex items-center justify-center shadow-md cursor-pointer shrink-0 transition-all"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Add Item Form Panel */}
        <div className="festive-recess rounded-xl p-3 sm:p-3.5 mb-3 shrink-0">
          <label
            htmlFor="new-wheel-item"
            className="flex items-center gap-2 text-xs font-bold text-[#f7e7c8] mb-2"
          >
            <Pencil className="w-3.5 h-3.5 text-[#ffd97d] shrink-0" />
            <span>Adicionar Item</span>
          </label>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              id="new-wheel-item"
              type="text"
              value={draft}
              disabled={disabled}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ex: Cantar música natalina..."
              maxLength={64}
              className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-[#040c16]/90 border border-[#f3c868]/35 text-sm text-[#f8fafc] placeholder-[#7f9bb8] focus:outline-none focus:border-[#ffd97d] focus:ring-1 focus:ring-[#ffd97d]/40 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={disabled || !draft.trim()}
              className="h-9 px-4 rounded-lg bg-gradient-to-b from-[#1f8046] to-[#13522c] hover:from-[#269954] hover:to-[#176335] active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none border border-[#6ee7a0]/45 text-xs font-bold text-[#fffaf0] shadow-[0_2px_10px_rgba(0,0,0,0.5)] flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar</span>
            </button>
          </form>

          {/* Remove Sorted Item Checkbox */}
          <label className="mt-2.5 flex items-center gap-2 text-xs text-[#c7dcf2] hover:text-[#ffffff] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={removeAfterSpin}
              onChange={(e) => onToggleRemoveAfterSpin(e.target.checked)}
              className="w-4 h-4 rounded accent-[#e61c24] bg-[#040c16] border border-[#f3c868]/45 cursor-pointer"
            />
            <span>Remover item sorteado da roleta</span>
          </label>
        </div>

        {/* Items Subheader Bar with Holly & Count Badge */}
        <div className="relative flex items-center justify-between px-3 py-1.5 mb-2 border border-[#f3c868]/25 bg-[#0e2620]/70 rounded-lg shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <HollyAccent />
            <span className="font-display text-xs font-bold text-[#fff4de] whitespace-nowrap">
              Itens da Roleta
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#1a683a] border border-[#6ee7a0]/45 text-xs font-bold text-[#ecfff2] tabular-nums whitespace-nowrap shadow-inner">
              {items.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-xs">
            <button
              type="button"
              disabled={disabled || items.length < 2}
              onClick={onShuffleItems}
              title="Embaralhar ordem dos itens"
              className="font-bold text-[#ffd97d] hover:text-[#fff1c2] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              Embaralhar
            </button>
            <span className="text-[#f3c868]/35" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              disabled={disabled || items.length === 0}
              onClick={onClearItems}
              title="Limpar todos os itens"
              className="font-bold text-[#ff8f85] hover:text-[#ffc2bd] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Scrollable Frosted Winter Item Cards */}
        <div className="flex-1 min-h-[150px] max-h-[340px] overflow-y-auto festive-scroll pr-1 space-y-2 py-1">
          {items.length === 0 ? (
            <div className="festive-recess rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3">
              <p className="text-xs text-[#bdd5ed] leading-relaxed">
                A roleta está vazia. Adicione novos itens acima para girar!
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={onRestoreDefaults}
                className="h-8 px-3.5 rounded-lg bg-gradient-to-b from-[#96171c] to-[#690e12] hover:from-[#b01d23] hover:to-[#7d1116] border border-[#f3c868]/60 text-xs font-semibold text-[#fff7e6] flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#ffd97d]" />
                <span>Restaurar Itens Natalinos</span>
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="festive-item-row rounded-lg px-3 py-2 flex items-center justify-between gap-2.5 transition-colors duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    aria-hidden="true"
                    style={{
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}66`,
                    }}
                    className="w-3.5 h-3.5 rounded-full border border-[#f3c868]/70 shrink-0"
                  />
                  <span
                    title={item.label}
                    className="text-sm font-semibold text-[#f1f6fc] truncate select-text"
                  >
                    {item.label}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Remover ${item.label}`}
                  title="Remover item"
                  className="w-7 h-7 rounded-md bg-gradient-to-b from-[#c9242a] to-[#8c1317] hover:from-[#e02b32] hover:to-[#a8181d] active:scale-95 disabled:opacity-40 disabled:pointer-events-none border border-[#f3c868]/40 text-[#fff6eb] flex items-center justify-center shrink-0 shadow-sm cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Pine Garland & Glowing Christmas Marquee Lights (matching the 3D wheel bulbs) */}
        <div className="relative mt-3 pt-2.5 border-t border-[#f3c868]/30 flex items-center justify-between shrink-0">
          <HollyAccent />
          <div aria-hidden="true" className="relative flex items-center gap-3.5 py-1 px-3">
            {/* Subtle evergreen garland wire behind bulbs */}
            <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[2px] bg-[#1e5c36] rounded-full" />
            {GARLAND_BULBS.map((bulb, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: bulb.color,
                  boxShadow: `0 0 12px ${bulb.glow}`,
                }}
                className={`relative z-10 w-2.5 h-2.5 rounded-full border border-white/40 ${
                  bulb.pulse ? 'animate-pulse' : ''
                }`}
              />
            ))}
          </div>
          <HollyAccent flip />
        </div>
      </div>
    </div>
  );
}
