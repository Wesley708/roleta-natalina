import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { soundEngine } from './audio/soundEngine';
import { ChristmasScene3D } from './components/ChristmasScene3D';
import { GiftRevealOverlay } from './components/GiftRevealOverlay';
import { ParallaxSnowOverlay } from './components/ParallaxSnowOverlay';
import { WoodenSettingsSignboard } from './components/WoodenSettingsSignboard';
import {
  assignBalancedPalette,
  DEFAULT_WHEEL_ITEMS,
  SpinPhase,
  WheelItem,
} from './types/wheel';

export default function App() {
  const [items, setItems] = useState<WheelItem[]>(DEFAULT_WHEEL_ITEMS);
  const [showSignboard, setShowSignboard] = useState<boolean>(false);
  const [spinPhase, setSpinPhase] = useState<SpinPhase>('idle');
  const [spinRequestId, setSpinRequestId] = useState<number>(0);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [removeAfterSpin, setRemoveAfterSpin] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [giftAnchor, setGiftAnchor] = useState<{ xPercent: number; yPercent: number }>({
    xPercent: 50,
    yPercent: 52,
  });

  const isBusy = spinPhase === 'pushing' || spinPhase === 'spinning' || spinPhase === 'revealing';

  const handleToggleSignboard = useCallback(() => {
    setShowSignboard((prev) => {
      const next = !prev;
      soundEngine.playGearToggle();
      return next;
    });
  }, []);

  const commitWinnerRemovalIfNeeded = useCallback(
    (currentItems: WheelItem[], currentWinner: WheelItem | null): WheelItem[] => {
      if (!removeAfterSpin || !currentWinner) return currentItems;
      const filtered = currentItems.filter((it) => it.id !== currentWinner.id);
      return assignBalancedPalette(filtered);
    },
    [removeAfterSpin]
  );

  const handleRequestSpin = useCallback(() => {
    if (isBusy) return;

    let activeItems = items;
    if (spinPhase === 'revealed' && winner) {
      activeItems = commitWinnerRemovalIfNeeded(items, winner);
      if (activeItems !== items) {
        setItems(activeItems);
      }
      setWinner(null);
    }

    if (activeItems.length === 0) return;

    setSpinRequestId((prev) => prev + 1);
  }, [isBusy, items, spinPhase, winner, commitWinnerRemovalIfNeeded]);

  const handleCloseReveal = useCallback(() => {
    if (winner && removeAfterSpin) {
      setItems((prev) => commitWinnerRemovalIfNeeded(prev, winner));
    }
    setWinner(null);
    setSpinPhase('idle');
  }, [winner, removeAfterSpin, commitWinnerRemovalIfNeeded]);

  const handleSpinAgainFromReveal = useCallback(() => {
    let nextItems = items;
    if (winner && removeAfterSpin) {
      nextItems = commitWinnerRemovalIfNeeded(items, winner);
      setItems(nextItems);
    }
    setWinner(null);

    if (nextItems.length === 0) {
      setSpinPhase('idle');
      return;
    }

    setSpinPhase('idle');
    setSpinRequestId((prev) => prev + 1);
  }, [items, winner, removeAfterSpin, commitWinnerRemovalIfNeeded]);

  // Support Spacebar to spin (ignoring focused text inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;
      e.preventDefault();
      if (spinPhase === 'revealed') {
        handleSpinAgainFromReveal();
      } else {
        handleRequestSpin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [spinPhase, handleRequestSpin, handleSpinAgainFromReveal]);

  const handleAddItem = (label: string) => {
    setItems((prev) => {
      const nextRaw = [
        ...prev.map((i) => ({ id: i.id, label: i.label })),
        { id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label },
      ];
      return assignBalancedPalette(nextRaw);
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const nextRaw = prev.filter((i) => i.id !== id).map((i) => ({ id: i.id, label: i.label }));
      return assignBalancedPalette(nextRaw);
    });
  };

  const handleShuffleItems = () => {
    setItems((prev) => {
      const copy = prev.map((i) => ({ id: i.id, label: i.label }));
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return assignBalancedPalette(copy);
    });
  };

  const handleClearItems = () => {
    setItems([]);
  };

  const handleRestoreDefaults = () => {
    setItems(DEFAULT_WHEEL_ITEMS);
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#081526]">
      {/* 1. Interactive 3D Winter Scene: Centered 3D Wheel, Gnomes, Reindeer & Gift Reveal */}
      <ChristmasScene3D
        items={items}
        spinPhase={spinPhase}
        spinRequestId={spinRequestId}
        onRequestSpin={handleRequestSpin}
        onPhaseChange={setSpinPhase}
        onWinnerSelected={setWinner}
        onGiftBoxScreenAnchor={setGiftAnchor}
        onToggleSignboard={handleToggleSignboard}
      />

      {/* 2. Multi-Layer Parallax Snowfall Overlay */}
      <ParallaxSnowOverlay />

      {/* 3. Top-Right Action Buttons Bar (Festive Crimson & Brushed Gold Medallions) */}
      <div className="fixed top-4 right-5 z-30 flex items-center gap-3 pointer-events-auto">
        {/* Sound Toggle Button */}
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? 'Ativar efeitos sonoros' : 'Silenciar efeitos sonoros'}
          title={muted ? 'Ativar som' : 'Silenciar som'}
          className="w-12 h-12 rounded-full festive-crimson-bar flex items-center justify-center text-[#fff4de] hover:text-[#ffd97d] active:scale-95 transition-all duration-200 cursor-pointer"
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Settings Volumetric Gear Button */}
        <button
          type="button"
          onClick={handleToggleSignboard}
          aria-label={showSignboard ? 'Fechar configurações da roleta' : 'Abrir configurações da roleta'}
          title={showSignboard ? 'Fechar configurações' : 'Abrir configurações'}
          className="relative w-12 h-12 rounded-full festive-crimson-bar flex items-center justify-center text-[#ffd97d] hover:text-[#ffffff] active:scale-95 transition-all duration-300 cursor-pointer group"
        >
          <span
            className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
              showSignboard
                ? 'opacity-100 shadow-[0_0_20px_#ffd97d] bg-[#ffd97d]/20'
                : 'opacity-0'
            }`}
          />
          <Settings
            className={`w-6 h-6 z-10 transition-transform duration-700 ease-out ${
              showSignboard
                ? 'rotate-180 text-[#ffe59e] drop-shadow-[0_0_8px_#ffd97d]'
                : 'rotate-0 text-[#ffd97d]'
            }`}
          />
        </button>
      </div>

      {/* 4. Centered Hanging Festive Signboard Modal Overlay (Suspended by full-height ropes) */}
      <AnimatePresence>
        {showSignboard && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
            {/* Arctic Night Backdrop Blur Fade */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleToggleSignboard}
              className="absolute inset-0 bg-[#030b18]/65 backdrop-blur-sm pointer-events-auto"
            />

            {/* Wooden Signboard falling down from top on ropes with spring bounce */}
            <motion.div
              initial={{ y: '-125vh', opacity: 0.2 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-125vh', opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 160,
                damping: 17,
                mass: 1.05,
              }}
              className="w-full max-w-[620px] flex items-center justify-center pointer-events-auto relative z-10 my-auto"
            >
              <WoodenSettingsSignboard
                items={items}
                removeAfterSpin={removeAfterSpin}
                disabled={isBusy}
                onToggleRemoveAfterSpin={setRemoveAfterSpin}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onShuffleItems={handleShuffleItems}
                onClearItems={handleClearItems}
                onRestoreDefaults={handleRestoreDefaults}
                onClose={handleToggleSignboard}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Christmas Gift Box Prize Reveal Overlay */}
      <GiftRevealOverlay
        spinPhase={spinPhase}
        winner={winner}
        anchor={giftAnchor}
        removeAfterSpin={removeAfterSpin}
        onSpinAgain={handleSpinAgainFromReveal}
        onClose={handleCloseReveal}
      />
    </main>
  );
}
