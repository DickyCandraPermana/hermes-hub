'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { PortfolioCanvas } from '../../components/portfolio/PortfolioCanvas.tsx';
import { TelemetryFeed } from '../../components/portfolio/TelemetryFeed.tsx';
import { TacticalHeader } from '../../components/portfolio/TacticalHeader.tsx';
import { ShowcaseDeck } from '../../components/portfolio/ShowcaseDeck.tsx';
import { TacticalDock } from '../../components/portfolio/TacticalDock.tsx';
import { MissionModal } from '../../components/portfolio/MissionModal.tsx';
import { TerminalModal } from '../../components/portfolio/TerminalModal.tsx';
import { PortfolioEngine, EngineTelemetry } from '../../lib/portfolio/engine.ts';
import { Mission, getMissionById } from '../../lib/portfolio/missions.ts';
import { FresnelColorAnchor, getPaletteByKey } from '../../lib/portfolio/performance.ts';
import { TerminalAction } from '../../lib/portfolio/terminal.ts';

export default function PortfolioPage() {
  const engineRef = useRef<PortfolioEngine | null>(null);

  const [telemetry, setTelemetry] = useState<EngineTelemetry>({
    fps: 60,
    particles: 16000,
    coords: '[0.00, 0.00]',
    tier: 'Detecting...'
  });

  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K opens command codex
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsTerminalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTelemetry = useCallback((data: EngineTelemetry) => {
    setTelemetry(data);
  }, []);

  const handleRipple = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerRipple(undefined, 1.4);
    }
  }, []);

  const handlePaletteChange = useCallback((palette: FresnelColorAnchor) => {
    if (engineRef.current) {
      engineRef.current.setFresnelColor(palette.key);
    }
  }, []);

  const handleTerminalAction = useCallback((action: TerminalAction) => {
    switch (action.type) {
      case 'TRIGGER_WARP':
        handleRipple();
        break;
      case 'SET_PALETTE':
        if (action.payload) {
          const pal = getPaletteByKey(action.payload);
          handlePaletteChange(pal);
        }
        break;
      case 'OPEN_MISSION':
        if (action.payload) {
          const mission = getMissionById(action.payload);
          if (mission) {
            setActiveMission(mission);
          }
        }
        break;
      default:
        break;
    }
  }, [handleRipple, handlePaletteChange]);

  return (
    <main className="relative min-h-screen w-full bg-[#080612] overflow-x-hidden selection:bg-purple-300 selection:text-zinc-950">
      {/* Layer 0: High-Performance 3D WebGL Organic Jelly & Spore Canvas */}
      {mounted && (
        <PortfolioCanvas
          onTelemetry={handleTelemetry}
          engineRef={engineRef}
        />
      )}

      {/* Layer 1: Ethereal Ambient Radial Lighting & Subtle Dream Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(circle at 75% 25%, rgba(216, 180, 254, 0.08) 0%, transparent 55%), radial-gradient(circle at 25% 75%, rgba(110, 231, 183, 0.05) 0%, transparent 60%)'
        }}
      />

      {/* Layer 2: Editorial Stream Container */}
      <div className="relative z-20 flex flex-col min-h-screen pb-[calc(env(safe-area-inset-bottom,0px)+140px)]">
        <TelemetryFeed telemetry={telemetry} />
        <TacticalHeader />
        <ShowcaseDeck onSelectMission={setActiveMission} />
      </div>

      {/* Floating Fluid Glass Dock */}
      <TacticalDock
        onWarp={handleRipple}
        onPaletteChange={handlePaletteChange}
        onOpenTerminal={() => setIsTerminalOpen(true)}
      />

      {/* Modals & Drawers */}
      <MissionModal
        mission={activeMission}
        onClose={() => setActiveMission(null)}
      />

      <TerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        telemetry={telemetry}
        onAction={handleTerminalAction}
      />
    </main>
  );
}
