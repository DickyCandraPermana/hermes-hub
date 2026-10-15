'use client';

import { useState } from 'react';
import { cyberAudio } from '../../lib/portfolio/audio.ts';
import { FRESNEL_PALETTES, FresnelColorAnchor } from '../../lib/portfolio/performance.ts';

interface TacticalDockProps {
  onWarp: () => void;
  onPaletteChange: (palette: FresnelColorAnchor) => void;
  onOpenTerminal: () => void;
}

export function TacticalDock({ onWarp, onPaletteChange, onOpenTerminal }: TacticalDockProps) {
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(cyberAudio.isMuted);

  const handleRipple = () => {
    cyberAudio.playCrystalBowl(432);
    onWarp();
  };

  const handlePalette = () => {
    const nextIdx = (paletteIdx + 1) % FRESNEL_PALETTES.length;
    setPaletteIdx(nextIdx);
    const pal = FRESNEL_PALETTES[nextIdx];
    cyberAudio.playRipple(780);
    onPaletteChange(pal);
  };

  const handleToggleMute = () => {
    cyberAudio.isMuted = !cyberAudio.isMuted;
    setIsMuted(cyberAudio.isMuted);
    if (!cyberAudio.isMuted) {
      cyberAudio.playCrystalBowl(528);
    }
  };

  const currentPal = FRESNEL_PALETTES[paletteIdx];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.08] backdrop-blur-3xl border border-white/15 shadow-[0_12px_45px_rgba(0,0,0,0.6)] transition-all">
      {/* Organic Ripple Pulse */}
      <button
        type="button"
        onClick={handleRipple}
        className="px-4 py-2 rounded-full text-xs font-medium text-white hover:text-purple-200 bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-purple-300/30 transition-all flex items-center gap-2 active:scale-95"
        title="Trigger Fluid Ripple Pulse & Singing Bowl"
      >
        <span className="text-purple-300">✦</span>
        <span className="hidden sm:inline">Fluid Ripple</span>
        <span className="sm:hidden">Ripple</span>
      </button>

      {/* Pearlescent Palette Shifter */}
      <button
        type="button"
        onClick={handlePalette}
        className="px-4 py-2 rounded-full text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-purple-300/30 transition-all flex items-center gap-2 active:scale-95"
        title="Cycle Thin-Film Pearlescent Palette"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shadow-sm ring-1 ring-white/30"
          style={{ backgroundColor: currentPal.hex }}
        />
        <span className="hidden sm:inline text-xs">{currentPal.name}</span>
        <span className="sm:hidden text-xs">Aura</span>
      </button>

      {/* Terminal / Codex */}
      <button
        type="button"
        onClick={() => {
          cyberAudio.playRipple(840);
          onOpenTerminal();
        }}
        className="px-4 py-2 rounded-full text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-purple-300/30 transition-all flex items-center gap-1.5 active:scale-95"
        title="Open Command Terminal (⌘K)"
      >
        <span className="text-purple-300/80 font-mono">&gt;_</span>
        <span className="hidden sm:inline">Codex</span>
      </button>

      {/* Audio Mute/Unmute */}
      <button
        type="button"
        onClick={handleToggleMute}
        className="p-2 sm:px-3 sm:py-2 rounded-full text-xs text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 transition-all active:scale-95 flex items-center gap-1"
        title={isMuted ? 'Unmute Crystal Audio' : 'Mute Crystal Audio'}
      >
        <span>{isMuted ? '🔇' : '✨'}</span>
      </button>
    </div>
  );
}
