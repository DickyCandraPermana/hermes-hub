'use client';

import { useState, useRef, useEffect } from 'react';
import { processCommand, TerminalAction } from '../../lib/portfolio/terminal.ts';
import { EngineTelemetry } from '../../lib/portfolio/engine.ts';
import { cyberAudio } from '../../lib/portfolio/audio.ts';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: EngineTelemetry;
  onAction: (action: TerminalAction) => void;
}

interface LogEntry {
  type: 'input' | 'output' | 'error';
  text: string;
}

export function TerminalModal({ isOpen, onClose, telemetry, onAction }: TerminalModalProps) {
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      type: 'output',
      text: [
        'SV-07 TACTICAL HUD TERMINAL // SEVENTH MONARCH ARCHIVE',
        'Type "/help" for protocol directory, or click shortcuts below.',
        '──────────────────────────────────────────────────────────'
      ].join('\n')
    }
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    cyberAudio.playBlip(780, 0.03);

    const res = processCommand(cmd, {
      fps: telemetry.fps,
      particles: telemetry.particles,
      coords: telemetry.coords,
      tier: telemetry.tier
    });

    if (res.action?.type === 'CLEAR') {
      setLogs([]);
      setInputVal('');
      return;
    }

    setLogs((prev) => [
      ...prev,
      { type: 'input', text: `SV-07:~# ${cmd}` },
      { type: res.success ? 'output' : 'error', text: res.output }
    ]);

    if (res.action) {
      onAction(res.action);
    }

    setInputVal('');
  };

  const handleShortcut = (cmd: string) => {
    setInputVal(cmd);
    cyberAudio.playBlip(950, 0.03);
    const res = processCommand(cmd, {
      fps: telemetry.fps,
      particles: telemetry.particles,
      coords: telemetry.coords,
      tier: telemetry.tier
    });

    if (res.action?.type === 'CLEAR') {
      setLogs([]);
      setInputVal('');
      return;
    }

    setLogs((prev) => [
      ...prev,
      { type: 'input', text: `SV-07:~# ${cmd}` },
      { type: res.success ? 'output' : 'error', text: res.output }
    ]);

    if (res.action) {
      onAction(res.action);
    }
    setInputVal('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl h-[520px] rounded-sm bg-black border border-cyan-500/30 shadow-[0_0_50px_rgba(0,240,255,0.15)] flex flex-col font-mono text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-white/10 text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-white font-bold tracking-wider">SV-07 COMMAND HUD</span>
          </div>
          <button
            type="button"
            onClick={() => {
              cyberAudio.playBlip(600, 0.04);
              onClose();
            }}
            className="hover:text-white text-zinc-500 transition-colors"
          >
            [ESC / CLOSE]
          </button>
        </div>

        {/* Quick Command Bar */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-zinc-900/40 border-b border-white/5 text-[10px]">
          <span className="text-zinc-500 uppercase mr-1">PRESETS:</span>
          {['/help', '/telemetry', '/warp', '/palette green', '/palette violet', '/mission keyhub'].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => handleShortcut(cmd)}
              className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-cyan-950 hover:text-cyan-400 text-zinc-300 border border-white/5 hover:border-cyan-500/40 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Console Log Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 text-zinc-300 leading-relaxed whitespace-pre-wrap select-text">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={
                log.type === 'input'
                  ? 'text-cyan-400 font-bold'
                  : log.type === 'error'
                  ? 'text-rose-400'
                  : 'text-zinc-300'
              }
            >
              {log.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Interactive Prompt Input */}
        <form onSubmit={handleSubmit} className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-950 border-t border-white/10 gap-1.5">
          <span className="text-cyan-400 font-bold select-none text-[11px] sm:text-xs">SV-07:~#</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type command (/help)..."
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-white text-[11px] sm:text-xs font-mono placeholder:text-zinc-600"
          />
          <button
            type="submit"
            className="px-2.5 sm:px-3 py-1 rounded text-[10px] sm:text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors shrink-0"
          >
            EXECUTE
          </button>
        </form>
      </div>
    </div>
  );
}
