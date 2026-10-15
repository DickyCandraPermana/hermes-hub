import { MISSIONS, getMissionById } from './missions.ts';

export interface TelemetryContext {
  fps?: number;
  particles?: number;
  coords?: string;
  tier?: string;
}

export interface TerminalAction {
  type: 'OPEN_MISSION' | 'TRIGGER_WARP' | 'SET_PALETTE' | 'CLEAR';
  payload?: string;
}

export interface TerminalResponse {
  success: boolean;
  output: string;
  action?: TerminalAction;
}

export function processCommand(cmd: string, context?: TelemetryContext): TerminalResponse {
  const trimmed = cmd.trim();
  if (!trimmed) {
    return { success: true, output: '' };
  }

  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (command) {
    case '/help':
    case 'help':
    case '?':
      return {
        success: true,
        output: [
          'SV-07 TACTICAL FLIGHT INTERFACE // PROTOCOL MATRIX',
          '──────────────────────────────────────────────────────────',
          '/help               Display active protocol directory',
          '/telemetry          Echo GPU, FPS, heap, and mesh metrics',
          '/mission <id>       Lock camera spline to mission dossier',
          '                    Options: oms | keyhub | gateway | mesh',
          '/warp               Trigger radial particle shockwave',
          '/palette <name>     Flip Fresnel iridescence shader matrix',
          '                    Options: cyan | green | amber | violet',
          '/clear              Flush active terminal buffer',
          '──────────────────────────────────────────────────────────'
        ].join('\n')
      };

    case '/telemetry':
    case 'telemetry':
      return {
        success: true,
        output: [
          '// SYSTEM TELEMETRY DUMP // SV-07 CORE',
          '──────────────────────────────────────────────────────────',
          `STATUS:       OPTIMAL [SEVENTH MONARCH OF THE SKY]`,
          `FPS:          ${context?.fps ?? 60} FRAME/SEC`,
          `NODES:        ${(context?.particles ?? 25000).toLocaleString()} GPU PARTICLES`,
          `COORDINATES:  ${context?.coords ?? '[0.00, 0.00]'}`,
          `PROFILE:      ${context?.tier ?? 'Tier 3 (Desktop)'}`,
          `CLEARANCE:    OMEGA // ZERO PERSONAL LEAK VERIFIED`,
          '──────────────────────────────────────────────────────────'
        ].join('\n')
      };

    case '/mission':
    case 'mission': {
      if (args.length === 0) {
        return {
          success: false,
          output: `SYNTAX ERROR: Target mission ID required.\nAvailable: ${MISSIONS.map(m => m.id).join(' | ')}`
        };
      }
      const target = getMissionById(args[0]);
      if (!target) {
        return {
          success: false,
          output: `MISSION TARGET '${args[0]}' NOT FOUND IN ARCHIVE MATRIX.`
        };
      }
      return {
        success: true,
        output: `[ENGAGING ${target.code}: ${target.title.toUpperCase()}]\nROTATING 3D SPLINE RIG... DOSSIER OPENED.`,
        action: {
          type: 'OPEN_MISSION',
          payload: target.id
        }
      };
    }

    case '/warp':
    case 'warp':
      return {
        success: true,
        output: 'ZERO-G WARP BURST ENGAGED // SHOCKWAVE DISPATCHED.',
        action: {
          type: 'TRIGGER_WARP'
        }
      };

    case '/palette':
    case 'palette': {
      const palette = (args[0] || 'cyan').toLowerCase();
      return {
        success: true,
        output: `FRESNEL SHADER PALETTE SHIFTED TO: ${palette.toUpperCase()}`,
        action: {
          type: 'SET_PALETTE',
          payload: palette
        }
      };
    }

    case '/clear':
    case 'clear':
      return {
        success: true,
        output: '',
        action: {
          type: 'CLEAR'
        }
      };

    default:
      return {
        success: false,
        output: `COMMAND NOT RECOGNIZED: '${cmd}'. TYPE '/help' FOR ACTIVE PROTOCOLS.`
      };
  }
}
