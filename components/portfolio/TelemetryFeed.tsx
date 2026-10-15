'use client';

import { EngineTelemetry } from '../../lib/portfolio/engine.ts';

interface TelemetryFeedProps {
  telemetry: EngineTelemetry;
}

export function TelemetryFeed({ telemetry }: TelemetryFeedProps) {
  return (
    <div className="fixed top-5 right-5 z-20 pointer-events-none hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/[0.04] backdrop-blur-2xl border border-white/10 text-xs text-zinc-400 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
        <span className="text-zinc-300 font-medium">{telemetry.fps} FPS</span>
      </div>
      <span className="text-zinc-600">•</span>
      <span>{telemetry.particles.toLocaleString()} spores</span>
      <span className="text-zinc-600">•</span>
      <span className="text-purple-300/80 font-mono text-[11px]">{telemetry.coords}</span>
    </div>
  );
}
