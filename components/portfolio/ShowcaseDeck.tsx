'use client';

import { Mission, MISSIONS } from '../../lib/portfolio/missions.ts';
import { cyberAudio } from '../../lib/portfolio/audio.ts';

interface ShowcaseDeckProps {
  onSelectMission: (mission: Mission) => void;
}

export function ShowcaseDeck({ onSelectMission }: ShowcaseDeckProps) {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
      {/* Stream Intro Micro-Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08] text-xs font-light text-zinc-300 tracking-wider">
        <span className="uppercase text-purple-200/90 font-medium tracking-widest text-[11px]">
          Architectural Archives
        </span>
        <span className="font-mono text-zinc-400 text-[11px]">
          [ 04 SYSTEMS ONLINE ]
        </span>
      </div>

      {/* Fluid Editorial Stream */}
      <div className="space-y-7 sm:space-y-10">
        {MISSIONS.map((mission, idx) => (
          <article
            key={mission.id}
            onClick={() => {
              cyberAudio.playCrystalBowl();
              onSelectMission(mission);
            }}
            className="group relative cursor-pointer rounded-[2rem] sm:rounded-[2.5rem] bg-white/[0.035] hover:bg-white/[0.07] border border-white/10 hover:border-purple-300/40 backdrop-blur-3xl p-6 sm:p-9 transition-all duration-500 hover:shadow-[0_12px_45px_rgba(216,180,254,0.14)] flex flex-col justify-between"
          >
            {/* Top Row: High-Fashion Serif Index + Taxonomy */}
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-2xl sm:text-3xl text-purple-300/80 group-hover:text-purple-200 transition-colors">
                  0{idx + 1}
                </span>
                <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wider text-purple-200/90 bg-purple-500/15 border border-purple-400/25">
                  {mission.code}
                </span>
              </div>
              <span className="text-[11px] uppercase tracking-widest text-zinc-300/90 font-light truncate max-w-[200px] sm:max-w-none text-right">
                {mission.domain}
              </span>
            </div>

            {/* Core Narrative */}
            <div className="mb-6 sm:mb-8">
              <h3 className="text-2xl sm:text-3xl font-light tracking-tight text-white group-hover:text-purple-100 transition-colors">
                {mission.title}
              </h3>
              <p className="text-sm font-light text-zinc-300 mt-2 sm:mt-2.5 leading-relaxed max-w-2xl">
                {mission.tagline}
              </p>
            </div>

            {/* Micro-Metrics Bar */}
            <div className="pt-4 sm:pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {mission.metrics.slice(0, 3).map((metric, mIdx) => (
                  <span
                    key={mIdx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-zinc-300"
                  >
                    <span className="text-zinc-400 uppercase tracking-wider text-[10px]">
                      {metric.label}:
                    </span>
                    <span className="text-purple-200 font-medium">
                      {metric.value}
                    </span>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-medium group-hover:translate-x-1 transition-transform">
                <span>Explore Blueprint</span>
                <span>&rarr;</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
