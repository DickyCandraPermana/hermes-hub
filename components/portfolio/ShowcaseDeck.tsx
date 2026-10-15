'use client';

import { Mission, MISSIONS } from '../../lib/portfolio/missions.ts';
import { cyberAudio } from '../../lib/portfolio/audio.ts';

interface ShowcaseDeckProps {
  onSelectMission: (mission: Mission) => void;
}

export function ShowcaseDeck({ onSelectMission }: ShowcaseDeckProps) {
  return (
    <section className="relative z-20 pointer-events-none max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <div className="mb-6 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-400" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
            FLAGSHIP ARCHIVES // OPERATIONAL DEPLOYMENTS
          </h2>
        </div>
        <p className="text-xs text-zinc-600 font-mono mt-0.5">
          Select any mission profile to decrypt architectural blueprints and telemetry metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 pointer-events-auto">
        {MISSIONS.map((mission) => (
          <div
            key={mission.id}
            onMouseEnter={() => cyberAudio.playBlip(920, 0.03)}
            onClick={() => {
              cyberAudio.playChime();
              onSelectMission(mission);
            }}
            className="group relative cursor-pointer overflow-hidden rounded-sm bg-black/60 hover:bg-black/80 border border-white/10 hover:border-cyan-500/50 p-5 sm:p-6 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.12)] flex flex-col justify-between"
          >
            {/* Top Bar with Mission Code & Domain */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40">
                  {mission.code}
                </span>
                <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                  {mission.domain}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                {mission.title}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-1 line-clamp-2">
                {mission.tagline}
              </p>
            </div>

            {/* Metrics Grid Preview */}
            <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-3 gap-2">
              {mission.metrics.map((kpi, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase truncate">
                    {kpi.label}
                  </span>
                  <span className="text-sm font-bold font-mono text-zinc-200 group-hover:text-cyan-400 transition-colors">
                    {kpi.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Action Hint */}
            <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-zinc-500 group-hover:text-cyan-400 transition-colors">
              <span className="tracking-wider">CLEARANCE // GRANTED</span>
              <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-bold">
                VIEW DOSSIER &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
