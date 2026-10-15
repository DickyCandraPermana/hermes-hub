'use client';

import Link from 'next/link';
import { cyberAudio } from '../../lib/portfolio/audio.ts';

export function TacticalHeader() {
  return (
    <header className="relative z-20 pointer-events-none pt-8 pb-4 sm:pt-12 sm:pb-8 max-w-7xl mx-auto px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-3">
            <span className="inline-block px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
              SV-07 MONARCH
            </span>
            <span className="text-xs font-mono text-zinc-500 tracking-wider">
              RECURSIVE ARCHIVE 2026
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-2">
            SEVARCHKY<span className="text-cyan-400">.</span>
          </h1>
          <p className="text-xs sm:text-sm font-mono text-zinc-400 mt-1 max-w-xl">
            Autonomous Multi-Agent Architecture • Real-Time WebGL/WebGPU Systems • Distributed High-Throughput Gateways
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-3 self-start sm:self-center">
          <Link
            href="/"
            onClick={() => cyberAudio.playBlip(750, 0.04)}
            className="px-3.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover:border-cyan-500/40 rounded transition-all duration-200 backdrop-blur-md flex items-center gap-2"
          >
            <span className="text-cyan-400 font-bold">&larr;</span> COCKPIT
          </Link>
          <a
            href="https://github.com/DickyCandraPermana"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => cyberAudio.playBlip(880, 0.04)}
            className="px-3.5 py-1.5 text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 hover:border-cyan-500/40 rounded transition-all duration-200 backdrop-blur-md"
          >
            GITHUB // ARCHIVE
          </a>
        </div>
      </div>
    </header>
  );
}
