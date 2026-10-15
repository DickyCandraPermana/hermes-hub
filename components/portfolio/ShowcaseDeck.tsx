'use client';

import { Mission, MISSIONS } from '../../lib/portfolio/missions.ts';
import { cyberAudio } from '../../lib/portfolio/audio.ts';

interface ShowcaseDeckProps {
  onSelectMission: (mission: Mission) => void;
}

export function ShowcaseDeck({ onSelectMission }: ShowcaseDeckProps) {
  return (
    <section className="relative z-20 pointer-events-none max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-16">
      <div className="mb-8 pointer-events-auto flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h2 className="text-xs uppercase tracking-[0.25em] text-purple-300/80 font-medium">
            Selected Works // Engineering Monoliths
          </h2>
          <p className="text-xs text-zinc-500 font-light mt-1">
            Grounded production systems, vector knowledge graphs, and distributed runtimes.
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-600">
          [ 04 ARCHIVES DEPLOYED ]
        </span>
      </div>

      {/* Airy Editorial Stream: Single Column Floating Frosted Glass Pills */}
      <div className="flex flex-col gap-6 sm:gap-8 pointer-events-auto">
        {MISSIONS.map((mission, idx) => {
          const indexNum = `0${idx + 1}`;
          return (
            <div
              key={mission.id}
              onMouseEnter={() => cyberAudio.playRipple(580 + idx * 80)}
              onClick={() => {
                cyberAudio.playCrystalBowl(432 + idx * 60);
                onSelectMission(mission);
              }}
              className="group relative cursor-pointer overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.08] hover:border-purple-300/40 p-6 sm:p-9 backdrop-blur-3xl transition-all duration-500 hover:shadow-[0_12px_45px_rgba(216,180,254,0.12)] hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Top Row: Index, Code & Domain */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl font-serif italic text-purple-300/60 group-hover:text-purple-200 transition-colors">
                    {indexNum}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono tracking-wider text-purple-200/90 bg-purple-500/10 border border-purple-400/20">
                    {mission.code}
                  </span>
                </div>
                <span className="text-xs font-light text-zinc-400 tracking-wider">
                  {mission.domain}
                </span>
              </div>

              {/* Title & Tagline */}
              <div className="my-2">
                <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white group-hover:text-purple-100 transition-colors">
                  {mission.title}
                </h3>
                <p className="text-sm font-light text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                  {mission.tagline}
                </p>
              </div>

              {/* Metrics Pills & Explore Link */}
              <div className="mt-6 pt-5 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {mission.metrics.map((kpi, kIdx) => (
                    <div
                      key={kIdx}
                      className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center gap-2 text-xs"
                    >
                      <span className="text-zinc-500 font-light text-[11px] uppercase">
                        {kpi.label}:
                      </span>
                      <span className="font-medium text-purple-200">
                        {kpi.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="inline-flex items-center gap-2 text-xs font-medium text-purple-300 group-hover:text-white transition-colors">
                  <span>Explore Blueprint</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
