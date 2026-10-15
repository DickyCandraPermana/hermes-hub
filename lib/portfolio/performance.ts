export interface DeviceAttributes {
  isMobile: boolean;
  devicePixelRatio: number;
  screenWidth: number;
}

export interface PerformanceTier {
  tier: 0 | 1 | 2 | 3;
  name: string;
  particleCount: number;
  monolithSubdivisions: number;
  maxDpr: number;
  enableBloom: boolean;
}

export interface FresnelColorAnchor {
  name: string;
  key: string;
  hex: string;
}

export const FRESNEL_PALETTES: FresnelColorAnchor[] = [
  { name: 'Hyper Cyan', key: 'cyan', hex: '#00F0FF' },
  { name: 'Radar Green', key: 'green', hex: '#00FF66' },
  { name: 'Hazard Amber', key: 'amber', hex: '#FF5500' },
  { name: 'Cyber Violet', key: 'violet', hex: '#B500FF' }
];

export function resolvePerformanceTier(attrs: DeviceAttributes): PerformanceTier {
  if (attrs.isMobile || attrs.screenWidth < 768) {
    return {
      tier: 1,
      name: 'Tier 1 (Mobile Terminal)',
      particleCount: 10000,
      monolithSubdivisions: 24,
      maxDpr: 1.0,
      enableBloom: false
    };
  }

  if (attrs.screenWidth < 1280) {
    return {
      tier: 2,
      name: 'Tier 2 (Laptop / Tablet)',
      particleCount: 18000,
      monolithSubdivisions: 36,
      maxDpr: 1.25,
      enableBloom: true
    };
  }

  return {
    tier: 3,
    name: 'Tier 3 (Desktop Workstation)',
    particleCount: 25000,
    monolithSubdivisions: 48,
    maxDpr: 1.5,
    enableBloom: true
  };
}

export function getPaletteByKey(key: string): FresnelColorAnchor {
  const normalized = key.toLowerCase().trim();
  const found = FRESNEL_PALETTES.find(p => p.key === normalized || p.name.toLowerCase().includes(normalized));
  return found || FRESNEL_PALETTES[0];
}
