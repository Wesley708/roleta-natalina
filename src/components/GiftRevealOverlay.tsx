import { AnimatePresence, motion } from 'motion/react';
import { Gift, RotateCw, Sparkles } from 'lucide-react';
import { SpinPhase, WheelItem } from '../types/wheel';

interface GiftRevealOverlayProps {
  spinPhase: SpinPhase;
  winner: WheelItem | null;
  anchor: { xPercent: number; yPercent: number };
  removeAfterSpin: boolean;
  onSpinAgain: () => void;
  onClose: () => void;
}

export function GiftRevealOverlay({
  spinPhase,
  winner,
  anchor,
  removeAfterSpin,
  onSpinAgain,
  onClose,
}: GiftRevealOverlayProps) {
  const isVisible = spinPhase === 'revealed' && winner !== null;

  // Clamp anchor so the festive plaque stays comfortably framed above the open 3D gift box
  const clampedLeft = Math.max(24, Math.min(54, anchor.xPercent));
  const clampedTop = Math.max(22, Math.min(54, anchor.yPercent - 18));

  return (
    <AnimatePresence>
      {isVisible && winner && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4 pointer-events-none">
          {/* Subtle dim vignette behind the glowing gift box reveal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#040c18]/55 backdrop-blur-[2px] pointer-events-auto"
          />

          {/* Prize Plaque Emerging Centered */}
          <div className="relative w-[min(450px,92vw)] pointer-events-auto my-auto z-10">
            <motion.div
              initial={{ opacity: 0, y: 70, scale: 0.48 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.7 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 22,
                mass: 0.9,
              }}
              className="relative"
            >
              {/* Warm Golden Radial Glow Halo Behind the Revealed Prize Scroll */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(circle,rgba(255,212,102,0.48)_0%,rgba(245,158,42,0.18)_46%,rgba(245,158,42,0)_74%)] animate-warm-glow"
              />

              {/* Ornate Christmas Gift Card / Carved Crimson & Gold Plaque */}
              <div className="relative rounded-2xl bg-gradient-to-b from-[#8f1519] via-[#6e0e12] to-[#4c080b] p-1.5 shadow-[0_24px_60px_rgba(0,0,0,0.85),0_0_38px_rgba(255,198,88,0.45)] border-2 border-[#f3c868]">
                {/* Inner Parchment & Gold Filigree Frame */}
                <div className="rounded-xl bg-gradient-to-b from-[#fff8e8] via-[#faecd2] to-[#efd9b0] px-6 py-5 text-center border border-[#c9963b] shadow-inner">
                  {/* Top Festive Ribbon Crest */}
                  <div className="mx-auto -mt-9 mb-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-b from-[#d42a2f] to-[#961418] border-2 border-[#f5cc6c] shadow-md">
                    <Gift className="w-4 h-4 text-[#ffe28a] shrink-0" />
                    <span className="font-display text-xs font-bold tracking-wide text-[#fff8eb] whitespace-nowrap">
                      PRESENTE SORTEADO
                    </span>
                    <Sparkles className="w-4 h-4 text-[#ffe28a] shrink-0" />
                  </div>

                  {/* Revealed Winning Item */}
                  <p className="font-display text-2xl sm:text-[26px] font-extrabold text-[#4a1608] leading-snug text-balance my-2 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
                    {winner.label}
                  </p>

                  {removeAfterSpin && (
                    <p className="text-xs font-medium text-[#7c4a21] mt-1">
                      Este item será removido da roleta ao continuar.
                    </p>
                  )}

                  {/* Decorative Gold Divider */}
                  <div
                    aria-hidden="true"
                    className="my-4 h-px w-full bg-gradient-to-r from-transparent via-[#c89236] to-transparent"
                  />

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={onSpinAgain}
                      className="h-10 px-5 rounded-lg bg-gradient-to-b from-[#1f7840] to-[#14522b] hover:from-[#258c4b] hover:to-[#186133] active:scale-[0.98] border border-[#7be09d]/40 text-sm font-bold text-[#fff9ed] shadow-md flex items-center gap-2 whitespace-nowrap shrink-0 transition-transform duration-150 cursor-pointer"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Girar Novamente</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="h-10 px-4 rounded-lg bg-[#e5cca0] hover:bg-[#dabb88] active:scale-[0.98] border border-[#b08038] text-sm font-bold text-[#4a2108] whitespace-nowrap shrink-0 transition-transform duration-150 cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
