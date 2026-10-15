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
        'FROERYBELL CODEX // 01 SOUL • 07 SPHERES ARCHIVE',
        'Type "/help" for system commands, or select presets below.',
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

    cyberAudio.playRipple(780);

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
      { type: 'input', text: `froerybell:~# ${cmd}` },
      { type: res.success ? 'output' : 'error', text: res.output }
    ]);

    if (res.action) {
      onAction(res.action);
    }

    setInputVal('');
  };

  const handleShortcut = (cmd: string) => {
    setInputVal(cmd);
    cyberAudio.playRipple(880);
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
      { type: 'input', text: `froerybell:~# ${cmd}` },
      { type: res.success ? 'output' : 'error', text: res.output }
    ]);

    if (res.action) {
      onAction(res.action);
    }
    setInputVal('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-2xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl h-[520px] rounded-[2rem] bg-[#0c0919]/95 border border-white/[0.12] shadow-[0_20px_70px_rgba(0,0,0,0.85)] flex flex-col font-mono text-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white/[0.03] border-b border-white/[0.08] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-white font-medium tracking-wide">FROERYBELL COMMAND CODEX</span>
          </div>
          <button
            type="button"
            onClick={() => {
              cyberAudio.playRipple(520);
              onClose();
            }}
            className="hover:text-white text-zinc-500 transition-colors text-xs font-mono"
          >
            ✕ Close
          </button>
        </div>

        {/* Quick Command Bar */}
        <div className="flex flex-wrap items-center gap-1.5 px-5 py-2.5 bg-white/[0.015] border-b border-white/[0.06] text-[11px]">
          <span className="text-zinc-500 uppercase mr-1 text-[10px] tracking-wider">Presets:</span>
          {['/help', '/telemetry', '/warp', '/palette mint', '/palette rose', '/mission keyhub'].map((cmd) => (
            <button
              key={cmd}
              type="button"
              onClick={() => handleShortcut(cmd)}
              className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-purple-500/20 hover:text-purple-200 text-zinc-300 border border-white/[0.08] hover:border-purple-300/30 transition-colors"
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Console Log Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-2 text-zinc-300 leading-relaxed whitespace-pre-wrap select-text font-mono">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className={
                log.type === 'input'
                  ? 'text-purple-300 font-semibold'
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
        <form
          onSubmit={handleSubmit}
          className="flex items-center px-4 sm:px-5 py-3 bg-white/[0.03] border-t border-white/[0.08] gap-2"
        >
          <span className="text-purple-300 font-semibold select-none text-[11px] sm:text-xs">
            froerybell:~#
          </span>
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
            className="px-3 py-1 rounded-full text-[11px] font-medium bg-purple-500/20 text-purple-200 border border-purple-400/30 hover:bg-purple-500/30 transition-colors shrink-0"
          >
            Execute
          </button>
        </form>
      </div>
    </div>
  );
}
