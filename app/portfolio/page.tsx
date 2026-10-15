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
    particles: 25000,
    coords: '[0.00, 0.00]',
    tier: 'Detecting...'
  });

  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K or Ctrl+K opens tactical terminal
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

  const handleWarp = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.triggerWarp(1.8);
    }
  }, []);

  const handlePaletteChange = useCallback((palette: FresnelColorAnchor) => {
    if (engineRef.current) {
      engineRef.current.setFresnelColor(palette.hex);
    }
  }, []);

  const handleTerminalAction = useCallback((action: TerminalAction) => {
    switch (action.type) {
      case 'TRIGGER_WARP':
        handleWarp();
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
  }, [handleWarp, handlePaletteChange]);

  return (
    <main className="relative min-h-screen w-full bg-[#050507] overflow-x-hidden">
      {/* Layer 0: High-Performance 3D WebGL Canvas */}
      {mounted && (
        <PortfolioCanvas
          onTelemetry={handleTelemetry}
          engineRef={engineRef}
        />
      )}

      {/* Layer 1: Optical Scanline & CRT Grain Vignette Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.85) 100%), linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 100%, 100% 4px'
        }}
      />

      {/* Layer 2: Swiss Cyber-Brutalist HUD Container */}
      <div className="relative z-20 flex flex-col min-h-screen pb-28">
        <TelemetryFeed telemetry={telemetry} />
        <TacticalHeader />
        <ShowcaseDeck onSelectMission={setActiveMission} />
      </div>

      {/* Floating Tactical Dock */}
      <TacticalDock
        onWarp={handleWarp}
        onPaletteChange={handlePaletteChange}
        onOpenTerminal={() => setIsTerminalOpen(true)}
      />

      {/* Modals */}
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
