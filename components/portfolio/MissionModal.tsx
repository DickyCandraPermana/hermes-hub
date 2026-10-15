'use client';

import { useEffect } from 'react';
import { Mission } from '../../lib/portfolio/missions.ts';
import { cyberAudio } from '../../lib/portfolio/audio.ts';

interface MissionModalProps {
  mission: Mission | null;
  onClose: () => void;
}

export function MissionModal({ mission, onClose }: MissionModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cyberAudio.playBlip(600, 0.04);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!mission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-sm bg-zinc-950 border border-white/15 p-5 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider text-cyan-400 bg-cyan-950/70 border border-cyan-800/40">
                {mission.code}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/30">
                {mission.classification}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                {mission.clearance} CLEARANCE
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              {mission.title}
            </h2>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1">
              {mission.tagline}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              cyberAudio.playBlip(600, 0.04);
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded transition-colors text-xs font-mono"
            title="Close dossier (ESC)"
          >
            [CLOSE ✕]
          </button>
        </div>

        {/* Blueprint ASCII Box */}
        <div className="rounded bg-black/80 border border-cyan-500/20 p-4 font-mono text-[11px] sm:text-xs text-cyan-300 overflow-x-auto whitespace-pre shadow-inner">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
            // TOPOLOGY BLUEPRINT // SV-07 RECON MATRIX
          </div>
          {mission.blueprint}
        </div>

        {/* Operational Challenge & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded bg-zinc-900/40 border border-white/5">
            <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1.5">
              ⚠ OPERATIONAL CHALLENGE
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {mission.operationalChallenge}
            </p>
          </div>

          <div className="p-4 rounded bg-zinc-900/40 border border-white/5">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
              ⚡ ALGORITHMIC SOLUTION
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {mission.algorithmicSolution}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div>
          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-3">
            // TELEMETRY & VERIFIED KPIS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {mission.metrics.map((kpi, idx) => (
              <div key={idx} className="p-3.5 rounded bg-zinc-900/60 border border-white/10 flex flex-col justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">{kpi.label}</span>
                <span className="text-xl font-black font-mono text-cyan-400 my-1">{kpi.value}</span>
                <span className="text-[11px] font-mono text-zinc-400">{kpi.subtext}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div>
          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
            // TECHNICAL ARSENAL
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {mission.techStack.map((tech, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-sm text-[11px] font-mono bg-zinc-900 text-zinc-300 border border-white/10"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Action Link Footer */}
        {mission.externalUrl && (
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <a
              href={mission.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => cyberAudio.playBlip(1100, 0.05)}
              className="px-4 py-2 rounded text-xs font-mono font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              LAUNCH TARGET SYSTEM &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
