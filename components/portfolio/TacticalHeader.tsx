'use client';

import Link from 'next/link';
import { cyberAudio } from '../../lib/portfolio/audio.ts';

export function TacticalHeader() {
  return (
    <header className="relative z-20 pointer-events-none pt-8 pb-4 sm:pt-14 sm:pb-8 max-w-5xl mx-auto px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium tracking-widest uppercase bg-purple-500/10 text-purple-300 border border-purple-400/20 rounded-full backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              FROERYBELL ARCHETYPE
            </span>
            <span className="text-xs text-zinc-500 tracking-wider font-light">
              01 Soul • 07 Spheres
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white mt-3">
            Surreal <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-pink-200 to-indigo-200">Dreamscape</span>
          </h1>
          <p className="text-sm font-light text-zinc-400 mt-2 max-w-xl leading-relaxed">
            Amorphous WebGL fluid geometries, continuous domain simplex morphing, and high-throughput autonomous architectures.
          </p>
        </div>

        <div className="pointer-events-auto flex items-center gap-2.5 self-start sm:self-end">
          <Link
            href="/"
            onClick={() => cyberAudio.playRipple(660)}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-300/30 rounded-full transition-all duration-300 backdrop-blur-xl flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <span className="text-purple-300">&larr;</span> Nexus Cockpit
          </Link>
          <a
            href="https://github.com/DickyCandraPermana"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => cyberAudio.playRipple(820)}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-300/30 rounded-full transition-all duration-300 backdrop-blur-xl active:scale-95 shadow-sm"
          >
            GitHub Archive ↗
          </a>
        </div>
      </div>
    </header>
  );
}
