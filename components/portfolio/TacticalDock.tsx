'use client';

import { useState } from 'react';
import { cyberAudio } from '../../lib/portfolio/audio.ts';
import { FRESNEL_PALETTES, FresnelColorAnchor } from '../../lib/portfolio/performance.ts';

interface TacticalDockProps {
  onWarp: () => void;
  onPaletteChange: (palette: FresnelColorAnchor) => void;
  onOpenTerminal: () => void;
}

export function TacticalDock({
  onWarp,
  onPaletteChange,
  onOpenTerminal
}: TacticalDockProps) {
  const [currentPalIdx, setCurrentPalIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const handlePaletteCycle = () => {
    const nextIdx = (currentPalIdx + 1) % FRESNEL_PALETTES.length;
    setCurrentPalIdx(nextIdx);
    const pal = FRESNEL_PALETTES[nextIdx];
    cyberAudio.playDreamChime();
    onPaletteChange(pal);
  };

  const handleRippleClick = () => {
    cyberAudio.playRipple(840);
    onWarp();
  };

  const handleTerminalClick = () => {
    cyberAudio.playRipple(580);
    onOpenTerminal();
  };

  const handleSoundToggle = () => {
    const muted = cyberAudio.toggleMute();
    setIsMuted(muted);
  };

  const activePal = FRESNEL_PALETTES[currentPalIdx];

  return (
    <aside className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] sm:bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-white/[0.06] backdrop-blur-3xl border border-white/15 shadow-[0_12px_45px_rgba(0,0,0,0.6)]">
        {/* Ripple Button */}
        <button
          type="button"
          onClick={handleRippleClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 transition-all hover:scale-105 active:scale-95"
          title="Trigger fluid ripple across jelly & spores"
        >
          <span className="text-purple-300">✦</span>
          <span>Ripple</span>
        </button>

        {/* Palette Shifter */}
        <button
          type="button"
          onClick={handlePaletteCycle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-200 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all hover:scale-105 active:scale-95"
          title="Shift pearlescent iridescence"
        >
          <span
            className="w-2.5 h-2.5 rounded-full transition-colors shadow-sm"
            style={{ backgroundColor: activePal.hex }}
          />
          <span className="hidden sm:inline text-xs">{activePal.name}</span>
          <span className="sm:hidden text-xs">Aura</span>
        </button>

        {/* Command Codex */}
        <button
          type="button"
          onClick={handleTerminalClick}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-mono text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all hover:scale-105 active:scale-95"
          title="Open command codex (⌘K)"
        >
          <span>&gt;_</span>
          <span className="hidden sm:inline font-sans text-xs">Codex</span>
        </button>

        {/* Ethereal Audio Toggle */}
        <button
          type="button"
          onClick={handleSoundToggle}
          className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all hover:scale-105 active:scale-95 text-xs"
          title={isMuted ? 'Unmute crystal audio' : 'Mute crystal audio'}
        >
          {isMuted ? '🔇' : '✨'}
        </button>
      </div>
    </aside>
  );
}
