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
        cyberAudio.playRipple(520);
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!mission) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-[2rem] sm:rounded-[2.5rem] bg-[#0c0919]/90 border border-white/[0.12] p-6 sm:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 text-[11px] font-mono tracking-wider text-purple-200 bg-purple-500/10 border border-purple-400/20 rounded-full">
                {mission.code}
              </span>
              <span className="px-3 py-1 text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10 rounded-full">
                {mission.classification}
              </span>
              <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-light">
                {mission.domain}
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-white mt-1">
              {mission.title}
            </h2>
            <p className="text-sm font-light text-zinc-400 mt-2 leading-relaxed">
              {mission.tagline}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              cyberAudio.playRipple(520);
              onClose();
            }}
            className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors font-medium"
            title="Close dossier (ESC)"
          >
            ✕ Close
          </button>
        </div>

        {/* Blueprint ASCII Box */}
        <div className="rounded-2xl bg-black/50 border border-purple-500/20 p-5 font-mono text-[11px] sm:text-xs text-purple-200/90 overflow-x-auto whitespace-pre shadow-inner">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
            // ARCHITECTURAL BLUEPRINT & DATA FLOW
          </div>
          {mission.blueprint}
        </div>

        {/* Operational Challenge & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
            <h4 className="text-xs font-medium text-amber-200/90 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>✦</span> Operational Challenge
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed font-light">
              {mission.operationalChallenge}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/[0.06]">
            <h4 className="text-xs font-medium text-purple-200 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>✦</span> Algorithmic Solution
            </h4>
            <p className="text-xs text-zinc-300 leading-relaxed font-light">
              {mission.algorithmicSolution}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-3">
            Verified Telemetry & Key Performance Indicators
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {mission.metrics.map((kpi, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between"
              >
                <span className="text-[10px] uppercase text-zinc-500 tracking-wider">
                  {kpi.label}
                </span>
                <span className="text-2xl font-light text-purple-200 my-1 font-serif italic">
                  {kpi.value}
                </span>
                <span className="text-xs text-zinc-400 font-light">
                  {kpi.subtext}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Chips */}
        <div>
          <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-medium mb-2.5">
            Technical Arsenal
          </h4>
          <div className="flex flex-wrap gap-2">
            {mission.techStack.map((tech, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-xs bg-white/[0.04] text-zinc-300 border border-white/[0.08]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Action Link Footer */}
        {mission.externalUrl && (
          <div className="pt-4 border-t border-white/[0.08] flex justify-end">
            <a
              href={mission.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => cyberAudio.playRipple(960)}
              className="px-5 py-2.5 rounded-full text-xs font-medium text-zinc-950 bg-purple-200 hover:bg-white transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(216,180,254,0.3)]"
            >
              Launch Target System &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
