'use client';

import { useEffect, useRef } from 'react';
import { PortfolioEngine, EngineTelemetry } from '../../lib/portfolio/engine.ts';

interface PortfolioCanvasProps {
  onTelemetry?: (telemetry: EngineTelemetry) => void;
  engineRef?: React.MutableRefObject<PortfolioEngine | null>;
}

export function PortfolioCanvas({ onTelemetry, engineRef }: PortfolioCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new PortfolioEngine(canvasRef.current, {
      onTelemetry
    });

    if (engineRef) {
      engineRef.current = engine;
    }

    return () => {
      engine.dispose();
      if (engineRef) {
        engineRef.current = null;
      }
    };
  }, [onTelemetry, engineRef]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-auto z-0 block"
      style={{ touchAction: 'none' }}
    />
  );
}
