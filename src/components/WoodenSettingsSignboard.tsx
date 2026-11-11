import React, { useState } from 'react';
import { Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
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
      width="26"
      height="20"
      viewBox="0 0 34 26"
      fill="none"
      aria-hidden="true"
      className={flip ? 'scale-x-[-1] shrink-0' : 'shrink-0'}
    >
      <path
        d="M15 14C10 7 3 8 2 3C8 2 13 4 17 10C15 11 15 14 15 14Z"
        fill="#246B38"
        stroke="#11381C"
        strokeWidth="1.2"
      />
      <path
        d="M17 15C21 9 29 10 32 5C26 3 20 5 16 11C17 13 17 15 17 15Z"
        fill="#2E8246"
        stroke="#11381C"
        strokeWidth="1.2"
      />
      <circle cx="15" cy="14" r="3.3" fill="#D62828" stroke="#5A0B0B" strokeWidth="1" />
      <circle cx="19.5" cy="15.5" r="3.1" fill="#E63946" stroke="#5A0B0B" strokeWidth="1" />
      <circle cx="16" cy="18.5" r="2.9" fill="#B5171E" stroke="#5A0B0B" strokeWidth="1" />
    </svg>
  );
}

{/* Detailed Hemp / Jute Hanging Rope with Tied Knot SVG Component (matching image_0497bb8b.png) */}
function HangingRopeWithKnot({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className={`absolute -top-36 ${
        side === 'left' ? 'left-10 sm:left-14' : 'right-10 sm:right-14'
      } w-10 h-40 pointer-events-none z-20 flex flex-col items-center drop-shadow-[0_8px_10px_rgba(0,0,0,0.7)]`}
    >
      {/* Vertical Twisted Hemp Rope Shaft */}
      <svg width="20" height="120" viewBox="0 0 20 120" fill="none" className="w-5 h-28">
        <pattern id="ropePattern" width="20" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M2 2C6 6 14 6 18 2 M2 10C6 14 14 14 18 10"
            stroke="#B58957"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M2 6C6 10 14 10 18 6 M2 14C6 18 14 18 18 14"
            stroke="#8F6335"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </pattern>
        <rect x="2" y="0" width="16" height="120" fill="url(#ropePattern)" />
        <line x1="2" y1="0" x2="2" y2="120" stroke="#5C3B1C" strokeWidth="1.5" />
        <line x1="18" y1="0" x2="18" y2="120" stroke="#42270E" strokeWidth="1.5" />
      </svg>

      {/* Tied Rope Knot Loop directly above the board hole */}
      <svg width="36" height="32" viewBox="0 0 36 32" fill="none" className="w-9 h-8 -mt-2">
        <ellipse cx="18" cy="14" rx="14" ry="11" fill="#9C7142" stroke="#4A2F13" strokeWidth="2" />
        <path
          d="M8 12C12 6 24 6 28 12 M6 18C10 24 26 24 30 18 M12 8C18 16 18 20 12 26"
          stroke="#C29864"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M10 14C14 10 22 10 26 14"
          stroke="#6E4A25"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

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
    <div className="relative w-full max-w-[600px] max-h-[86vh] flex flex-col select-none pointer-events-auto my-auto">
      {/* Left and Right Hanging Ropes with Knots (matching user uploaded image_0497bb8b.png) */}
      <HangingRopeWithKnot side="left" />
      <HangingRopeWithKnot side="right" />

      {/* Main Hanging Wooden Board Container */}
      <div className="relative w-full flex flex-col wood-signboard rounded-2xl p-4 sm:p-5 shadow-[0_35px_80px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Drill holes in the top plank where ropes enter */}
        <div
          aria-hidden="true"
          className="absolute top-3 left-10 sm:left-14 w-5 h-5 rounded-full bg-[#120703] border-2 border-[#57351d] shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)] z-10"
        />
        <div
          aria-hidden="true"
          className="absolute top-3 right-10 sm:right-14 w-5 h-5 rounded-full bg-[#120703] border-2 border-[#57351d] shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)] z-10"
        />

        {/* Top Header Plank with Title and Close Button */}
        <div className="wood-header-plank relative rounded-xl px-4 py-2.5 mb-3 flex items-center justify-between shadow-lg shrink-0">
          <span
            aria-hidden="true"
            className="w-2.5 h-2.5 rounded-sm bg-[#1c0d05] border border-[#a87a46] shadow-[inset_0_1px_2px_rgba(0,0,0,0.9)] shrink-0"
          />
          <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wider text-[#fae9cf] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] whitespace-nowrap">
            ❄ CONFIGURAÇÕES DA ROLETA ❄
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configurações"
            title="Fechar menu"
            className="w-7 h-7 rounded-full bg-[#8c1d1d] hover:bg-[#ab2424] active:scale-95 text-[#ffebd8] border border-[#e86b6b]/60 flex items-center justify-center shadow-md cursor-pointer shrink-0 transition-transform"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Add Item Form Block */}
        <div className="wood-recess rounded-xl p-3 sm:p-3.5 mb-3 shrink-0">
          <label
            htmlFor="new-wheel-item"
            className="flex items-center gap-2 text-xs font-bold text-[#f5dec0] mb-2"
          >
            <Pencil className="w-3.5 h-3.5 text-[#f0be63] shrink-0" />
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
              className="flex-1 min-w-0 h-9 px-3 rounded-md bg-[#110602] border border-[#563119] text-sm text-[#fff6e8] placeholder-[#8e6b52] focus:outline-none focus:border-[#f0be63] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={disabled || !draft.trim()}
              className="h-9 px-4 rounded-md bg-gradient-to-b from-[#cc292b] to-[#8f1517] hover:from-[#de3335] hover:to-[#a1191c] active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none border border-[#f08070]/40 text-xs font-bold text-[#fff8ec] shadow-[0_2px_6px_rgba(0,0,0,0.55)] flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-transform duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Adicionar</span>
            </button>
          </form>

          {/* Remove Sorted Item Checkbox */}
          <label className="mt-2.5 flex items-center gap-2 text-xs text-[#e2c5a3] hover:text-[#fff4e4] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={removeAfterSpin}
              onChange={(e) => onToggleRemoveAfterSpin(e.target.checked)}
              className="w-4 h-4 rounded accent-[#c92427] bg-[#110602] border border-[#6c3f21] cursor-pointer"
            />
            <span>Remover item sorteado da roleta</span>
          </label>
        </div>

        {/* Items Subheader Bar with Holly & Count Badge */}
        <div className="relative flex items-center justify-between px-3 py-1.5 mb-2 border-t border-b border-[#5e361c]/70 bg-[#281409]/85 rounded-lg shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <HollyAccent />
            <span className="font-display text-xs font-bold text-[#fcebd2] whitespace-nowrap">
              Itens da Roleta
            </span>
            <span className="px-2 py-0.5 rounded bg-[#1e6136] border border-[#3ca35e]/60 text-xs font-bold text-[#eaffe8] tabular-nums whitespace-nowrap shadow-inner">
              {items.length}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-xs">
            <button
              type="button"
              disabled={disabled || items.length < 2}
              onClick={onShuffleItems}
              title="Embaralhar ordem dos itens"
              className="font-bold text-[#e8c68f] hover:text-[#fff2d6] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              Embaralhar
            </button>
            <span className="text-[#6d4325]" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              disabled={disabled || items.length === 0}
              onClick={onClearItems}
              title="Limpar todos os itens"
              className="font-bold text-[#ff9e92] hover:text-[#ffcec7] active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150 cursor-pointer whitespace-nowrap"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Scrollable Carved Item Planks */}
        <div className="flex-1 min-h-[160px] max-h-[360px] overflow-y-auto wood-scroll pr-1 space-y-2 py-1">
          {items.length === 0 ? (
            <div className="wood-recess rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3">
              <p className="text-xs text-[#d8b894] leading-relaxed">
                A roleta está vazia. Adicione novos itens acima para girar!
              </p>
              <button
                type="button"
                disabled={disabled}
                onClick={onRestoreDefaults}
                className="h-8 px-3.5 rounded-md bg-[#4d2b16] hover:bg-[#63381e] border border-[#824d29] text-xs font-semibold text-[#fcebd2] flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#f2c464]" />
                <span>Restaurar Itens Natalinos</span>
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="wood-item-plank rounded-lg px-3 py-2 flex items-center justify-between gap-2.5 transition-transform duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: item.color }}
                    className="w-3 h-3 rounded-full border border-[#3a1d09] shadow-sm shrink-0"
                  />
                  <span
                    title={item.label}
                    className="text-sm font-semibold text-[#2d1506] truncate select-text"
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
                  className="w-7 h-7 rounded bg-gradient-to-b from-[#bf2626] to-[#8c1616] hover:from-[#d62e2e] hover:to-[#a31b1b] active:scale-95 disabled:opacity-40 disabled:pointer-events-none border border-[#590d0d] text-[#fff5eb] flex items-center justify-center shrink-0 shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Bottom Holly Accents & Hanging Christmas Lights */}
        <div className="relative mt-2.5 pt-2 border-t border-[#593218]/80 flex items-center justify-between shrink-0">
          <HollyAccent />
          <div aria-hidden="true" className="flex items-center gap-3.5 py-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd269] shadow-[0_0_12px_#ffbe3d] animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5e57] shadow-[0_0_12px_#ff5e57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#55e679] shadow-[0_0_12px_#55e679]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd269] shadow-[0_0_12px_#ffbe3d] animate-pulse" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#48dbfb] shadow-[0_0_12px_#48dbfb]" />
          </div>
          <HollyAccent flip />
        </div>
      </div>
    </div>
  );
}
