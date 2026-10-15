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

  const handleWarp = () => {
    cyberAudio.playWarp();
    onWarp();
  };

  const handlePalette = () => {
    const nextIdx = (paletteIdx + 1) % FRESNEL_PALETTES.length;
    setPaletteIdx(nextIdx);
    const pal = FRESNEL_PALETTES[nextIdx];
    cyberAudio.playBlip(1040, 0.05);
    onPaletteChange(pal);
  };

  const handleToggleMute = () => {
    cyberAudio.isMuted = !cyberAudio.isMuted;
    setIsMuted(cyberAudio.isMuted);
    if (!cyberAudio.isMuted) {
      cyberAudio.playBlip(880, 0.04);
    }
  };

  const currentPal = FRESNEL_PALETTES[paletteIdx];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 p-1.5 rounded-full bg-black/70 backdrop-blur-xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
      {/* Warp Shockwave */}
      <button
        type="button"
        onClick={handleWarp}
        className="px-4 py-2 rounded-full text-xs font-mono font-bold text-white hover:text-cyan-300 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/40 transition-all flex items-center gap-1.5 active:scale-95"
        title="Trigger Zero-G Radial Warp Burst"
      >
        <span className="text-cyan-400">⚡</span>
        <span className="hidden sm:inline">ZERO-G WARP</span>
        <span className="sm:hidden">WARP</span>
      </button>

      {/* Iridescence Shifter */}
      <button
        type="button"
        onClick={handlePalette}
        className="px-4 py-2 rounded-full text-xs font-mono font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 active:scale-95"
        title="Cycle Fresnel Iridescence Palette"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: currentPal.hex }}
        />
        <span className="hidden sm:inline uppercase text-[11px]">{currentPal.name}</span>
        <span className="sm:hidden uppercase text-[11px]">COLOR</span>
      </button>

      {/* Terminal Launcher */}
      <button
        type="button"
        onClick={() => {
          cyberAudio.playBlip(880, 0.04);
          onOpenTerminal();
        }}
        className="px-4 py-2 rounded-full text-xs font-mono font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all flex items-center gap-1.5 active:scale-95"
        title="Open Tactical Command Terminal (or type /help)"
      >
        <span className="text-emerald-400 font-bold">&gt;_</span>
        <span className="hidden sm:inline">TERMINAL</span>
      </button>

      {/* Audio Mute/Unmute */}
      <button
        type="button"
        onClick={handleToggleMute}
        className="p-2 sm:px-3 sm:py-2 rounded-full text-xs font-mono text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95 flex items-center gap-1"
        title={isMuted ? 'Unmute Audio Synthesizer' : 'Mute Audio Synthesizer'}
      >
        <span>{isMuted ? '🔇' : '🔊'}</span>
      </button>
    </div>
  );
}
