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
  secondaryHex: string;
}

export const FRESNEL_PALETTES: FresnelColorAnchor[] = [
  { name: 'Lavender Moonstone', key: 'lavender', hex: '#D8B4FE', secondaryHex: '#818CF8' },
  { name: 'Iridescent Mint', key: 'mint', hex: '#6EE7B7', secondaryHex: '#38BDF8' },
  { name: 'Champagne Peach', key: 'champagne', hex: '#FDBA74', secondaryHex: '#FB7185' },
  { name: 'Ethereal Rose', key: 'rose', hex: '#FDA4AF', secondaryHex: '#E879F9' }
];

export function resolvePerformanceTier(attrs: DeviceAttributes): PerformanceTier {
  if (attrs.isMobile || attrs.screenWidth < 768) {
    return {
      tier: 1,
      name: 'Mobile Organic Tier',
      particleCount: 8000,
      monolithSubdivisions: 32,
      maxDpr: 1.0,
      enableBloom: false
    };
  }

  if (attrs.screenWidth < 1280) {
    return {
      tier: 2,
      name: 'Tablet Dreamscape Tier',
      particleCount: 12000,
      monolithSubdivisions: 48,
      maxDpr: 1.25,
      enableBloom: true
    };
  }

  return {
    tier: 3,
    name: 'Desktop Dreamscape Tier',
    particleCount: 16000,
    monolithSubdivisions: 64,
    maxDpr: 1.5,
    enableBloom: true
  };
}

export function getPaletteByKey(key: string): FresnelColorAnchor {
  const normalized = key.toLowerCase().trim();
  const found = FRESNEL_PALETTES.find(
    p => p.key === normalized || p.name.toLowerCase().includes(normalized)
  );
  return found || FRESNEL_PALETTES[0];
}
