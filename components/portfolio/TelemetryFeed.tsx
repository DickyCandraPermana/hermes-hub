'use client';

import { EngineTelemetry } from '../../lib/portfolio/engine.ts';

interface TelemetryFeedProps {
  telemetry: EngineTelemetry;
}

export function TelemetryFeed({ telemetry }: TelemetryFeedProps) {
  return (
    <div className="fixed top-5 right-5 z-20 pointer-events-none hidden sm:flex flex-col items-end gap-1.5 font-mono text-[11px] text-zinc-400">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-zinc-200 tracking-wider font-semibold">SV-07 // TELEMETRY</span>
      </div>

      <div className="px-3 py-2 rounded-sm bg-black/50 backdrop-blur-md border border-white/5 flex flex-col gap-1 items-end min-w-[210px]">
        <div className="flex justify-between w-full">
          <span className="text-zinc-500">FPS:</span>
          <span className="text-cyan-400 font-bold">{telemetry.fps}</span>
        </div>
        <div className="flex justify-between w-full">
          <span className="text-zinc-500">PARTICLES:</span>
          <span className="text-zinc-300">{telemetry.particles.toLocaleString()}</span>
        </div>
        <div className="flex justify-between w-full">
          <span className="text-zinc-500">POINTER:</span>
          <span className="text-zinc-300">{telemetry.coords}</span>
        </div>
        <div className="flex justify-between w-full">
          <span className="text-zinc-500">RENDER PROFILE:</span>
          <span className="text-emerald-400 text-[10px]">{telemetry.tier}</span>
        </div>
      </div>
    </div>
  );
}
